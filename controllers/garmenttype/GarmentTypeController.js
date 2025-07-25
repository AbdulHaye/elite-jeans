const ItemType = require("../../models/itemtype/ItemTypeModel");

const getAllGarmentTypes = async (_req, res) => {
  try {
    const garmentTypes = await ItemType.find();
    res.json(garmentTypes);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getGarmentTypeById = async (req, res) => {
  try {
    const ItemType = await ItemType.findById(req.params.id);
    if (!ItemType)
      return res.status(404).json({ message: "Garment type not found" });
    res.json(ItemType);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const createGarmentType = async (req, res) => {
  try {
    const newGarmentType = new ItemType({ name: req.body.name });
    await newGarmentType.save();
    res.status(201).json(newGarmentType);
  } catch (error) {
    res.status(400).json({ message: "Error creating garment type", error });
  }
};

const updateGarmentType = async (req, res) => {
  try {
    const updatedGarmentType = await ItemType.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );
    if (!updatedGarmentType)
      return res.status(404).json({ message: "Garment type not found" });
    res.json(updatedGarmentType);
  } catch (error) {
    res.status(400).json({ message: "Error updating garment type", error });
  }
};

const deleteGarmentType = async (req, res) => {
  try {
    const deletedGarmentType = await ItemType.findByIdAndDelete(req.params.id);
    if (!deletedGarmentType)
      return res.status(404).json({ message: "Garment type not found" });
    res.json({ message: "Garment type deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  getAllGarmentTypes,
  getGarmentTypeById,
  createGarmentType,
  updateGarmentType,
  deleteGarmentType,
};
