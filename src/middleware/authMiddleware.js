const ROLE_LEVELS = {
  VIEWER: 1,
  REGIONAL_MGR: 2,
  ADMIN: 3,
};

/**
 * 核心權限驗證中間件
 * @param {string|null} requiredRole - 要求的角色名稱。若為 null 則僅檢查是否登入。
 */
export function authorize(requiredRole = null) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({
        ok: false,
        msg: "連線超時，請重新登入",
      });
    }

    const { role = "VIEWER", scope = [] } = req.session.user;

    req.dataScope = Array.isArray(scope) ? scope : [scope].filter(Boolean);

    if (requiredRole) {
      const userLevel = ROLE_LEVELS[role] || 0;
      const requiredLevel = ROLE_LEVELS[requiredRole] || 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          ok: false,
          msg:
            requiredRole === "ADMIN"
              ? "權限不足，僅限管理員操作"
              : "權限不足，無法執行此操作",
        });
      }
    }

    next();
  };
}

export const requireLogin = authorize();
export const requireAdmin = authorize("ADMIN");