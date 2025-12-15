import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "Server running",
    time: new Date().toISOString(),
  });
});

const server = app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

console.log("WebSocket server initialized");

wss.on("connection", (ws) => {
  console.log("Client connected");

  let audioChunks = [];
  let intervalId;

  ws.send(
    JSON.stringify({
      type: "status",
      message: "Connected to live transcription server",
    })
  );

  ws.on("message", (data) => {
    if (data instanceof Buffer) {
      audioChunks.push(data);
    }
  });

  intervalId = setInterval(() => {
    if (audioChunks.length === 0) return;

    audioChunks = [];

    ws.send(
      JSON.stringify({
        type: "transcript",
        text: generateTranscript(),
        timestamp: Date.now(),
      })
    );
  }, 1000);

  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(intervalId);
    audioChunks = [];
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
  });
});

function generateTranscript() {
  const lines = [
    "This is a live transcription demo.",
    "The user is speaking continuously.",
    "Audio is streaming in real time.",
    "The system is processing speech data.",
    "This simulates low latency transcription.",
  ];

  return lines[Math.floor(Math.random() * lines.length)];
}

process.on("SIGINT", () => {
  wss.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
});