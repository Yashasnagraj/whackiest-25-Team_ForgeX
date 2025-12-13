const express = require("express");
const {
  signupValidator,
  loginValidator,
  otpValidator,
} = require("../middlewares/validators");
const {
  signup,
  login,
  verifyOTP,
  resendOTP,
  logout,
  checkSession,
} = require("../controllers/auth.controller");
const { sendSOSEmail } = require("../utils/email");

const router = express.Router();

// Auth routes
router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);
router.post("/verify-otp", otpValidator, verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/logout", logout);
router.get("/check-session", checkSession);

// SOS Alert route
router.post("/sos/alert", async (req, res) => {
  try {
    const { memberName, location, recipients, groupName } = req.body;

    if (!memberName || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: memberName, recipients",
      });
    }

    console.log(`[SOS] Received alert for ${memberName} in group "${groupName}"`);
    console.log(`[SOS] Sending to ${recipients.length} recipients`);

    let successCount = 0;
    let failCount = 0;

    // Send email to each recipient
    for (const recipient of recipients) {
      if (recipient.email) {
        const sent = await sendSOSEmail(
          recipient.email,
          memberName,
          location,
          groupName || "Unknown Group"
        );
        if (sent) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    console.log(`[SOS] Alert complete: ${successCount} sent, ${failCount} failed`);

    res.json({
      success: true,
      message: `SOS alert sent to ${successCount} recipients`,
      successCount,
      failCount,
    });
  } catch (error) {
    console.error("[SOS] Error processing alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send SOS alert",
      error: error.message,
    });
  }
});

module.exports = router;
