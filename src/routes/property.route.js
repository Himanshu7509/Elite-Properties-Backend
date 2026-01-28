import express from "express";
import { 
  createPropertyPost,
  getAllPropertyPosts,
  getPropertyPostById,
  getMyPropertyPosts,
  updatePropertyPost,
  deletePropertyPost,
  getPropertyStats,
  uploadPropertyPictures,
  uploadPropertyVideos,
  deletePropertyPicture,
  deletePropertyVideo,
  upload
} from "../controllers/property.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/posts", getAllPropertyPosts);
router.get("/posts/:id", getPropertyPostById);
router.get("/stats", getPropertyStats);

// Protected routes
router.use(protect);

router.post("/posts", createPropertyPost);
router.get("/posts/user/my-posts", getMyPropertyPosts);
router.put("/posts/:id", updatePropertyPost);
router.delete("/posts/:id", deletePropertyPost);

// Media upload routes
router.post("/upload/pictures/:id", upload.array('pictures', 10), uploadPropertyPictures);
router.post("/upload/videos/:id", upload.array('videos', 5), uploadPropertyVideos);
router.delete("/pictures/:id", deletePropertyPicture);
router.delete("/videos/:id", deletePropertyVideo);

export default router;