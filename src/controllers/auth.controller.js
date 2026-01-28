import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Auth from "../model/auth.model.js";
import Profile from "../model/profile.model.js";
import resend from "../config/email.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_jwt_secret_key_for_development", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  try {
    const { fullName, email, phoneNo, password } = req.body;

    // Check if user already exists
    const userExists = await Auth.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiration time (5 minutes from now)
    const otpExpires = Date.now() + 5 * 60 * 1000;

    // Create new user with OTP verification
    const user = await Auth.create({
      fullName,
      email,
      phoneNo,
      password,
      resetPasswordToken: otp,
      resetPasswordExpires: otpExpires
    });

    try {
      // Send OTP via email using Resend
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@mail.eliteassociate.in',
        to: email,
        subject: 'Email Verification OTP - Elite Properties',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">Elite Properties</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; text-align: center; font-size: 16px;">Real Estate Management Platform</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Hello ${fullName},</h2>
                        
                        <div style="color: #555; line-height: 1.6; font-size: 16px;">
                          <p style="margin: 0 0 15px 0;">Thank you for registering with Elite Properties!</p>
                          <p style="margin: 0 0 15px 0;">Please use the following One-Time Password (OTP) to verify your email address:</p>
                          
                          <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; padding: 15px 25px; background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px;">
                              <h3 style="color: #667eea; margin: 0; font-size: 24px; letter-spacing: 3px;">${otp}</h3>
                            </div>
                          </div>
                          
                          <p style="margin: 0 0 15px 0;">This OTP will expire in <strong>5 minutes</strong>. If you did not register for an account, please ignore this email.</p>
                          
                          <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-weight: bold;">Security Notice:</p>
                            <p style="margin: 5px 0 0 0; color: #856404;">Never share this OTP with anyone. Elite Properties support will never ask for your OTP.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                        <div style="text-align: center; color: #666; font-size: 14px;">
                          <p style="margin: 0 0 10px 0;">
                            <strong>Need Help?</strong> Contact our support team
                          </p>
                          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                          <p style="margin: 0;">
                            © ${new Date().getFullYear()} Elite Properties. All rights reserved.
                          </p>
                          <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
                            This email was sent to ${email} regarding your Elite Properties account.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });

      // Create profile for the user with minimal required data
      const profileData = {
        authId: user._id,
        fullName,  // Populated from signup
        email,     // Populated from signup
        phoneNo,   // Populated from signup
        // All other fields are optional
      };
      
      const profile = await Profile.create(profileData);

      res.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email using the OTP sent to your email address.",
        userId: user._id,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNo: user.phoneNo,
        },
        profile: {
          id: profile._id,
          authId: profile.authId,
          fullName: profile.fullName,
          email: profile.email,
          phoneNo: profile.phoneNo,
        }
      });
    } catch (profileError) {
      // If profile creation fails, delete the user we just created
      await Auth.findByIdAndDelete(user._id);
      
      return res.status(500).json({
        success: false,
        message: "User registration failed due to profile creation error",
        error: profileError.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if it's admin login
    const envAdminEmail = process.env.ADMIN_EMAIL?.replace(/"/g, '');
    const envAdminPassword = process.env.ADMIN_PASSWORD?.replace(/"/g, '');
    
    if (email === envAdminEmail && password === envAdminPassword) {
      // Check if admin user exists in database, if not create it
      let adminUser = await Auth.findOne({ email: envAdminEmail });
      
      if (!adminUser) {
        // Create admin user if not exists
        adminUser = new Auth({
          fullName: 'Admin User',
          email: envAdminEmail,
          phoneNo: '0000000000',
          password: envAdminPassword,
          role: 'admin'
        });
        await adminUser.save();
      } else if (adminUser.role !== 'admin') {
        // Update role to admin if needed
        adminUser.role = 'admin';
        await adminUser.save();
      }

      const token = generateToken(adminUser._id);

      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        token,
        user: {
          id: adminUser._id,
          fullName: adminUser.fullName,
          email: adminUser.email,
          phoneNo: adminUser.phoneNo,
          role: adminUser.role,
        }
      });
    }

    // Regular user login
    const user = await Auth.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check for password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNo: user.phoneNo,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Verify email OTP
// @route   POST /api/auth/verify-email-otp
// @access  Public
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    // Find user by email
    const user = await Auth.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if OTP is valid and not expired
    if (user.resetPasswordToken !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Clear the OTP fields and update user status
    await Auth.findByIdAndUpdate(user._id, {
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined
    }, { new: true });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Resend email verification OTP
// @route   POST /api/auth/resend-verification-otp
// @access  Public
export const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Find user by email
    const user = await Auth.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate a new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiration time (5 minutes from now)
    const otpExpires = Date.now() + 5 * 60 * 1000;

    // Update user with new OTP
    await Auth.findByIdAndUpdate(user._id, {
      resetPasswordToken: otp,
      resetPasswordExpires: otpExpires
    }, { new: true });

    // Send OTP via email using Resend
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@mail.eliteassociate.in',
        to: email,
        subject: 'Email Verification OTP - Elite Properties (Resend)',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">Elite Properties</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; text-align: center; font-size: 16px;">Real Estate Management Platform</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Hello ${user.fullName},</h2>
                        
                        <div style="color: #555; line-height: 1.6; font-size: 16px;">
                          <p style="margin: 0 0 15px 0;">You have requested to resend the email verification OTP for your Elite Properties account.</p>
                          <p style="margin: 0 0 15px 0;">Please use the following One-Time Password (OTP) to verify your email address:</p>
                          
                          <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; padding: 15px 25px; background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px;">
                              <h3 style="color: #667eea; margin: 0; font-size: 24px; letter-spacing: 3px;">${otp}</h3>
                            </div>
                          </div>
                          
                          <p style="margin: 0 0 15px 0;">This OTP will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
                          
                          <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-weight: bold;">Security Notice:</p>
                            <p style="margin: 5px 0 0 0; color: #856404;">Never share this OTP with anyone. Elite Properties support will never ask for your OTP.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                        <div style="text-align: center; color: #666; font-size: 14px;">
                          <p style="margin: 0 0 10px 0;">
                            <strong>Need Help?</strong> Contact our support team
                          </p>
                          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                          <p style="margin: 0;">
                            © ${new Date().getFullYear()} Elite Properties. All rights reserved.
                          </p>
                          <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
                            This email was sent to ${email} regarding your Elite Properties account.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });

      res.status(200).json({
        success: true,
        message: 'OTP resent to your email address'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Resend verification OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Forgot password - send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Find user by email
    const user = await Auth.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiration time (5 minutes from now)
    const otpExpires = Date.now() + 5 * 60 * 1000;

    // Save OTP and expiration to user document without triggering password hash
    await Auth.findByIdAndUpdate(user._id, {
      resetPasswordToken: otp,
      resetPasswordExpires: otpExpires
    }, { new: true });

    // Send OTP via email using Resend with enhanced template
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@mail.eliteassociate.in',
        to: email,
        subject: 'Password Reset OTP - Elite Properties',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">Elite Properties</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; text-align: center; font-size: 16px;">Real Estate Management Platform</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Hello ${user.fullName},</h2>
                        
                        <div style="color: #555; line-height: 1.6; font-size: 16px;">
                          <p style="margin: 0 0 15px 0;">You have requested to reset your password for your Elite Properties account.</p>
                          <p style="margin: 0 0 15px 0;">Please use the following One-Time Password (OTP) to proceed with resetting your password:</p>
                          
                          <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; padding: 15px 25px; background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px;">
                              <h3 style="color: #667eea; margin: 0; font-size: 24px; letter-spacing: 3px;">${otp}</h3>
                            </div>
                          </div>
                          
                          <p style="margin: 0 0 15px 0;">This OTP will expire in <strong>5 minutes</strong>. If you did not request this password reset, please ignore this email or contact our support team.</p>
                          
                          <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-weight: bold;">Security Notice:</p>
                            <p style="margin: 5px 0 0 0; color: #856404;">Never share this OTP with anyone. Elite Properties support will never ask for your OTP.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                        <div style="text-align: center; color: #666; font-size: 14px;">
                          <p style="margin: 0 0 10px 0;">
                            <strong>Need Help?</strong> Contact our support team
                          </p>
                          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                          <p style="margin: 0;">
                            © ${new Date().getFullYear()} Elite Properties. All rights reserved.
                          </p>
                          <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
                            This email was sent to ${email} regarding your Elite Properties account.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });

      res.status(200).json({
        success: true,
        message: 'OTP sent to your email address'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    // Find user by email
    const user = await Auth.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if OTP is valid and not expired
    if (user.resetPasswordToken !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, new password, and confirm password'
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    // Check password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user by email
    const user = await Auth.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if OTP is valid and not expired
    if (user.resetPasswordToken !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Update password and clear reset tokens
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await Auth.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined
    }, { new: true });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Find user by email
    const user = await Auth.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiration time (5 minutes from now)
    const otpExpires = Date.now() + 5 * 60 * 1000;

    // Save OTP and expiration to user document without triggering password hash
    await Auth.findByIdAndUpdate(user._id, {
      resetPasswordToken: otp,
      resetPasswordExpires: otpExpires
    }, { new: true });

    // Send OTP via email using Resend
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@mail.eliteassociate.in',
        to: email,
        subject: 'Password Reset OTP - Elite Properties (Resend)',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">Elite Properties</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; text-align: center; font-size: 16px;">Real Estate Management Platform</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Hello ${user.fullName},</h2>
                        
                        <div style="color: #555; line-height: 1.6; font-size: 16px;">
                          <p style="margin: 0 0 15px 0;">You have requested to resend the OTP for resetting your password for your Elite Properties account.</p>
                          <p style="margin: 0 0 15px 0;">Please use the following One-Time Password (OTP) to proceed with resetting your password:</p>
                          
                          <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; padding: 15px 25px; background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px;">
                              <h3 style="color: #667eea; margin: 0; font-size: 24px; letter-spacing: 3px;">${otp}</h3>
                            </div>
                          </div>
                          
                          <p style="margin: 0 0 15px 0;">This OTP will expire in <strong>5 minutes</strong>. If you did not request this password reset, please ignore this email or contact our support team.</p>
                          
                          <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-weight: bold;">Security Notice:</p>
                            <p style="margin: 5px 0 0 0; color: #856404;">Never share this OTP with anyone. Elite Properties support will never ask for your OTP.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                        <div style="text-align: center; color: #666; font-size: 14px;">
                          <p style="margin: 0 0 10px 0;">
                            <strong>Need Help?</strong> Contact our support team
                          </p>
                          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                          <p style="margin: 0;">
                            © ${new Date().getFullYear()} Elite Properties. All rights reserved.
                          </p>
                          <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
                            This email was sent to ${email} regarding your Elite Properties account.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });

      res.status(200).json({
        success: true,
        message: 'OTP resent to your email address'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};