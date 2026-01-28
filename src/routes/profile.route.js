import express from "express";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

router.get("/", getProfile);
router.put("/", updateProfile);

export default router;