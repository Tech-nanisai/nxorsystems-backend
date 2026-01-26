// backend/GlobalAccess/models/Counter.model.js
const mongoose = require("mongoose");
const superAdminDB = require("../db/superadmin.db");

const CounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    // IMPORTANT: start at 9999 → first ID = 10000
    seq: {
      type: Number,
      default: 9999,
    },
  },
  { versionKey: false }
);

module.exports = superAdminDB.model("GlobalCounter", CounterSchema);
