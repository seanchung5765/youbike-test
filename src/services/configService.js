import fs from "fs/promises";
import { MAPPING_PATH, LOG_PATH } from "../config/paths.js";

export async function readMappings() {
  const raw = await fs.readFile(MAPPING_PATH, "utf-8");
  return JSON.parse(raw);
}

export async function saveMappings(data) {
  await fs.writeFile(MAPPING_PATH, JSON.stringify(data, null, 2));
}

export async function readAuditLogs() {
  const raw = await fs.readFile(LOG_PATH, "utf-8").catch(() => "[]");
  return JSON.parse(raw);
}