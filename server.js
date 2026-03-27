import app from "./src/app.js";

const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});