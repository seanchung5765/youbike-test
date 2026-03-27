export function requireAdmin(req, res, next) {
  if (req.session?.user?.role === "ADMIN") {
    return next();
  }
  return res.status(403).json({ ok: false, msg: "權限不足，僅限管理員操作" });
}