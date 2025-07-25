const { uploadToS3, deleteFromS3 } = require("../../utils/s3Client");
const Trim = require("../../models/trim/TrimModel");

const createTrim = async (req, res) => {
  try {
    const { name, description } = req.body;
    const previewImageUrl = await uploadToS3(req.file);

    const newTrim = new Trim({
      name,
      description,
      previewImage: previewImageUrl,
    });
    console.log("check trim image", previewImageUrl);
    await newTrim.save();
    res.status(201).json(newTrim);
  } catch (error) {
    console.error("Error creating trim:", error);
    res.status(500).json({ error: "Failed to create trim" });
  }
};

const getTrims = async (_req, res) => {
  try {
    const trims = await Trim.find({});
    res.status(200).json(trims);
  } catch (error) {
    console.error("Error fetching trims:", error);
    res.status(500).json({ error: "Failed to fetch trims" });
  }
};

const getTrimById = async (req, res) => {
  try {
    const trim = await Trim.findById(req.params.id);
    if (!trim) {
      return res.status(404).json({ error: "Trim not found" });
    }
    res.status(200).json(trim);
  } catch (error) {
    console.error("Error fetching trim by ID:", error);
    res.status(500).json({ error: "Failed to fetch trim" });
  }
};

const updateTrim = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    let updatedFields = {};
    if (name) updatedFields.name = name;
    if (description) updatedFields.description = description;

    if (req.file) {
      const trim = await Trim.findById(id);
      if (!trim) {
        return res.status(404).json({ error: "Trim not found" });
      }

      console.log("Existing Trim:", trim);
      await deleteFromS3(trim.previewImage);
      const newPreviewImageUrl = await uploadToS3(req.file);
      updatedFields.previewImage = newPreviewImageUrl;
      updatedFields.previewImage = newPreviewImageUrl;
    }

    const updatedTrim = await Trim.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });
    if (!updatedTrim) {
      return res.status(404).json({ error: "Trim not found" });
    }

    console.log("Updated Trim:", updatedTrim);
    res.status(200).json(updatedTrim);
  } catch (error) {
    console.error("Error updating trim:", error);
    res.status(500).json({ error: "Failed to update trim" });
  }
};

const deleteTrim = async (req, res) => {
  try {
    const trim = await Trim.findById(req.params.id);
    if (!trim) {
      return res.status(404).json({ error: "Trim not found" });
    }

    const s3Key = trim.previewImage.split("/").slice(-1)[0];
    await deleteFromS3(s3Key);

    await Trim.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Trim deleted successfully" });
  } catch (error) {
    console.error("Error deleting trim:", error);
    res.status(500).json({ error: "Failed to delete trim" });
  }
};

const Names = async (_req, res) => {
  try {
    const categories = await Trim.distinct("name");
    res.status(200).json({
      categories,
    });
  } catch (_error) {
    res.status(500).json({
      message: "Error fetching categories",
    });
  }
};

const filterNames = async (req, res) => {
  try {
    const { name } = req.query;

    console.log("Fetching previewImages for name:", name);

    const trims = await Trim.find({ name: name }).select("previewImage");

    console.log("Fetched trims for name:", trims);

    res.status(200).json({
      trims,
    });
  } catch (error) {
    console.error("Error fetching trims for name:", error);
    res.status(500).json({
      message: "Error fetching trims for name",
    });
  }
};

const getAllTrimNames = async (_req, res) => {
  try {
    const trims = await Trim.find({}, "name");
    res.status(200).json(trims);
  } catch (error) {
    console.error("Error fetching trim names:", error);
    res.status(500).json({ error: "Failed to fetch trim names" });
  }
};

const getTrimByName = async (req, res) => {
  try {
    const { name } = req.params;
    const trim = await Trim.findOne({ name });
    if (!trim) {
      return res.status(404).json({ error: "Trim not found" });
    }
    res.status(200).json(trim);
  } catch (error) {
    console.error("Error fetching trim by name:", error);
    res.status(500).json({ error: "Failed to fetch trim" });
  }
};

const searchTrims = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const regex = new RegExp(query, "i");

    const trims = await Trim.find({
      $or: [{ name: regex }, { description: regex }],
    });

    if (!trims.length) {
      return res
        .status(200)
        .json({ message: "No matching trims found", data: [] });
    }

    res.status(200).json(trims);
  } catch (error) {
    console.error("Error searching trims:", error);
    res.status(500).json({ error: "Failed to search trims" });
  }
};

module.exports = {
  createTrim,
  getTrims,
  getTrimById,
  updateTrim,
  deleteTrim,
  Names,
  filterNames,
  getAllTrimNames,
  getTrimByName,
  searchTrims,
};
