import express from "express";
import { registerUser, loginUser, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// 🔐 Auth routes with rate limiting
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);

// 🔒 Protected routes

// GET profile (already working)
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

// 🔥 UPDATE profile (name + avatar upload)
router.put("/profile", protect, upload.single("avatar"), updateProfile);

export default router;