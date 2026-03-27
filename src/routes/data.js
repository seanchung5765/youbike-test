import { Router } from "express";
import { requireLogin } from "../middleware/requireLogin.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.get("/data", requireLogin, async (req, res) => {
  const keyword = req.query.keyword || "";

  try {
    res.json({ ok: true, keyword, data: [] });
  } catch (err) {
    res.status(500).json({ ok: false, msg: "查詢失敗" });
  }
});

router.get("/reports", authorize("VIEWER"), async (req, res) => {
  const scope = req.dataScope;

  try {
    // 之後這邊請改成參數化查詢，不要自己串 SQL
    res.json({
      ok: true,
      scope,
      data: [],
    });
  } catch (err) {
    res.status(500).json({ ok: false, msg: "報表查詢失敗" });
  }
});

export default router;