import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mappingsPath = path.join(__dirname, "../data/mappings.json");
const auditLogsPath = path.join(__dirname, "../data/audit_logs.json");

export async function readMappings() {
  const raw = await fs.readFile(mappingsPath, "utf-8");
  return JSON.parse(raw);
}

export async function saveMappings(data) {
  await fs.writeFile(mappingsPath, JSON.stringify(data, null, 2), "utf-8");
}

export async function readAuditLogs() {
  const raw = await fs.readFile(auditLogsPath, "utf-8");
  return JSON.parse(raw);
}