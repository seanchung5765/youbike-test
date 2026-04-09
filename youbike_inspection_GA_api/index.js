require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const ldap = require("ldapjs");
const cors = require("cors");
const cron = require("node-cron");
const session = require("express-session");
const { authenticateWithLdap } = require("./services/ldapservice");

const app = express();

// =========================
// 1. 中間件與安全設定
// =========================
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || "youbike_dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // 開發環境設為 false
        maxAge: 1000 * 60 * 60 * 8, // 8 小時有效
    },
}));

// =========================
// 2. 資料庫連線池
// =========================
const db = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "youbike_db",
    waitForConnections: true,
    connectionLimit: 10,
}).promise();

// =========================
// 3. LDAP 同步核心邏輯 (成功關鍵)
// =========================
const performFullSync = async () => {
    const startTime = new Date();
    console.log(`\n[${startTime.toLocaleString()}] 🔄 開始執行 LDAP -> DB 全量同步...`);

    return new Promise((resolve, reject) => {
        const client = ldap.createClient({ url: process.env.LDAP_URL });
        const adminDN = process.env.LDAP_DN;

        client.bind(adminDN, process.env.LDAP_PASSWORD, (err) => {
            if (err) {
                client.destroy();
                return reject(new Error("LDAP Bind 失敗: " + err.message));
            }

            const usersFound = [];
            client.search(process.env.LDAP_BASE_DN, {
                scope: "sub",
                filter: "(gecos=*)",
                attributes: ["gecos"],
            }, (err, resSearch) => {
                if (err) { client.destroy(); return reject(err); }

                resSearch.on("searchEntry", (entry) => {
                    try {
                        const gecos = entry.pojo.attributes.find((a) => a.type === "gecos");
                        if (gecos && gecos.values.length > 0) {
                            const [id, name] = gecos.values[0].split("_");
                            if (id && name) {
                                usersFound.push([id.toUpperCase().trim(), name.trim()]);
                            }
                        }
                    } catch (parseErr) {
                        console.error("解析使用者失敗:", parseErr);
                    }
                });

                resSearch.on("end", async () => {
                    client.unbind();
                    if (usersFound.length === 0) {
                        console.log("⚠️ LDAP 未搜尋到任何使用者資料。");
                        return resolve({ total: 0, added: 0 });
                    }

                    try {
                        // 1. 同步前的資料量
                        const [beforeRows] = await db.query("SELECT COUNT(*) as count FROM permission_settings");
                        const countBefore = beforeRows[0].count;

                        // 2. 執行寫入 (使用 ON DUPLICATE 確保姓名有更新也會被計入)
                        const sql = `
                            INSERT INTO permission_settings (emp_id, emp_name) 
                            VALUES ? 
                            ON DUPLICATE KEY UPDATE emp_name = VALUES(emp_name)
                        `;
                        const [result] = await db.query(sql, [usersFound]);

                        // 3. 同步後的資料量
                        const [afterRows] = await db.query("SELECT COUNT(*) as count FROM permission_settings");
                        const countAfter = afterRows[0].count;

                        // 4. 計算數據
                        const newlyAdded = countAfter - countBefore; // 真正新插入的筆數
                        const totalInLdap = usersFound.length;      // LDAP 總筆數
                        const existedInDb = totalInLdap - newlyAdded; // 已存在筆數

                        // --- 終端機顯示區 ---
                        const endTime = new Date();
                        const duration = (endTime - startTime) / 1000;

                        console.log(`\n✅ 同步完成！耗時: ${duration} 秒`);
                        console.table({
                            "LDAP 掃描總數": { 數量: totalInLdap, 說明: "從 LDAP 伺服器抓到的原始資料" },
                            "本次新增入庫": { 數量: newlyAdded, 說明: "資料庫原本沒有的新工號" },
                            "原有重複筆數": { 數量: existedInDb, 說明: "已存在於資料庫，僅對齊姓名" },
                            "資料庫總筆數": { 數量: countAfter, 說明: "目前系統內的人員總數" }
                        });
                        console.log("--------------------------------------------------\n");

                        resolve({ total: totalInLdap, added: newlyAdded });
                    } catch (dbErr) { 
                        console.error("❌ 同步至資料庫時出錯:", dbErr);
                        reject(dbErr); 
                    }
                });

                resSearch.on("error", (searchErr) => { client.unbind(); reject(searchErr); });
            });
        });
    });
};

