const VendorPO = require("../../models/vendorpo/VendorPoModel");

// Create a new Vendor Purchase Order
exports.createVendorPO = async (req, res) => {
  try {
    const newVendorPO = new VendorPO(req.body);
    await newVendorPO.save();
    res.status(201).json({
      message: "Vendor PO created successfully",
      data: newVendorPO,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all Vendor Purchase Orders
exports.getAllVendorPOs = async (_req, res) => {
  try {
    const vendorPOs = await VendorPO.find()
      .populate("vendor")
      .populate("orders");
    res.status(200).json({ data: vendorPOs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single Vendor PO by ID
exports.getVendorPOById = async (req, res) => {
  try {
    const vendorPO = await VendorPO.findById(req.params.id)
      .populate("vendor")
      .populate("orders");
    if (!vendorPO) {
      return res.status(404).json({ message: "Vendor PO not found" });
    }
    res.status(200).json({ data: vendorPO });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a Vendor PO
exports.updateVendorPO = async (req, res) => {
  try {
    const updatedVendorPO = await VendorPO.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedVendorPO) {
      return res.status(404).json({ message: "Vendor PO not found" });
    }
    res.status(200).json({
      message: "Vendor PO updated successfully",
      data: updatedVendorPO,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a Vendor PO
exports.deleteVendorPO = async (req, res) => {
  try {
    const deletedVendorPO = await VendorPO.findByIdAndDelete(req.params.id);
    if (!deletedVendorPO) {
      return res.status(404).json({ message: "Vendor PO not found" });
    }
    res.status(200).json({ message: "Vendor PO deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
