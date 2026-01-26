//backend/superadmin/models/SuperAdminauth.models.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const superAdminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },

    // NEW FIELDS
    phone: { type: String, default: "" },
    address: { type: String, default: "" },

    passwordHash: { type: String, required: true },

    role: { type: String, default: "superadmin" },
    isSuperAdmin: { type: Boolean, default: true },

    profilePicture: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compare password
superAdminSchema.methods.checkPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

module.exports = mongoose.model("SuperAdmin", superAdminSchema);