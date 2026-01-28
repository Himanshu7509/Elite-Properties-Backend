import express from "express";
import { 
  getAllUsers,
  getUserById,
  deleteUser,
  getAllProperties,
  deleteProperty,
  updatePropertyStatus,
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
router.delete("/properties/:id", deleteProperty);
router.put("/properties/:id/status", updatePropertyStatus);

// Dashboard statistics
router.get("/stats", getAdminStats);

export default router;