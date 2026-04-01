import { Router } from "express";
import { requireLogin, authorize } from "../middleware/authmiddleware.js";

const router = Router();

router.get("/data", requireLogin, async (req, res) => {
  const keyword = req.query.keyword || "";

  try {
    res.json({
      ok: true,
      keyword,
      data: [],
    });
  } catch (err) {
    console.error("查詢失敗:", err);
    res.status(500).json({ ok: false, msg: "查詢失敗" });
  }
});

router.get("/reports", authorize("VIEWER"), async (req, res) => {
  const scope = req.dataScope;

  try {
    res.json({
      ok: true,
      scope,
      data: [],
    });
  } catch (err) {
    console.error("報表查詢失敗:", err);
    res.status(500).json({ ok: false, msg: "報表查詢失敗" });
  }
});

export default router;