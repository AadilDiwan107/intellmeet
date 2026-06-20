import express from "express";
import {
  createMeeting,
  getMeetings,
  deleteMeeting,
} from "../controllers/meetingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { updateMeeting } from "../controllers/meetingController.js";

const router = express.Router();

//create meeting orut
router.post("/", protect, createMeeting);

// get meeting rout 
router.get("/", protect, getMeetings);

//delete meeting rout
router.delete("/:id", protect, deleteMeeting);

//update meeting rout
router.put("/:id", protect, updateMeeting);


export default router;