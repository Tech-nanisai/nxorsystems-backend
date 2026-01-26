const jwt = require("jsonwebtoken");
const Client = require("../../client/models/ClientnAuth.models");

module.exports = async function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // --- SESSION REVOCATION CHECK ---
    // If the user is a Client, verify their token version matches the DB
    if (decoded.role === "client") {
      const client = await Client.findById(decoded.id).select("tokenVersion status");

      // 1. Check if client exists
      if (!client) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      // 2. Check if account is active (Block/Suspend check)
      if (client.status === "Blocked" || client.status === "Suspended") {
        return res.status(403).json({ message: `Account is ${client.status}. Contact support.` });
      }

      // 3. Check Token Version (Logout All Devices logic)
      // If DB version is greater than Token version, the token is old/revoked.
      // If payload doesn't have tokenVersion (old tokens), treat as 0.
      const tokenVersion = decoded.tokenVersion || 0;
      const dbVersion = client.tokenVersion || 0;

      if (dbVersion > tokenVersion) {
        return res.status(401).json({ message: "Session expired. Please login again." });
      }
    }

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
