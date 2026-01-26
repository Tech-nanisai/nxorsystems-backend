// backend/routes/routeStudentReg.js
const express = require("express");
const router = express.Router();

const StudentModel = require("../models/modelStudentReg");  // CHANGE according to your model name
const IDGeneration = require("../../models/IDGeneration");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

// Authentication middlewares
const { authenticateAdmin } = require("../../admin/middleware/authMiddleware");
const requireSuperAdmin = require("../../middleware/requireSuperAdmin");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";


// --------------------------------------------------------------
// ⭐ 1) REGISTER STUDENT — SUPER ADMIN ONLY
// --------------------------------------------------------------
router.post(
  "/register",
  authenticateAdmin,
  requireSuperAdmin,

  [
    body("fullname").notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("phone").isLength({ min: 6 }).withMessage("Valid phone number required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be min 6 characters"),
    body("studentId").matches(/^ST-\d{5}$/).withMessage("studentId must be like 'ST-10001'")
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { fullname, email, phone, password, studentId } = req.body;

      // Check email unique
      const existingEmail = await StudentModel.findOne({
        email: email.toLowerCase()
      });
      if (existingEmail)
        return res.status(409).json({ error: "Email already registered" });

      // Check studentId unique
      const existingStudent = await StudentModel.findOne({ studentId });
      if (existingStudent)
        return res.status(409).json({ error: "Student ID already registered" });

      // Confirm ID exists in IDGeneration table
      const validId = await IDGeneration.findOne({
        id: studentId,
        userType: "student"
      });

      if (!validId)
        return res.status(400).json({ error: "Invalid Student ID" });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      await new StudentModel({
        fullname,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        studentId
      }).save();

      return res
        .status(201)
        .json({ message: "Student account created successfully" });

    } catch (error) {
      console.error("Error creating student:", error);

      if (error.code === 11000)
        return res.status(409).json({ error: "Duplicate field value" });

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);


// --------------------------------------------------------------
// ⭐ 2) LOGIN STUDENT
// --------------------------------------------------------------
router.post(
  "/login",
  [
    body("studentId").notEmpty().withMessage("Student ID required"),
    body("password").notEmpty().withMessage("Password required")
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { studentId, password } = req.body;

      const student = await StudentModel.findOne({ studentId });
      if (!student)
        return res
          .status(401)
          .json({ error: "Invalid Student ID or Password" });

      const isMatch = await bcrypt.compare(password, student.password);
      if (!isMatch)
        return res
          .status(401)
          .json({ error: "Invalid Student ID or Password" });

      const token = jwt.sign(
        {
          id: student._id,
          studentId: student.studentId,
          email: student.email,
          userType: "student"
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        student: {
          fullname: student.fullname,
          studentId: student.studentId,
          email: student.email
        }
      });

    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);


// --------------------------------------------------------------
// ⭐ 3) VERIFY STUDENT ID
// --------------------------------------------------------------
router.get("/verify-id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const prefix = id.split("-")[0].toUpperCase();

    if (prefix !== "ST")
      return res.status(400).json({ isValid: false, message: "Invalid ID prefix" });

    const valid = await IDGeneration.findOne({
      id: id.trim().toUpperCase(),
      userType: "student"
    });

    return res.json({
      isValid: !!valid,
      message: valid ? "Valid ID" : "ID not found"
    });

  } catch (error) {
    console.error("Verify ID error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
