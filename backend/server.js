const express = require("express");
const cors = require("cors");

const app = express();
const DEFAULT_PORT = 8000;
const MAX_PORT = DEFAULT_PORT + 20;

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

function startServer(port) {
  const server = app.listen(port, () => {
    if (port !== DEFAULT_PORT) {
      console.log(`Port ${DEFAULT_PORT} was in use. Using port ${port} instead.`);
    }
    console.log(`Server is running on http://localhost:${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && port < MAX_PORT) {
      console.log(`Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    if (err.code === "EADDRINUSE") {
      console.error(`No free port found between ${DEFAULT_PORT} and ${MAX_PORT}.`);
      process.exit(1);
    }

    console.error(err);
    process.exit(1);
  });
}

startServer(DEFAULT_PORT);
