const WashColorNewDetail = require("../../models/washcolordetail/WashColorDetailModel");

exports.createWashColorNewDetail = async (req, res) => {
  try {
    const { wash_detail_id, detail_category, comment, pic, size } = req.body;

    const newWashColorNewDetail = new WashColorNewDetail({
      wash_detail_id,
      detail_category,
      comment,
      pic,
      size,
    });

    const savedDetail = await newWashColorNewDetail.save();
    res.status(201).json(savedDetail);
  } catch (error) {
    res.status(500).json({
      message: "Error creating WashColorNewDetail",
      error,
    });
  }
};

exports.getAllWashColorNewDetails = async (_req, res) => {
  try {
    const details = await WashColorNewDetail.find()
      .populate("wash_detail_id")
      .populate("pic");
    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching WashColorNewDetails",
      error,
    });
  }
};

exports.getWashColorNewDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await WashColorNewDetail.findById(id)
      .populate("wash_detail_id")
      .populate("pic");

    if (!detail) {
      return res.status(404).json({ message: "WashColorNewDetail not found" });
    }

    res.status(200).json(detail);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching WashColorNewDetail",
      error,
    });
  }
};

exports.updateWashColorNewDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedDetail = await WashColorNewDetail.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!updatedDetail) {
      return res.status(404).json({ message: "WashColorNewDetail not found" });
    }

    res.status(200).json(updatedDetail);
  } catch (error) {
    res.status(500).json({
      message: "Error updating WashColorNewDetail",
      error,
    });
  }
};

exports.deleteWashColorNewDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedDetail = await WashColorNewDetail.findByIdAndDelete(id);

    if (!deletedDetail) {
      return res.status(404).json({ message: "WashColorNewDetail not found" });
    }

    res.status(200).json({
      message: "WashColorNewDetail deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting WashColorNewDetail",
      error,
    });
  }
};
