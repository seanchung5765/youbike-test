import express from "express";
import cookieSession from "cookie-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import dataRouter from "./routes/data.js";

const app = express();

app.set("trust proxy", 1);

const isProd = process.env.NODE_ENV === "production";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  cookieSession({
    name: "yb.sid",
    keys: [process.env.SESSION_KEY || "dev_secret"],
    httpOnly: true,
    sameSite: "lax",
    secure: isProd || !!process.env.K_SERVICE,
    maxAge: 1000 * 60 * 60 * 8,
  })
);

app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/report", express.static(path.join(__dirname, "..", "report")));

app.use("/api", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api", dataRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

export default app;