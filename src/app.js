import express from "express";
import cookieSession from "cookie-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

// 引入路由
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import dataRouter from "./routes/data.js";

const app = express();

// 基礎設定
app.set("trust proxy", 1);
const isProd = process.env.NODE_ENV === "production";

// 設定 __dirname (ESM 必備)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中間件設定
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  cookieSession({
    name: "yb.sid",
    keys: [process.env.SESSION_KEY || "dev_secret"],
    httpOnly: true,
    sameSite: "lax",
    secure: isProd || !!process.env.K_SERVICE,
    maxAge: 1000 * 60 * 60 * 8,
  })
);

// --- 靜態檔案與特殊路徑開放區 ---

/**
 * 核心修正：手動開放位於 src/services 內的 JS 檔案
 * 這樣你的 HTML 寫 <script src="/services/login.js"></script> 才能抓到
 */

app.get("/services/permissions.js", (req, res) => {
  res.sendFile(path.join(__dirname, "services", "permissions.js"));
});

app.get("/services/login.js", (req, res) => {
  res.sendFile(path.join(__dirname, "services", "login.js"));
});

app.get("/services/search.js", (req, res) => {
  res.sendFile(path.join(__dirname, "services", "search.js"));
});

// 設定標準靜態資料夾 (public)
app.use(express.static(path.join(__dirname, "..", "public")));

// 設定 report 頁面的靜態目錄
app.use("/report", express.static(path.join(__dirname, "views", "report")));

// --- API 路由區 ---
app.use("/api", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api", dataRouter);

// --- 頁面渲染路由區 (HTML 送出) ---

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "search.html"));
});

app.get("/admin/permissions", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin", "permissions.html"));
});

app.get("/admin/audit-logs", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin", "audit-logs.html"));
});

// Report 頁面路徑
app.get("/report/customergrowth", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "report", "customergrowth.html"));
});

app.get("/report/salesanalytics", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "report", "salesanalytics.html"));
});

// 啟動前匯出
export default app;