// =========================
// 4. API 路由
// =========================

// 登入 API
// 登入 API
app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const empId = String(username).trim().toUpperCase();

        // --- 1. LDAP 帳密驗證 ---
        const ldapUser = await authenticateWithLdap(empId, password);
        if (!ldapUser) {
            return res.status(401).json({ success: false, message: "帳號或密碼錯誤" });
        }

        // --- 2. 初始管理員檢查 (關鍵新增) ---
        // 取得 .env 中的 INITIAL_ADMIN_ID
        const initialAdmin = process.env.INITIAL_ADMIN_ID ? process.env.INITIAL_ADMIN_ID.toUpperCase() : null;

        if (initialAdmin && empId === initialAdmin) {
            // 如果是初始管理員，直接跳過資料庫檢查，給予最高權限
            req.session.user = {
                username: empId,
                cn: "系統初始管理員",
                role: "ADMIN",
                region: "STAFF", // 預設單位
                city: "ALL"
            };
            console.log(`[系統登入] 初始管理員 ${empId} 已透過環境變數授權登入`);
            return res.json({ success: true, user: req.session.user });
        }

        // --- 3. 一般人員資料庫權限檢查 ---
        const [rows] = await db.query(
            "SELECT * FROM permission_settings WHERE emp_id = ? AND back_role IS NOT NULL AND back_role != 'NONE'", 
            [empId]
        );

        if (rows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: "登入失敗：您尚未被授權進入系統，請聯繫管理員。" 
            });
        }

        // --- 4. 一般人員通過驗證 ---
        const dbUser = rows[0];
        req.session.user = {
            username: dbUser.emp_id,
            cn: dbUser.emp_name,
            role: dbUser.back_role,
            region: dbUser.org_region,
            city: dbUser.org_city
        };

        res.json({ success: true, user: req.session.user });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "伺服器內部錯誤" });
    }
});

// 手動觸發同步 API
app.get("/api/sync-all", async (req, res) => {
    try {
        const result = await performFullSync();
        res.json({ success: true, total: result.total, newly_added: result.added });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 獲取所有已設定權限的人員清單
// 💡 將 /api/all-permissions 改為前端呼叫的 /api/all-sync-data
app.get("/api/all-permissions", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM permission_settings");
        res.json(rows); // 這裡直接回傳 rows，符合前端 data.filter 的需求 [cite: 177, 223]
    } catch (err) {
        res.status(500).send("讀取失敗");
    }
});

app.get("/api/all-sync-data", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM permission_settings");
        res.json(rows); //
    } catch (err) {
        res.status(500).send("載入同步資料失敗");
    }
});

app.get("/api/me", (req, res) => {
    if (req.session && req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.status(404).json({ success: false, message: "未登入" });
    }
});

app.get("/api/users/:id", async (req, res) => {
    try {
        const empId = req.params.id.toUpperCase();
        const [rows] = await db.query("SELECT * FROM permission_settings WHERE emp_id = ?", [empId]);
        if (rows.length > 0) {
            // 回傳前端 lookupUser 預期的格式
            res.json({
                name: rows[0].emp_name,
                empId: rows[0].emp_id,
                savedData: rows[0]
            });
        } else {
            res.status(404).json({ message: "查無此工號" });
        }
    } catch (err) {
        res.status(500).send("資料庫查詢錯誤");
    }
});
// =========================
// 5. 自動排程與啟動
// =========================
cron.schedule("0 1 * * *", () => performFullSync().catch(console.error));


app.post("/api/permissions", async (req, res) => {
    try {
        const { empId, region, city, frontRole, backRole } = req.body;
        await db.query(
            `UPDATE permission_settings 
             SET org_region = ?, org_city = ?, front_role = ?, back_role = ? 
             WHERE emp_id = ?`,
            [region, city, frontRole, backRole, empId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "儲存失敗" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 伺服器啟動於 http://localhost:${PORT}`);
    console.log(`📊 手動同步網址: http://localhost:${PORT}/api/sync-all`);
});