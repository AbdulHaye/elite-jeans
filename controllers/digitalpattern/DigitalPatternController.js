const DigitalPattern = require("../../models/digitalpattern/DigitalPatternModel");
const { uploadToS3, deleteFromS3 } = require("../../utils/s3Client");

exports.uploadPattern = async (req, res) => {
  try {
    const { styleNumber, user, description, workOrder_Id } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File is required" });
    }

    const s3Url = await uploadToS3(req.file);

    const newPattern = new DigitalPattern({
      styleNumber,
      file: s3Url,
      user,
      description,
      workOrder_Id,
    });

    await newPattern.save();

    res.status(201).json({ success: true, data: newPattern });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllPatterns = async (_req, res) => {
  try {
    const patterns = await DigitalPattern.find()
      // include workOrder details
      .populate("workOrder_Id")
      .sort({ uploadDate: -1 });

    res.json({ success: true, data: patterns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPatternById = async (req, res) => {
  try {
    const pattern = await DigitalPattern.findById(req.params.id);
    // include workOrder details

    if (!pattern) {
      return res
        .status(404)
        .json({ success: false, message: "Pattern not found" });
    }

    res.json({ success: true, data: pattern });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDigitalPattern = async (req, res) => {
  try {
    const { id } = req.params;
    const { styleNumber, user, description, workOrder_Id } = req.body;

    const digitalPattern = await DigitalPattern.findById(id);
    if (!digitalPattern) {
      return res
        .status(404)
        .json({ success: false, message: "Pattern not found" });
    }

    // If a new file is uploaded
    if (req.file) {
      const oldKey = digitalPattern.file.split("/").pop();
      await deleteFromS3(oldKey);

      const fileUrl = await uploadToS3(req.file);
      digitalPattern.file = fileUrl;
    }

    if (styleNumber) digitalPattern.styleNumber = styleNumber;
    if (user) digitalPattern.user = user;
    if (description) digitalPattern.description = description;
    if (workOrder_Id) digitalPattern.workOrder_Id = workOrder_Id;

    await digitalPattern.save();

    res.json({ success: true, data: digitalPattern });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.deletePattern = async (req, res) => {
  try {
    const pattern = await DigitalPattern.findById(req.params.id);
    if (!pattern) {
      return res
        .status(404)
        .json({ success: false, message: "Pattern not found" });
    }

    const key = pattern.file.split("/").pop();
    await deleteFromS3(key);

    await DigitalPattern.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Pattern deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPatternsByWorkOrderId = async (req, res) => {
  try {
    const { workOrder_Id } = req.params;

    const patterns = await DigitalPattern.find({ workOrder_Id }).sort({
      uploadDate: -1,
    });

    res.json({ success: true, data: patterns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
