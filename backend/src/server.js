import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

// ✅ DB connect
connectDB();

// ✅ app create
const app = express();

// ✅ middleware
app.use(cors());
app.use(express.json());

// ✅ routes
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

// ✅ test route
app.get("/", (req, res) => {
  res.send("IntellMeet API Running 🚀");
});

// 🔥 CREATE HTTP SERVER
const server = http.createServer(app);

// 🔥 SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ✅ SOCKET LOGIC
// ✅ SOCKET LOGIC
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 🔥 CHAT MESSAGE
  socket.on("send-message", ({ roomId, message }) => {
    console.log("Message:", message);

    socket.to(roomId).emit("receive-message", {
      message,
      sender: socket.id,
    });

    // 🔔 NOTIFICATION
    socket.to(roomId).emit("notification", {
      type: "message",
      text: `New message`,
    });
  });

  // 🔥 JOIN ROOM
  socket.on("join-room", (roomId) => {
    console.log("JOIN EVENT RECEIVED:", roomId);

    socket.join(roomId);

    const clients = io.sockets.adapter.rooms.get(roomId) || new Set();
    const isInitiator = clients.size === 1;

    console.log("User joined room:", roomId);

    socket.emit("room-joined", { isInitiator });

    // 🔔 FIXED
    socket.to(roomId).emit("user-joined", {
      userId: socket.id,
      message: `User joined`,
    });
  });

  // 🔥 SIGNALING
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
    console.log("User disconnected:", socket.id);

    // 🔔 FIXED
    socket.broadcast.emit("user-left", {
      userId: socket.id,
      message: `User left`,
    });
  });
});

// 🚀 START SERVER
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});