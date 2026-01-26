// backend/client/controllers/clientAuth.controller.js
const Client = require("../models/ClientnAuth.models");
const IDGeneration = require("../../GlobalAccess/models/IDGeneration.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/* ===============================
   GET CURRENT USER
================================ */
exports.getMe = async (req, res) => {
  try {
    // FIX: Use req.user.id (from JWT)
    const client = await Client.findById(req.user.id).select("-passwordHash -resetToken");
    if (!client) return res.status(404).json({ success: false, message: "Client not found" });

    res.json({ success: true, client });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
/* ===============================
   VERIFY CLIENT ID + FULL NAME
================================ */
exports.verifyClientID = async (req, res) => {
  try {
    const { clientID, fullName } = req.body;

    console.log("Received verification request:", { clientID, fullName }); // Debug log

    if (!clientID || !fullName) {
      return res.status(400).json({
        valid: false,
        message: "Client ID and Full Name are required",
      });
    }

    // 1. CLEAN INPUTS
    // Global IDs are usually UPPERCASE (e.g., CL10003), remove extra spaces
    const cleanID = clientID.trim().toUpperCase();
    const cleanName = fullName.trim();

    // 2. CHECK GLOBAL ID RECORDS
    const idRecord = await IDGeneration.findOne({
      generatedID: cleanID,
      category: "Client",
    });

    if (!idRecord) {
      return res.status(404).json({
        valid: false,
        message: "Client ID not found in system records",
      });
    }

    // 3. CHECK STATUS (Must be Active)
    if (idRecord.status !== "Active") {
      return res.status(403).json({
        valid: false,
        message: "Your ID is currently Inactive. Please contact your organization.",
      });
    }

    // 4. VERIFY NAME (Case Insensitive Match)
    // "Aettari Sailu" should match "AETTARI SAILU"
    if (idRecord.fullName.toLowerCase() !== cleanName.toLowerCase()) {
      return res.status(400).json({
        valid: false,
        message: "Full Name does not match the provided Client ID",
      });
    }

    // 4. CHECK IF ALREADY REGISTERED
    // We check using the clean Uppercase ID
    const existingClient = await Client.findOne({ clientID: cleanID });
    if (existingClient) {
      return res.status(400).json({
        valid: false,
        message: "This Client ID is already registered. Please Login.",
      });
    }

    // 5. SUCCESS
    return res.json({
      valid: true,
      message: "ID verified successfully",
    });

  } catch (err) {
    console.error("verifyClientID error:", err);
    return res.status(500).json({
      valid: false,
      message: "Server Error during verification",
    });
  }
};
/* ===============================
   REGISTER CLIENT
================================ */
exports.registerClient = async (req, res) => {
  try {
    const { clientID, fullName, email, password } = req.body;

    const formattedID = clientID.trim().toUpperCase();

    // 1. Check duplicates (ID or Email)
    const exists = await Client.findOne({
      $or: [{ clientID: formattedID }, { email: email.trim().toLowerCase() }]
    });

    if (exists) {
      return res.status(400).json({ message: "Client ID or Email already exists" });
    }

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create Client
    await Client.create({
      clientID: formattedID,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
    });

    res.json({ success: true, message: "Registration Successful" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

/* ===============================
   CLIENT LOGIN
================================ */
exports.loginClient = async (req, res) => {
  try {
    const { clientID, password } = req.body;

    const formattedID = clientID.trim().toUpperCase();

    const client = await Client.findOne({ clientID: formattedID });
    if (!client)
      return res.status(401).json({ message: "Invalid credentials" });

    const valid = await client.comparePassword(password);
    if (!valid)
      return res.status(401).json({ message: "Invalid credentials" });

    // --- NEW CHECK: Global ID Status ---
    // Even if registered, we must check if the Super Admin deactivated their ID in Global Records
    const globalIDRecord = await IDGeneration.findOne({ generatedID: formattedID });
    if (globalIDRecord && globalIDRecord.status !== "Active") {
      return res.status(403).json({
        message: "Your account is deactivated. Please contact your organization."
      });
    }
    // -----------------------------------

    const token = jwt.sign(
      { id: client._id, role: "client", tokenVersion: client.tokenVersion || 0 }, // Include tokenVersion in JWT for future validation
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    client.lastLogin = new Date();
    await client.save();

    res.json({
      success: true,
      token,
      role: "client",
      user: {
        fullName: client.fullName,
        email: client.email,
        clientID: client.clientID
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ===============================
   FORGOT PASSWORD
================================ */
const sendForgotPasswordEmail = require("../../mails/ForgotPasswordMailer");

/* ===============================
   FORGOT PASSWORD
================================ */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body; // Only ask for email, less friction

    const client = await Client.findOne({
      email: email.trim().toLowerCase()
    });

    if (!client) {
      return res.json({ success: false, message: "Email is not registered with us." });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving to DB (Security best practice)
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    client.resetToken = resetTokenHash;
    client.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 Minutes
    await client.save();

    // Send Email with the RAW token
    const emailSent = await sendForgotPasswordEmail(client.email, resetToken, client.fullName);

    if (emailSent) {
      res.json({ success: true, message: "Reset link sent to your email." });
    } else {
      res.status(500).json({ success: false, message: "Failed to send email. Please try again later." });
    }

  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* ===============================
   RESET PASSWORD
================================ */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash the received token to compare with DB
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const client = await Client.findOne({
      resetToken: resetTokenHash,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!client)
      return res.status(400).json({ message: "Invalid or expired token" });

    client.passwordHash = await bcrypt.hash(password, 10);
    client.resetToken = undefined;
    client.resetTokenExpiry = undefined;
    client.tokenVersion = (client.tokenVersion || 0) + 1; // Logout all devices
    await client.save();

    res.json({ success: true, message: "Password reset successfully. Please login." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* ===============================
   UPDATE PROFILE (Name, Phone, Pic)
================================ */
exports.updateProfile = async (req, res) => {
  try {
    // 1. USE ID FROM TOKEN (Not clientID)
    const userId = req.user.id;

    // 2. Destructure Data
    const { fullName, phone, profilePicture, preferences } = req.body;

    // 3. Find Client by MongoDB _id
    const client = await Client.findById(userId);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // 4. Update Fields
    if (fullName) client.fullName = fullName;

    // These will now work because we added them to the Schema!
    if (phone) client.phone = phone;
    if (profilePicture) client.profilePicture = profilePicture;
    if (preferences) client.preferences = preferences;

    // 5. Save
    await client.save();

    // 6. Respond
    const clientData = client.toObject();
    delete clientData.passwordHash;
    delete clientData.resetToken;

    res.json({
      success: true,
      message: "Profile updated successfully",
      client: clientData
    });

  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   CHANGE PASSWORD
================================ */
exports.changePassword = async (req, res) => {
  try {
    // FIX: Use req.user.id
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const client = await Client.findById(userId);
    if (!client) return res.status(404).json({ message: "Client not found" });

    // 1. Verify Current Password
    // FIX: Check against 'passwordHash', not 'password'
    const isMatch = await bcrypt.compare(currentPassword, client.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // 2. Hash New Password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    client.passwordHash = passwordHash; // FIX: Update 'passwordHash'

    await client.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};