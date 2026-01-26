// // backend/models/Admin.model.js
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const adminSchema = new mongoose.Schema(
//   {
//     fullName: { type: String, required: true },
//     email: { type: String, required: true, unique: true, lowercase: true },
//     passwordHash: { type: String, required: true },

//     // Role is still "admin" for now (we distinguish super admin via flag)
//     role: { type: String, enum: ["admin"], default: "admin" },

//     // 🔥 SUPER ADMIN FLAG (you can manually set true in MongoDB for yourself)
//     isSuperAdmin: { type: Boolean, default: false },

//     // 🔐 Optional: for management
//     isActive: { type: Boolean, default: true },
//     lastLoginAt: { type: Date, default: null },
//   },
//   { timestamps: true }
// );

// // helper method to compare passwords
// adminSchema.methods.checkPassword = function (plainPassword) {
//   return bcrypt.compare(plainPassword, this.passwordHash);
// };

// const Admin = mongoose.model("SuperAdmin", adminSchema);
// module.exports = Admin;
