const SampleRequestingStatus = require("../../models/samplerequestingstatus/SampleRequestingStatusModel"); // Adjust path if needed

// Create a new SampleRequestingStatus
exports.createSampleRequestingStatus = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const sampleRequestingStatus = new SampleRequestingStatus({
      sampleRequestingStatus: { name },
    });
    await sampleRequestingStatus.save();
    res.status(201).json(sampleRequestingStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all SampleRequestingStatuses
exports.getAllSampleRequestingStatuses = async (_req, res) => {
  try {
    const sampleRequestingStatuses = await SampleRequestingStatus.find();
    res.status(200).json(sampleRequestingStatuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single SampleRequestingStatus by ID
exports.getSampleRequestingStatusById = async (req, res) => {
  try {
    const sampleRequestingStatus = await SampleRequestingStatus.findById(
      req.params.id
    );
    if (!sampleRequestingStatus) {
      return res
        .status(404)
        .json({ message: "SampleRequestingStatus not found" });
    }
    res.status(200).json(sampleRequestingStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a SampleRequestingStatus by ID
exports.updateSampleRequestingStatus = async (req, res) => {
  try {
    const { name } = req.body;
    const sampleRequestingStatus =
      await SampleRequestingStatus.findByIdAndUpdate(
        req.params.id,
        { sampleRequestingStatus: { name } },
        { new: true }
      );

    if (!sampleRequestingStatus) {
      return res
        .status(404)
        .json({ message: "SampleRequestingStatus not found" });
    }

    res.status(200).json(sampleRequestingStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a SampleRequestingStatus by ID
exports.deleteSampleRequestingStatus = async (req, res) => {
  try {
    const sampleRequestingStatus =
      await SampleRequestingStatus.findByIdAndDelete(req.params.id);
    if (!sampleRequestingStatus) {
      return res
        .status(404)
        .json({ message: "SampleRequestingStatus not found" });
    }
    res.status(200).json({
      message: "SampleRequestingStatus deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
