const SampleStatus = require("../../models/samplestatus/SampleStatusModel"); // Adjust path if needed

// Create a new SampleStatus
exports.createSampleStatus = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const sampleStatus = new SampleStatus({ sampleStatus: { name } });
    await sampleStatus.save();
    res.status(201).json(sampleStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all SampleStatuses
exports.getAllSampleStatuses = async (_req, res) => {
  try {
    const sampleStatuses = await SampleStatus.find();
    res.status(200).json(sampleStatuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single SampleStatus by ID
exports.getSampleStatusById = async (req, res) => {
  try {
    const sampleStatus = await SampleStatus.findById(req.params.id);
    if (!sampleStatus) {
      return res.status(404).json({ message: "SampleStatus not found" });
    }
    res.status(200).json(sampleStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a SampleStatus by ID
exports.updateSampleStatus = async (req, res) => {
  try {
    const { name } = req.body;
    const sampleStatus = await SampleStatus.findByIdAndUpdate(
      req.params.id,
      { sampleStatus: { name } },
      { new: true }
    );

    if (!sampleStatus) {
      return res.status(404).json({ message: "SampleStatus not found" });
    }

    res.status(200).json(sampleStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a SampleStatus by ID
exports.deleteSampleStatus = async (req, res) => {
  try {
    const sampleStatus = await SampleStatus.findByIdAndDelete(req.params.id);
    if (!sampleStatus) {
      return res.status(404).json({ message: "SampleStatus not found" });
    }
    res.status(200).json({ message: "SampleStatus deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
