const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const { generateOTP, sendOTPEmail } = require("../utils/email");

// Signup - Create new user and send OTP
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!existingUser.isVerified) {
        // User exists but not verified - resend OTP
        const otp = generateOTP();
        existingUser.otp = otp;
        existingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await existingUser.save();
        await sendOTPEmail(email, otp);

        return res.status(200).json({
          message: "OTP resent to your email",
          requiresVerification: true,
          email: email,
        });
      }
      return res.status(400).json({ error: "User already exists. Please login." });
    }

    // Create new user
    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      otp: otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await user.save();
    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: "OTP sent to your email. Please verify to complete registration.",
      requiresVerification: true,
      email: email,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: error.message || "Signup failed" });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Email already verified. Please login." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: "Email verified successfully! You can now login." });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: error.message || "Verification failed" });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ error: error.message || "Failed to resend OTP" });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOTPEmail(email, otp);

      return res.status(403).json({
        error: "Email not verified. OTP sent to your email.",
        requiresVerification: true,
        email: email,
      });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create session
    req.session.userId = user._id;
    req.session.email = user.email;
    req.session.name = user.name;
    req.session.isAuthenticated = true;

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Login failed" });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: error.message || "Logout failed" });
  }
};

// Check Session
exports.checkSession = async (req, res) => {
  try {
    if (req.session && req.session.isAuthenticated) {
      res.status(200).json({
        isAuthenticated: true,
        user: {
          id: req.session.userId,
          name: req.session.name,
          email: req.session.email,
        },
      });
    } else {
      res.status(200).json({ isAuthenticated: false });
    }
  } catch (error) {
    console.error("Check session error:", error);
    res.status(500).json({ error: error.message || "Session check failed" });
  }
};
