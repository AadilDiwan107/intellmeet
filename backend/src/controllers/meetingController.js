import Meeting from "../models/Meeting.js";
import redis from "../config/redis.js";

// CREATE meeting
export const createMeeting = async (req, res) => {
  try {
    const { title } = req.body;

    const meeting = await Meeting.create({
      title,
      host: req.user._id,
      meetingCode: Math.random().toString(36).substring(2, 8),
    });

    await redis.del(`meetings:${req.user._id}`);

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET all meetings
export const getMeetings = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("Checking Redis...");

    const cached = await redis.get(`meetings:${userId}`);

    if (cached) {
      console.log("⚡ From Redis");
      return res.json(JSON.parse(cached));
    }

    const meetings = await Meeting.find({ host: userId });

    await redis.set(
      `meetings:${userId}`,
      JSON.stringify(meetings),
      "EX",
      60
    );

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE meeting
export const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    await redis.del(`meetings:${req.user._id}`);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // optional: only host can update
    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // update fields
    meeting.title = req.body.title || meeting.title;

    await meeting.save();

    res.json({
      message: "Meeting updated",
      meeting,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DELETE meeting
export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    await redis.del(`meetings:${req.user._id}`);

    await meeting.deleteOne();
    res.json({ message: "Meeting deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};