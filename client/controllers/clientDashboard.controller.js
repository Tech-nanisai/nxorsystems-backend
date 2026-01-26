const Project = require("../models/Project.model");
const Task = require("../models/Task.model");
const Client = require("../models/ClientnAuth.models"); // Import Client Model
// Import the NEW SuperAdmin Invoice Model (Shared Source of Truth)
const Invoice = require("../../superadmin/generatedinvoices/Invoice.model");

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Get Client ID from Database using User ID (from Token)
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client profile not found" });
    }
    const { clientID } = client;

    // 2. Run all queries in parallel
    const [projectCount, pendingTasks, dueAmountResult] = await Promise.all([
      Project.countDocuments({ clientID, status: "In Progress" }), // Fixed: 'Active' -> 'In Progress'
      Task.countDocuments({ clientID, isCompleted: false }),
      // Calculate Total Due from new Invoice model
      Invoice.aggregate([
        { $match: { clientID, status: { $in: ["Due", "Partial/Due", "Overdue"] } } },
        { $group: { _id: null, total: { $sum: "$dueAmount" } } }
      ])
    ]);

    const totalDue = dueAmountResult[0]?.total || 0;

    // 3. Mock Messages/Updates
    const updates = [
      { title: "System Maintenance", desc: "Scheduled for Dec 25th", time: "2 hours ago" },
      { title: "Invoice Generated", desc: "Check your payments section", time: "Yesterday" }
    ];

    res.json({
      success: true,
      data: {
        projects: projectCount,
        tasks: pendingTasks,
        payments: totalDue,
        messages: 3,
        updates: updates
      }
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

/* ===============================
   GET CLIENT INVOICES
================================ */
exports.getInvoices = async (req, res) => {
  try {
    // 1. Get Client ID
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    const { clientID } = client;

    // 2. Fetch Invoices
    const invoices = await Invoice.find({ clientID }).sort({ date: -1 });

    res.json({ success: true, data: invoices });

  } catch (err) {
    console.error("Get Invoices Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch invoices" });
  }
};

/* ===============================
   GET SINGLE INVOICE DETAILS
================================ */
exports.getInvoiceDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get Client ID
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    const { clientID } = client;

    const invoice = await Invoice.findOne({ _id: id, clientID });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({ success: true, data: invoice });

  } catch (err) {
    console.error("Get Invoice Detail Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ===============================
   GET CLIENT PROJECTS
   (Replaces temporary mock data)
================================ */
exports.getMyProjects = async (req, res) => {
  try {
    const client = await Client.findById(req.user.id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    const projects = await Project.find({ clientID: client.clientID }).sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    console.error("Get My Projects Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   UPDATE PROJECT APPROVAL
================================ */
exports.updateProjectApproval = async (req, res) => {
  try {
    const { projectID, action, rejectionReason } = req.body; // action: 'approve' | 'reject'
    const client = await Client.findById(req.user.id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    const project = await Project.findOne({ _id: projectID, clientID: client.clientID });
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (action === "approve") {
      project.approvalStatus = "Approved";
      project.status = "In Progress"; // Automatically active
      project.approvalDate = new Date();
      project.rejectionReason = ""; // Clear reason if approved
    } else if (action === "reject") {
      project.approvalStatus = "Rejected";
      project.status = "Rejected"; // Update main status
      project.approvalDate = new Date();
      project.rejectionReason = rejectionReason || "No reason provided";
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await project.save();
    res.json({ success: true, message: `Project ${action}ed successfully`, data: project });

  } catch (err) {
    console.error("Update Project Approval Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};