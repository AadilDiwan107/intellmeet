import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

// ✅ DB connect
connectDB();

// ✅ app create
const app = express();

// ✅ middleware
app.use(cors());
app.use(express.json());

// ✅ routes (IMPORTANT: app ke baad)
app.use("/api/auth", authRoutes);

// test route
app.get("/", (req, res) => {
  res.send("IntellMeet API Running 🚀");
});

// server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});