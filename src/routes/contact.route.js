import express from "express";
import { 
  createContact,
  getAllContacts,
  getContactById,
  deleteContact
} from "../controllers/contact.controller.js";
import { 
  scheduleMeeting,
  getAllScheduledMeetings,
  getScheduledMeetingById,
  updateMeetingStatus,
  deleteScheduledMeeting
} from "../controllers/scheduleMeeting.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/", createContact);
router.post("/schedule-meeting", scheduleMeeting);

// Protected admin routes
router.use(protect);
router.use(adminOnly);

// Contact management routes
router.get("/contacts", getAllContacts);
router.get("/contacts/:id", getContactById);
router.delete("/contacts/:id", deleteContact);

// Schedule meeting management routes
router.get("/schedule-meeting", getAllScheduledMeetings);
router.get("/schedule-meeting/:id", getScheduledMeetingById);
router.put("/schedule-meeting/:id/status", updateMeetingStatus);
router.delete("/schedule-meeting/:id", deleteScheduledMeeting);

export default router;