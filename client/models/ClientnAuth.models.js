// 
// module.exports = mongoose.model("Client", clientSchema);
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ❌ REMOVE THIS LINE: const clientDB = require("../database/clientDB");
// We want this model to use the DEFAULT connection (authentications)

const clientSchema = new mongoose.Schema(
  {
    clientID: { type: String, required: true, unique: true, uppercase: true, trim: true, sparse: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive", "Suspended", "Blocked"], default: "Active" },
    tokenVersion: { type: Number, default: 0 }, // For invalidating sessions
    lastLogin: { type: Date, default: null },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      marketingEmails: { type: Boolean, default: false },
    },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

clientSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// ✅ USE mongoose.model (This saves/reads from 'authentications' DB)
module.exports = mongoose.model("Client", clientSchema);