const ROLE_LEVELS = {
  VIEWER: 1,
  REGIONAL_MGR: 2,
  ADMIN: 3,
};

export function authorize(requiredRole = "VIEWER") {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ ok: false, msg: "連線超時，請重新登入" });
    }

    const { role = "VIEWER", scope = [] } = req.session.user;

    if ((ROLE_LEVELS[role] || 0) < (ROLE_LEVELS[requiredRole] || 0)) {
      return res.status(403).json({ ok: false, msg: "權限不足，無法執行此操作" });
    }

    req.dataScope = scope;
    next();
  };
}