const Project = require("../../client/models/Project.model");
const Client = require("../../client/models/ClientnAuth.models");
// Import the NEW SuperAdmin Invoice Model
const Invoice = require("../generatedinvoices/Invoice.model");
const Payment = require("../../client/models/Payment.model");

/* ===============================
   ASSIGN PROJECT (Super Admin -> Client)
================================ */
exports.createProject = async (req, res) => {
  try {
    const { clientID, title, description, status, deadline, progress, projectType, agreementContent } = req.body;

    // 1. Verify Client Exists
    const client = await Client.findOne({ clientID: clientID.trim().toUpperCase() });
    if (!client) {
      return res.status(404).json({ message: "Client ID not found in database!" });
    }

    // 2. Generate Unique Project ID
    const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6 digit random
    const projectID = `PRJ${randomSuffix}`;

    // 3. Create Project
    const newProject = new Project({
      projectID,
      clientID: client.clientID,
      title,
      description,
      status: status || "Pending",
      deadline,
      progress: progress || 0,
      projectType: projectType || "Custom",
      agreementContent: agreementContent || ""
    });

    await newProject.save();
    res.json({ success: true, message: "Project assigned successfully!", project: newProject });

  } catch (err) {
    console.error("Create Project Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   GET ALL PROJECTS (Super Admin)
================================ */
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    console.error("Get All Projects Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   GET PROJECTS BY CLIENT ID
================================ */
exports.getProjectsByClientID = async (req, res) => {
  try {
    const { clientID } = req.params;
    const projects = await Project.find({ clientID: clientID.trim().toUpperCase() }).sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    console.error("Get Projects By ClientID Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   GET PROJECT BY ID
================================ */
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, data: project });
  } catch (err) {
    console.error("Get Project By ID Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   UPDATE PROJECT (Status, Progress, Agreement)
================================ */
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, agreementContent, description, title, deadline } = req.body;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Update fields if provided
    if (status) project.status = status;
    if (progress !== undefined) project.progress = progress;
    if (agreementContent !== undefined) project.agreementContent = agreementContent;
    if (description) project.description = description;
    if (title) project.title = title;
    if (deadline) project.deadline = deadline;

    await project.save();

    res.json({ success: true, message: "Project updated successfully", data: project });
  } catch (err) {
    console.error("Update Project Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   GENERATE INVOICE (Super Admin -> Client)
================================ */
exports.createInvoice = async (req, res) => {
  try {
    const { clientID, amount, paidAmount, dueAmount, status, date } = req.body;

    // 1. Verify Client Exists
    const client = await Client.findOne({ clientID: clientID.trim().toUpperCase() });
    if (!client) {
      return res.status(404).json({ message: "Client ID not found in database!" });
    }

    // 2. Create Invoice using the NEW model
    const newInvoice = new Invoice({
      clientID: client.clientID,
      amount,
      paidAmount: paidAmount || 0,
      dueAmount: dueAmount || (amount - (paidAmount || 0)), // Fallback calc if frontend misses it
      status: status || "Due",
      date: date || new Date(),
    });

    await newInvoice.save();
    res.json({ success: true, message: "Invoice generated and saved successfully!" });

  } catch (err) {
    console.error("Create Invoice Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   GET ALL INVOICES (Super Admin View)
================================ */
exports.getAllInvoices = async (req, res) => {
  try {
    console.log("SuperAdmin: Fetching all invoices...");

    let genInvoices = [];
    let payments = [];

    // Fetch Generated Invoices (New)
    try {
      genInvoices = await Invoice.find().sort({ date: -1 });
    } catch (err) {
      console.error("Error fetching GeneratedInvoices:", err.message);
    }

    // Fetch Legacy Payments (Old)
    try {
      payments = await Payment.find().sort({ date: -1 });
    } catch (err) {
      console.error("Error fetching Legacy Payments:", err.message);
    }

    // Combine and sort
    const allRecords = [...genInvoices, ...payments].sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(`SuperAdmin: Combined Result: ${genInvoices.length} new, ${payments.length} legacy.`);
    res.json({ success: true, data: allRecords });
  } catch (err) {
    console.error("Get All Invoices Critical Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   GET INVOICES BY CLIENT ID
================================ */
exports.getInvoicesByClientID = async (req, res) => {
  try {
    const { clientID } = req.params;
    console.log("SuperAdmin: Fetching invoices for ClientID:", clientID);

    let genInvoices = [];
    let payments = [];

    // Fetch Generated Invoices (New)
    try {
      genInvoices = await Invoice.find({ clientID: clientID.trim().toUpperCase() }).sort({ date: -1 });
    } catch (err) {
      console.error("Error fetching Client GeneratedInvoices:", err.message);
    }

    // Fetch Legacy Payments (Old)
    try {
      payments = await Payment.find({ clientID: clientID.trim().toUpperCase() }).sort({ date: -1 });
    } catch (err) {
      console.error("Error fetching Client Legacy Payments:", err.message);
    }

    // Combine and sort
    const allRecords = [...genInvoices, ...payments].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, data: allRecords });
  } catch (err) {
    console.error("Get Invoices By ClientID Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   GET INVOICE BY ID (Super Admin View)
================================ */
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("SuperAdmin: Fetching invoice details for ID:", id);

    let invoice = null;

    // 1. Try finding in NEW Generated Invoices (Primary Source)
    try {
      invoice = await Invoice.findById(id);
    } catch (err) {
      // Ignore CastErrors (invalid ID format for this collection), log others
      if (err.name !== 'CastError') {
        console.warn("New Invoice Lookup Error:", err.message);
      }
    }

    // 2. If not found in New, try Legacy Payments (Secondary Source)
    if (!invoice) {
      try {
        invoice = await Payment.findById(id);
      } catch (err) {
        if (err.name !== 'CastError') {
          console.warn("Legacy Payment Lookup Error:", err.message);
        }
      }
    }

    if (!invoice) {
      console.log("Invoice not found in either collection.");
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Normalize data (ensure dueAmount exists for display compatibility)
    let data = invoice.toObject ? invoice.toObject() : invoice;
    if (data.dueAmount === undefined) {
      // Fallback logic for legacy data
      if (data.status?.toLowerCase().includes('paid')) {
        data.dueAmount = 0;
      } else {
        data.dueAmount = data.amount;
      }
    }

    res.json({ success: true, data: data });
  } catch (err) {
    console.error("Get Invoice By ID Critical Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   DELETE INVOICE (Super Admin -> Client)
================================ */
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("SuperAdmin: Attempting to delete invoice with ID:", id);

    let deletedInvoice = null;

    // 1. Try deleting from NEW Generated Invoices (Primary Source)
    try {
      deletedInvoice = await Invoice.findByIdAndDelete(id);
      if (deletedInvoice) {
        console.log("Deleted from GeneratedInvoices (New/SuperDB).");
      }
    } catch (err) {
      if (err.name !== 'CastError') {
        console.warn("Delete New Invoice Error:", err.message);
      }
    }

    // 2. If not found/deleted in New, try Legacy Payments (Secondary Source)
    if (!deletedInvoice) {
      try {
        deletedInvoice = await Payment.findByIdAndDelete(id);
        if (deletedInvoice) {
          console.log("Deleted from Legacy Payments (Old/ClientDB).");
        }
      } catch (err) {
        if (err.name !== 'CastError') {
          console.warn("Delete Legacy Payment Error:", err.message);
        }
      }
    }

    if (!deletedInvoice) {
      return res.status(404).json({ message: "Invoice not found or already deleted." });
    }

    res.json({ success: true, message: "Invoice deleted successfully!" });

  } catch (err) {
    console.error("Delete Invoice Critical Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};