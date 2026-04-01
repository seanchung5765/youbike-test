import { Router } from "express";
import { loginUser } from "../services/authService.js";

const router = Router();
const INITIAL_ADMIN_ID = process.env.INITIAL_ADMIN_ID;

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ ok: false, msg: "請提供帳號與密碼" });
  }



  // 🔥 2. 其他人走 LDAP
  try {
    const user = await loginUser(username, password);

    if (!user) {
      return res.status(401).json({
        ok: false,
        msg: "帳號或密碼錯誤，或無系統權限"
      });
    }

    if (user.username === INITIAL_ADMIN_ID) {
      console.log(`[Auth] 偵測到初始管理員 ${user.username}，自動賦予 ADMIN 權限`);
      user.role = "ADMIN";
      user.unit = "總部管理層"; // 也可以自訂 unit
    }

    req.session.user = user;

    return res.json({
      ok: true,
      user
    });

  } catch (err) {
    console.error("登入錯誤:", err);
    return res.status(500).json({
      ok: false,
      msg: "伺服器錯誤"
    });
  }
});

router.post("/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true, msg: "已登出" });
});

router.get("/me", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ ok: false, msg: "尚未登入" });
  }
  res.json({ ok: true, user: req.session.user });
});

export default router;