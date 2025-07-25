const SpecsTemplate = require("../../models/specstemplate/SpecsTemplateModel");
const SpecTemPoms = require("../../models/specstemplatepom/SpecsTemplatePomModel");

exports.createSpecsTemplate = async (req, res) => {
  try {
    const { Name, spec_type, Size_Range, Point_of_Measure } = req.body;

    // Create new specs template
    const specsTemplate = new SpecsTemplate({
      Name,
      spec_type,
      Size_Range,
      Point_of_Measure,
    });

    const savedSpecsTemplate = await specsTemplate.save();

    // If spec_type is provided (not first template), copy POMs from that template
    if (spec_type) {
      const sourceTemplate = await SpecsTemplate.findOne({
        Name: spec_type,
      });
      if (sourceTemplate) {
        const sourcePoms = await SpecTemPoms.find({
          specTemplateId: sourceTemplate._id,
        });

        // Create copies of all POMs with new template ID
        const newPoms = await Promise.all(
          sourcePoms.map(async (pom) => {
            const newPom = new SpecTemPoms({
              ...pom.toObject(),
              _id: undefined, // Let MongoDB create new ID
              specTemplateId: savedSpecsTemplate._id,
            });
            return await newPom.save();
          })
        );

        savedSpecsTemplate.Point_of_Measure = newPoms.map((pom) => pom._id);
        await savedSpecsTemplate.save();
      }
    }

    res.status(201).json({
      message: "SpecsTemplate created successfully",
      data: savedSpecsTemplate,
    });
  } catch (error) {
    console.error("Error creating SpecsTemplate:", error);
    res.status(500).json({
      message: "Failed to create SpecsTemplate",
      error: error.message,
    });
  }
};

// Get all SpecsTemplates
exports.getAllSpecsTemplates = async (_req, res) => {
  try {
    const specsTemplates = await SpecsTemplate.find(); // Removed populate("itemType")

    res.status(200).json({
      message: "SpecsTemplates retrieved successfully",
      data: specsTemplates,
    });
  } catch (error) {
    console.error("Error retrieving SpecsTemplates:", error);
    res.status(500).json({
      message: "Failed to retrieve SpecsTemplates",
      error: error.message,
    });
  }
};

// Get a single SpecsTemplate by ID attitude the value
exports.getSpecsTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const specsTemplate = await SpecsTemplate.findById(id).populate("itemType");

    if (!specsTemplate) {
      return res.status(404).json({
        message: "SpecsTemplate not found",
      });
    }

    res.status(200).json({
      message: "SpecsTemplate retrieved successfully",
      data: specsTemplate,
    });
  } catch (error) {
    console.error("Error retrieving SpecsTemplate:", error);
    res.status(500).json({
      message: "Failed to retrieve SpecsTemplate",
      error: error.message,
    });
  }
};

// Update a SpecsTemplate by ID
exports.updateSpecsTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, itemType, Size_Range, Point_of_Measure } = req.body;

    const updatedSpecsTemplate = await SpecsTemplate.findByIdAndUpdate(
      id,
      { Name, itemType, Size_Range, Point_of_Measure },
      { new: true }
    );

    if (!updatedSpecsTemplate) {
      return res.status(404).json({
        message: "SpecsTemplate not found",
      });
    }

    res.status(200).json({
      message: "SpecsTemplate updated successfully",
      data: updatedSpecsTemplate,
    });
  } catch (error) {
    console.error("Error updating SpecsTemplate:", error);
    res.status(500).json({
      message: "Failed to update SpecsTemplate",
      error: error.message,
    });
  }
};

// Delete a SpecsTemplate by ID
exports.deleteSpecsTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSpecsTemplate = await SpecsTemplate.findByIdAndDelete(id);

    if (!deletedSpecsTemplate) {
      return res.status(404).json({
        message: "SpecsTemplate not found",
      });
    }

    res.status(200).json({
      message: "SpecsTemplate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting SpecsTemplate:", error);
    res.status(500).json({
      message: "Failed to delete SpecsTemplate",
      error: error.message,
    });
  }
};
