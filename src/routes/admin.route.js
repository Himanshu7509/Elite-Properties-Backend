import express from "express";
import { 
  getAllUsers,
  getUserById,
  deleteUser,
  getAllProperties,
  getPropertyById,
  deleteProperty,
  deletePropertyPicture,
  deletePropertyVideo,
  updatePropertyPost,
  updatePropertyStatus,
  createPropertyPost,
  uploadPropertyPictures,
  uploadPropertyVideos,
  upload,
  getAdminStats,
  getAllContactInquiries,
  getContactInquiryById,
  deleteContactInquiry,
  getAllScheduledMeetingsAdmin,
  getScheduledMeetingByIdAdmin,
  updateMeetingStatusAdmin,
  deleteScheduledMeetingAdmin
} from "../controllers/admin.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply protection middleware to all routes
router.use(protect);
router.use(adminOnly);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.delete("/users/:id", deleteUser);

// Property management routes
router.get("/properties", getAllProperties);
router.get("/properties/:id", getPropertyById);
router.post("/properties", createPropertyPost);
router.put("/properties/:id", updatePropertyPost);
router.post("/properties/upload/pictures/:id", upload.array('pictures', 10), uploadPropertyPictures);
router.post("/properties/upload/videos/:id", upload.array('videos', 5), uploadPropertyVideos);
router.delete("/properties/pictures/:id", deletePropertyPicture);
router.delete("/properties/videos/:id", deletePropertyVideo);
router.delete("/properties/:id", deleteProperty);
router.put("/properties/:id/status", updatePropertyStatus);

// Dashboard statistics
router.get("/stats", getAdminStats);

// Contact management routes
router.get("/contacts", getAllContactInquiries);
router.get("/contacts/:id", getContactInquiryById);
router.delete("/contacts/:id", deleteContactInquiry);

// Schedule meeting management routes
router.get("/schedule-meetings", getAllScheduledMeetingsAdmin);
router.get("/schedule-meetings/:id", getScheduledMeetingByIdAdmin);
router.put("/schedule-meetings/:id/status", updateMeetingStatusAdmin);
router.delete("/schedule-meetings/:id", deleteScheduledMeetingAdmin);

export default router;