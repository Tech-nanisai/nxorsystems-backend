const mongoose = require("mongoose");
// 1. Import the specific connection
const clientDB = require("../Database/clientDB");

const PaymentSchema = new mongoose.Schema({
  clientID: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["Due", "Paid", "Overdue"], default: "Due" },
  date: { type: Date, default: Date.now },
}, { 
  timestamps: true,
  collection: 'client.payments' 
});

// 2. Use clientDB.model()
module.exports = clientDB.model("Payment", PaymentSchema);