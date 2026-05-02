import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

app.get("/", (req, res) => {
  res.send("IntellMeet API Running 🚀");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 🔥 JOIN ROOM (WITH USER NAME)
  socket.on("join-room", ({ roomId, name }) => {
  socket.join(roomId);

  const clients = io.sockets.adapter.rooms.get(roomId) || new Set();
  const isInitiator = clients.size === 1;

  socket.emit("room-joined", { isInitiator });

  socket.to(roomId).emit("user-joined", {
    userId: socket.id,
    name, // ✅ SEND NAME
  });
});

  // 🔥 CHAT MESSAGE (WITH NAME)
  socket.on("send-message", ({ roomId, message }) => {
    socket.to(roomId).emit("receive-message", {
      message,
      sender: socket.id,
      name: socket.data.name, // ✅ FIXED
      time: new Date().toLocaleTimeString(),
    });
  });

 // ✨ TYPING START
socket.on("typing", ({ roomId, name }) => {
  socket.to(roomId).emit("user-typing", {
    userId: socket.id,
    name,
  });
});

// ✨ TYPING STOP
socket.on("stop-typing", ({ roomId }) => {
  socket.to(roomId).emit("user-stop-typing", {
    userId: socket.id,
  });
});

  // 🔥 WEBRTC SIGNALING
  socket.on("offer", ({ offer, to }) => {
    socket.to(to).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ answer, to }) => {
    socket.to(to).emit("answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    socket.to(to).emit("ice-candidate", {
      candidate,
      from: socket.id,
    });
  });

  // 🔥 DISCONNECT
  socket.on("disconnect", () => {
    socket.broadcast.emit("user-left", {
      userId: socket.id,
    });
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});