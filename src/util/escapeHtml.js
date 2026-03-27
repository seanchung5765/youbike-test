/**
 * 將字串中的特殊字元轉換為 HTML 安全字元
 * 防止 XSS 攻擊（例如 <script> 注入）
 */
export function escapeHtml(input = "") {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}