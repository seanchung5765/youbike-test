import { Router } from "express";
import { requireAdmin } from "../middleware/authmiddleware.js";
import {
  readMappings,
  saveMappings,
  readAuditLogs,
} from "../services/configservice.js";

const router = Router();

router.get("/config", requireAdmin, async (req, res) => {
  try {
    const data = await readMappings();
    res.json({ ok: true, data });
  } catch (err) {
    console.error("讀取設定失敗:", err);
    res.status(500).json({ ok: false, msg: "無法讀取映射設定檔" });
  }
});

router.post("/config/role", requireAdmin, async (req, res) => {
  try {
    const { ldap_group_dn, role_id } = req.body;

    if (!ldap_group_dn || !role_id) {
      return res.status(400).json({ ok: false, msg: "資料格式不正確" });
    }

    const data = await readMappings();

    if (!Array.isArray(data.roleMappings)) {
      data.roleMappings = [];
    }

    const exists = data.roleMappings.find(
      (m) => m.ldap_group_dn === ldap_group_dn
    );

    if (exists) {
      exists.role_id = role_id;
    } else {
      data.roleMappings.push({ ldap_group_dn, role_id });
    }

    await saveMappings(data);

    res.json({ ok: true, msg: "權限映射已成功更新" });
  } catch (err) {
    console.error("儲存設定失敗:", err);
    res.status(500).json({ ok: false, msg: "儲存設定失敗" });
  }
});

router.get("/logs", requireAdmin, async (req, res) => {
  try {
    const logs = await readAuditLogs();
    res.json({ ok: true, logs });
  } catch (err) {
    console.error("讀取日誌失敗:", err);
    res.status(500).json({ ok: false, msg: "讀取日誌失敗" });
  }
});

export default router;