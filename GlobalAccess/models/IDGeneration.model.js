// backend/GlobalAccess/models/IDGeneration.model.js
const mongoose = require("mongoose");
const superAdminDB = require("../db/superadmin.db");

const IDGenerationSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["Admin", "Student", "Client", "Employee", "Other"],
      required: true,
      index: true,
    },

    prefix: {
      type: String,
      required: true,
      uppercase: true,
    },

    sequenceNumber: {
      type: Number,
      required: true,
      min: 10000,
      index: true,
    },

    generatedID: {
      type: String,
      required: true,
      unique: true,
      match: /^[A-Z]{2,10}\d{5}$/,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    approved: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = superAdminDB.model("GlobalID", IDGenerationSchema);
