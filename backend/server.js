const express = require("express");
const cors = require("cors");

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", (req, res) => {
  const message =
    typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  setTimeout(() => {
    res.json({
      reply: `[mock] You said: ${message}`,
    });
  }, 600);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
