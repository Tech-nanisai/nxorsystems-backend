// backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const superAdminAuthRoutes = require("./superadmin/routes/SuperAdminauth.routes");
const globalIDRoutes = require("./GlobalAccess/routes/idGeneration.routes");
const clientRegister = require("./client/routes/ClientRegister.routes");
const clientDashboardRoutes = require("./client/routes/ClientDashboard.routes");
const superadminDataRoutes = require("./superadmin/routes/SuperAdminData.routes");


const cors = require("cors");
const cookieParser = require("cookie-parser");

console.log("JWT_SECRET present? ->", !!process.env.JWT_SECRET);
console.log(
  "SPER_ADMIN_MONGO_URI present? ->",
  !!process.env.SPER_ADMIN_MONGO_URI
);

const app = express();

/* ===============================
   MAIN AUTH DATABASE
   (DO NOT TOUCH – already working)
================================ */
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => console.log("🔥 Auth DB connected"))
  .catch((err) => {
    console.error("❌ Auth DB connection FAILED:", err.message);
    process.exit(1);
  });

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Routes
app.use("/api/superadmin/auth", superAdminAuthRoutes);
app.use("/api/global/id", globalIDRoutes);
app.use("/api/client/auth", clientRegister);
app.use("/api/client/dashboard", clientDashboardRoutes);
app.use("/api/superadmin/data", superadminDataRoutes);
app.use("/api/superadmin/security", require("./superadmin/routes/ClientSecurity.routes"));

const PORT = process.env.PORT || 1981;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
