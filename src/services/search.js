/**
 * 全域變數與初始化
 */
window.currentUser = null;

async function init() {
    // 取得所有需要的 DOM 元素
    const nameElement = document.getElementById("user-display-name"); // 姓名顯示區
    const roleElement = document.getElementById("user-role-badge");  // 角色標籤
    const userInfo = document.getElementById("userInfo");            // 另一種格式的姓名顯示
    const adminSection = document.getElementById("admin-section");   // 管理選單容器 1
    const adminMenu = document.getElementById("adminMenu");         // 管理選單容器 2 (如果有)

    try {
        console.log("正在初始化使用者資訊...");
        // 呼叫 API 取得登入資訊
        const res = await fetch("/api/me", { credentials: "include" });

        if (res.ok) {
            const data = await res.json();
            window.currentUser = data.user;

            if (!window.currentUser) {
                throw new Error("API 回傳成功但無使用者資料");
            }

            const { cn, username, role } = window.currentUser;
            const displayName = cn || username || "未知用戶";
            const userRole = (role || "VIEWER").toUpperCase();

            // 1. 顯示姓名與資訊 (相容兩種 HTML 結構)
            if (nameElement) nameElement.textContent = displayName;
            if (roleElement) roleElement.textContent = userRole;
            if (userInfo) userInfo.innerText = `${displayName} (${userRole})`;

            // 2. 角色判定與管理選單顯示
            if (userRole === "ADMIN") {
                console.log("權限確認：管理員，開啟管理面板");
                
                // 處理第一種 ID: admin-section
                if (adminSection) {
                    adminSection.classList.remove("hidden");
                    adminSection.style.display = "block"; // 雙重保險
                }
                
                // 處理第二種 ID: adminMenu
                if (adminMenu) {
                    adminMenu.classList.remove("hidden");
                }
            } else {
                console.log(`目前角色為: ${userRole}, 非 ADMIN，隱藏管理功能`);
            }

        } else {
            // API 回傳非 200 (例如 session 過期)，導回登入頁
            console.warn("Session 已過期或未登入");
            window.location.href = "/";
        }
    } catch (e) {
        console.error("初始化失敗:", e);
        if (nameElement) nameElement.textContent = "連線失敗";
        // 如果初始化失敗，保險起見導回登入頁
        setTimeout(() => { window.location.href = "/"; }, 2000);
    }
}

/**
 * 載入頁面 / 報表邏輯
 * 整合了 loadReport 與 loadPage
 */
function loadPage(target, url) {
    // 關鍵修正：確保抓到 iframe
    const frame = document.getElementById("reportFrame"); 
    const container = document.getElementById("reportContainer");
    const placeholder = document.getElementById("resultPlaceholder");
    const locationText = document.getElementById("current-location-text");
    const allLinks = document.querySelectorAll('.report-link');

    if (!frame) {
        console.error("錯誤：找不到 ID 為 reportFrame 的 iframe");
        return;
    }

    // 1. 處理選單樣式 (高亮當前選項)
    allLinks.forEach(l => l.classList.remove('bg-orange-600', 'text-white'));
    if (target && target.classList) {
        target.classList.add('bg-orange-600', 'text-white');
        if (locationText) locationText.textContent = target.innerText.trim();
    }

    // 2. 顯示容器，隱藏預設文字
    if (container) container.classList.remove("hidden");
    if (placeholder) placeholder.classList.add("hidden");

    // 3. 載入內容
    console.log("正在載入頁面:", url);
    frame.src = url;

    // 4. 自動關閉側邊欄
    window.dispatchEvent(new CustomEvent('close-sidebar'));
}

/**
 * 登出邏輯
 */
async function logout() {
    if (!confirm("確定要登出系統？")) return;

    try {
        const res = await fetch("/api/logout", {
            method: "POST",
            credentials: "include",
        });
        console.log("登出成功");
    } catch (e) {
        console.error("登出請求失敗:", e);
    } finally {
        // 無論 API 成功與否，最終都導向登入頁
        window.location.href = "/";
    }
}

/**
 * 事件綁定
 */
// 統一將函式掛載到 window，確保 HTML 的 onclick 能點到
window.loadPage = loadPage;
window.loadReport = loadPage;
window.logout = logout;

// 使用 DOMContentLoaded 確保 HTML 元素已載入後才執行 init
window.addEventListener("DOMContentLoaded", init);