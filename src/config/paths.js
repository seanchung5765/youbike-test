import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.join(__dirname, "..", "..");
export const DATA_DIR = path.join(ROOT_DIR, "src", "data");

export const MAPPING_PATH = path.join(DATA_DIR, "mappings.json");
export const LOG_PATH = path.join(DATA_DIR, "audit_logs.json");