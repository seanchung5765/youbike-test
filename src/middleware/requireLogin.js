export function requireLogin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ ok: false, msg: "連線超時，請重新登入" });
  }
  next();
}