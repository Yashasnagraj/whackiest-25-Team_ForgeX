const nodemailer = require("nodemailer");

// Create transporter - use Gmail or any SMTP service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || "noreply@wanderforge.com",
    to: email,
    subject: "WanderForge - Email Verification OTP",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7); padding: 30px; border-radius: 16px; text-align: center;">
          <h1 style="color: white; font-size: 28px; margin: 0 0 10px 0;">WanderForge</h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">AI-Powered Travel Planning</p>
        </div>

        <div style="background: #1a1a2e; padding: 40px 30px; border-radius: 16px; margin-top: -20px;">
          <h2 style="color: #e0e0e0; text-align: center; margin-bottom: 20px;">Verify Your Email</h2>
          <p style="color: #a0a0a0; text-align: center; margin-bottom: 30px;">
            Use the following OTP to complete your verification:
          </p>

          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; font-size: 42px; letter-spacing: 12px; margin: 0; font-family: monospace;">${otp}</h1>
          </div>

          <p style="color: #a0a0a0; text-align: center; font-size: 14px;">
            This OTP is valid for <strong style="color: #a855f7;">10 minutes</strong>.
          </p>
          <p style="color: #666; text-align: center; font-size: 12px; margin-top: 20px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>

        <p style="color: #666; text-align: center; font-size: 12px; margin-top: 20px;">
          &copy; 2024 WanderForge. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    // For development, log OTP to console if email fails
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return true; // Return true anyway for development
  }
};

// Send SOS Alert email
const sendSOSEmail = async (toEmail, memberName, location, groupName) => {
  const mapUrl = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : null;

  const mailOptions = {
    from: process.env.EMAIL_USER || "noreply@wanderforge.com",
    to: toEmail,
    subject: `⚠️ WanderForge SOS Alert - ${memberName} is away from group!`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; border-radius: 16px; text-align: center;">
          <h1 style="color: white; font-size: 28px; margin: 0 0 10px 0;">⚠️ Safety Alert</h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">WanderForge Group Tracking</p>
        </div>

        <div style="background: #1a1a2e; padding: 40px 30px; border-radius: 16px; margin-top: -20px;">
          <h2 style="color: #ef4444; text-align: center; margin-bottom: 20px;">
            ${memberName} has moved away from the group!
          </h2>

          <p style="color: #a0a0a0; text-align: center; margin-bottom: 30px;">
            A member of your group <strong style="color: #a855f7;">"${groupName}"</strong> has moved outside the safe zone radius.
          </p>

          ${
            location
              ? `
          <div style="background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.3);">
            <p style="color: #e0e0e0; margin: 0 0 10px 0;"><strong>Last Known Location:</strong></p>
            <p style="color: #a0a0a0; margin: 0;">Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}</p>
            <a href="${mapUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; font-weight: bold;">
              📍 View on Google Maps
            </a>
          </div>
          `
              : `
          <p style="color: #a0a0a0; text-align: center;">
            Location data unavailable
          </p>
          `
          }

          <p style="color: #fbbf24; text-align: center; font-size: 16px; margin-top: 20px;">
            🔔 Please check on your group member!
          </p>
        </div>

        <p style="color: #666; text-align: center; font-size: 12px; margin-top: 20px;">
          &copy; 2024 WanderForge. Safety Sentinel Feature.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`SOS alert sent to ${toEmail} about ${memberName}`);
    return true;
  } catch (error) {
    console.error("SOS email send error:", error);
    return false;
  }
};

module.exports = { generateOTP, sendOTPEmail, sendSOSEmail };
