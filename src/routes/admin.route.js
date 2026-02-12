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
  updatePropertyStatus,
  createPropertyPost,
  uploadPropertyPictures,
  uploadPropertyVideos,
  getAdminStats
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
router.post("/properties/upload/pictures/:id", upload.array('pictures', 10), uploadPropertyPictures);
router.post("/properties/upload/videos/:id", upload.array('videos', 5), uploadPropertyVideos);
router.delete("/properties/pictures/:id", deletePropertyPicture);
router.delete("/properties/videos/:id", deletePropertyVideo);
router.delete("/properties/:id", deleteProperty);
router.put("/properties/:id/status", updatePropertyStatus);

// Dashboard statistics
router.get("/stats", getAdminStats);

export default router;