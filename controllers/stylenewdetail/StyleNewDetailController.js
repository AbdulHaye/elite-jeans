const StyleNewDetail = require("../../models/stylenewdetail/StyleNewDetailModel");

// Create a new StyleNewDetail
exports.createStyleNewDetail = async (req, res) => {
  try {
    const { style_detail_id, detail_category, comment, pic, size } = req.body;

    const newStyleNewDetail = new StyleNewDetail({
      style_detail_id,
      detail_category,
      comment,
      pic,
      size,
    });

    const savedDetail = await newStyleNewDetail.save();
    res.status(201).json(savedDetail);
  } catch (error) {
    res.status(500).json({
      message: "Error creating StyleNewDetail",
      error,
    });
  }
};

// Get all StyleNewDetails
exports.getAllStyleNewDetails = async (_req, res) => {
  try {
    const details = await StyleNewDetail.find()
      .populate("style_detail_id")
      .populate("pic");
    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching StyleNewDetails",
      error,
    });
  }
};

// Get a single StyleNewDetail by ID
exports.getStyleNewDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await StyleNewDetail.findById(id)
      .populate("style_detail_id")
      .populate("pic");

    if (!detail) {
      return res.status(404).json({ message: "StyleNewDetail not found" });
    }

    res.status(200).json(detail);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching StyleNewDetail",
      error,
    });
  }
};

// Update a StyleNewDetail by ID
exports.updateStyleNewDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedDetail = await StyleNewDetail.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedDetail) {
      return res.status(404).json({ message: "StyleNewDetail not found" });
    }

    res.status(200).json(updatedDetail);
  } catch (error) {
    res.status(500).json({
      message: "Error updating StyleNewDetail",
      error,
    });
  }
};

// Delete a StyleNewDetail by ID
exports.deleteStyleNewDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedDetail = await StyleNewDetail.findByIdAndDelete(id);

    if (!deletedDetail) {
      return res.status(404).json({ message: "StyleNewDetail not found" });
    }

    res.status(200).json({
      message: "StyleNewDetail deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting StyleNewDetail",
      error,
    });
  }
};
