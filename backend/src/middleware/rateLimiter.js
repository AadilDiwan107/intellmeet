import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 requests allowed
  message: {
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});