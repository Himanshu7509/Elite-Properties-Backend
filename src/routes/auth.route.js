import express from "express";
const router = express.Router();

import { signup, login, verifyEmailOTP, resendVerificationOTP, forgotPassword, verifyOTP, resetPassword, resendOTP } from "../controllers/auth.controller.js";

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-email-otp", verifyEmailOTP);
router.post("/resend-verification-otp", resendVerificationOTP);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOTP);

export default router;