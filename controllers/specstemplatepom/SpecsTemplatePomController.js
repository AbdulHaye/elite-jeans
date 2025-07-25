const SpecsTemplate = require("../../models/specstemplate/SpecsTemplateModel");
const PointOfMeasure = require("../../models/pom/PomModel");
const SpecTemPoms = require("../../models/specstemplatepom/SpecsTemplatePomModel");
const CopiedSpecTemPoms = require("../../models/copiedspecstemplatepom/CopiedSpecsTemplatePomModel");
const SampleGradedSpecs = require("../../models/samplegradedspecs/SampleGradedSpecsModel");
const CopiedSampleGradedSpecs = require("../../models/copiedsamplegradedspecs/CopiedSampleGradedSpecsModel");

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

exports.addSelectedPOMs = async (req, res) => {
  try {
    const { specTemplateId, selectedPomIds } = req.body;

    if (
      !specTemplateId ||
      !Array.isArray(selectedPomIds) ||
      selectedPomIds.length === 0
    ) {
      return res.status(400).json({
        message:
          "Spec Template ID and an array of selected POM IDs are required.",
      });
    }

    const specTemplate = await SpecsTemplate.findById(specTemplateId);
    if (!specTemplate) {
      return res.status(404).json({
        message: "Spec Template not found.",
      });
    }

    const pointOfMeasures = await PointOfMeasure.find({
      _id: { $in: selectedPomIds },
    });
    if (pointOfMeasures.length === 0) {
      return res
        .status(404)
        .json({ message: "No valid POMs found for the provided IDs." });
    }

    const { Size_Range } = specTemplate;

    // Function to get existing sizes from POMs in this template
    const getExistingSizes = async () => {
      const existingPoms = await SpecTemPoms.find({
        specTemplateId,
      }).limit(1);
      if (existingPoms.length === 0) return null;

      const pom = existingPoms[0].toObject();
      // Remove non-size fields
      [
        "_id",
        "code",
        "description",
        "specTemplateId",
        "createdAt",
        "updatedAt",
        "__v",
        "Design",
        "Final",
        "FirstPP",
        "Initial",
        "Rev1",
        "Rev2",
        "SecondPP",
        "Ship",
        "ThirdPP",
      ].forEach((field) => delete pom[field]);

      return Object.keys(pom).filter(
        (key) =>
          !isNaN(key) ||
          ["XS", "S", "M", "L", "XL", "XXL", "X", "XX", "XXX", "XXXX"].includes(
            key
          )
      );
    };

    // Determine which sizes to use
    let sizesToUse = [];
    const predefinedRanges = [
      "1-19",
      "7-16",
      "0-16",
      "14-28",
      "1X-4X",
      "XS-XXL",
    ];

    if (predefinedRanges.includes(Size_Range)) {
      // Use predefined size mapping
      if (Size_Range === "1-19") {
        sizesToUse = [
          "0",
          "1",
          "3",
          "5",
          "7",
          "9",
          "11",
          "13",
          "15",
          "17",
          "19",
        ];
      } else if (Size_Range === "7-16") {
        sizesToUse = ["7", "8", "10", "12", "14", "16"];
      } else if (Size_Range === "0-16") {
        sizesToUse = ["0", "2", "4", "6", "8", "10", "12", "14", "16"];
      } else if (Size_Range === "14-28") {
        sizesToUse = ["14", "16", "18", "20", "22", "24", "26", "28"];
      } else if (Size_Range === "1X-4X") {
        sizesToUse = ["X", "XX", "XXX", "XXXX"];
      } else if (Size_Range === "XS-XXL") {
        sizesToUse = ["XS", "S", "M", "L", "XL", "XXL"];
      }
    } else {
      // Get sizes from existing POMs
      sizesToUse = await getExistingSizes();
      if (!sizesToUse || sizesToUse.length === 0) {
        // If no existing sizes, use the Size_Range as is (assuming it's a custom range)
        sizesToUse = Size_Range.split(",").map((s) => s.trim());
      }
    }

    const createdDocuments = [];

    for (const pom of pointOfMeasures) {
      const newSpecTemPom = new SpecTemPoms({
        code: pom.code,
        description: pom.description,
        tolerance: pom.tolerance,
        specTemplateId: specTemplateId,
        Design: "",
        Initial: "",
        FirstPP: "",
        Rev1: "",
        Rev2: "",
        SecondPP: "",
        ThirdPP: "",
        Final: "",
        Ship: "",
      });

      // Add size fields based on sizesToUse
      const sizeFields = {};
      sizesToUse.forEach((size) => {
        sizeFields[size] = "";
      });

      newSpecTemPom.set(sizeFields);

      const savedSpecTemPom = await newSpecTemPom.save();
      createdDocuments.push(savedSpecTemPom);
    }

    return res.status(201).json({
      message: "Selected POMs added successfully.",
      data: createdDocuments,
    });
  } catch (error) {
    console.error("Error adding selected POMs:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.deletePOMRecord = async (req, res) => {
  try {
    const { deletedid } = req.params;

    if (!deletedid) {
      return res.status(400).json({
        message: "POM ID is required to delete the record.",
      });
    }

    const deletedPOM = await SpecTemPoms.findByIdAndDelete(deletedid);

    if (!deletedPOM) {
      return res.status(404).json({ message: "POM record not found." });
    }

    return res.status(200).json({
      message: "POM record deleted successfully.",
      deletedPOM,
    });
  } catch (error) {
    console.error("Error deleting POM record:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.deleteMultiplePOMRecords = async (req, res) => {
  try {
    const { deletedIds } = req.body;

    if (!deletedIds || !Array.isArray(deletedIds) || deletedIds.length === 0) {
      return res
        .status(400)
        .json({ message: "A valid array of POM IDs is required." });
    }

    const result = await SpecTemPoms.deleteMany({
      _id: { $in: deletedIds },
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No matching POM records found to delete." });
    }

    return res.status(200).json({
      message: "POM records deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting multiple POM records:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.updatePOMRecord = async (req, res) => {
  try {
    const { pomId } = req.params;
    const updateData = req.body;

    if (!pomId || !updateData) {
      return res.status(400).json({
        message: "POM ID and update data are required.",
      });
    }

    const updatedPOM = await SpecTemPoms.findByIdAndUpdate(pomId, updateData, {
      new: true,
    });

    if (!updatedPOM) {
      return res.status(404).json({ message: "POM record not found." });
    }
    return res.status(200).json({
      message: "POM record updated successfully.",
      updatedPOM,
    });
  } catch (error) {
    console.error("Error updating POM record:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.getPOMsBySpecTemplateId = async (req, res) => {
  try {
    const { specTemplateId } = req.params;

    if (!specTemplateId) {
      return res.status(400).json({ message: "Spec Template ID is required." });
    }

    const poms = await SpecTemPoms.find({ specTemplateId })
      .populate("specTemplateId")
      .exec();

    if (!poms || poms.length === 0) {
      return res.status(404).json({
        message: "No POM records found for the provided Spec Template ID.",
      });
    }

    return res.status(200).json({
      message: "POM records retrieved successfully.",
      data: poms,
    });
  } catch (error) {
    console.error("Error fetching POM records:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.addSizeToPOMs = async (req, res) => {
  try {
    const { specTemplateId } = req.params;
    const { size, values } = req.body;

    // Validate input
    if (!specTemplateId || !size) {
      return res.status(400).json({
        message: "Spec Template ID and size are required.",
      });
    }

    if (!values || !Array.isArray(values)) {
      return res.status(400).json({
        message: "Values must be provided as an array.",
      });
    }

    // Find all POMs for this template
    const originalPoms = await SpecTemPoms.find({ specTemplateId });
    if (!originalPoms || originalPoms.length === 0) {
      return res.status(404).json({
        message: "No POM records found for the provided Spec Template ID.",
      });
    }

    // Update original POMs
    const updatedOriginalPoms = await Promise.all(
      originalPoms.map(async (pom, index) => {
        const updateData = { [size]: values[index] || "" };
        return await SpecTemPoms.findByIdAndUpdate(
          pom._id,
          { $set: updateData },
          { new: true }
        );
      })
    );

    // Update copied POMs if they exist
    const copiedPoms = await CopiedSpecTemPoms.find({
      specTemplateId,
      _id: { $in: originalPoms.map((pom) => pom._id) },
    });

    if (copiedPoms.length > 0) {
      await Promise.all(
        copiedPoms.map(async (pom, index) => {
          const updateData = { [size]: values[index] || "" };
          await CopiedSpecTemPoms.findByIdAndUpdate(
            pom._id,
            { $set: updateData },
            { new: true }
          );
        })
      );
    }

    // Calculate new size range
    const allSizes = new Set();

    updatedOriginalPoms.forEach((pom) => {
      const pomObj = pom.toObject();
      // Remove non-size fields
      [
        "_id",
        "code",
        "description",
        "specTemplateId",
        "createdAt",
        "updatedAt",
        "__v",
        "Design",
        "Final",
        "FirstPP",
        "Initial",
        "Rev1",
        "Rev2",
        "SecondPP",
        "Ship",
        "ThirdPP",
      ].forEach((field) => delete pomObj[field]);

      Object.keys(pomObj).forEach((sizeKey) => {
        if (pomObj[sizeKey] !== undefined) {
          allSizes.add(sizeKey);
        }
      });
    });

    const validSizes = Array.from(allSizes).filter(
      (s) =>
        !isNaN(s) ||
        [
          "XS",
          "S",
          "M",
          "L",
          "XL",
          "XXL",
          "X",
          "XX",
          "XXX",
          "XXXX",
          "XXXXX",
          "XXXXXX",
          "XXXXXXX",
          "XXXXXXXX",
          "XXXXXXXXX",
          "XXXXXXXXXX",
          "XXXXXXXXXXX",
          "XXXXXXXXXXXX",
        ].includes(s)
    );

    if (validSizes.length === 0) {
      return res.status(200).json({
        message: "Size added to POMs successfully.",
        updatedPOMs: updatedOriginalPoms,
      });
    }

    // Calculate size range
    const numericSizes = validSizes
      .filter((s) => !isNaN(s))
      .map(Number)
      .sort((a, b) => a - b);
    const letterSizes = validSizes.filter((s) => isNaN(s));

    let sizeRangeParts = [];

    if (numericSizes.length > 0) {
      sizeRangeParts.push(
        `${Math.min(...numericSizes)}-${Math.max(...numericSizes)}`
      );
    }

    if (letterSizes.length > 0) {
      const sizeOrder = [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL",
        "X",
        "XX",
        "XXX",
        "XXXX",
        "XXXXX",
        "XXXXXX",
        "XXXXXXX",
        "XXXXXXXX",
        "XXXXXXXXX",
        "XXXXXXXXXX",
        "XXXXXXXXXXX",
        "XXXXXXXXXXXX",
      ];
      letterSizes.sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));
      sizeRangeParts.push(letterSizes.join("-"));
    }

    const newSizeRange = sizeRangeParts.join(", ");

    // Update related documents
    await SpecsTemplate.findByIdAndUpdate(
      specTemplateId,
      { $set: { Size_Range: newSizeRange } },
      { new: true }
    );

    await SampleGradedSpecs.updateMany(
      { spec_template_Id: specTemplateId },
      { $set: { size_range: newSizeRange } }
    );

    await CopiedSampleGradedSpecs.updateMany(
      { spec_template_Id: specTemplateId },
      { $set: { size_range: newSizeRange } }
    );

    return res.status(200).json({
      message:
        "Size added to POMs and all related documents updated successfully.",
      updatedPOMs: updatedOriginalPoms,
      newSizeRange,
    });
  } catch (error) {
    console.error("Error adding size to POMs:", error);
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

exports.deleteSizeFromPOMs = async (req, res) => {
  try {
    const { specTemplateId } = req.params;
    const { size } = req.body;

    if (!specTemplateId || !size) {
      return res.status(400).json({ message: "Spec Template ID and size are required." });
    }

    // Update original POMs by removing the size key
    const originalPoms = await SpecTemPoms.find({ specTemplateId });
    const updatedPoms = await Promise.all(
      originalPoms.map(pom =>
        SpecTemPoms.findByIdAndUpdate(pom._id, { $unset: { [size]: "" } }, { new: true })
      )
    );

    // Update copied POMs similarly
    const copiedPoms = await CopiedSpecTemPoms.find({
      specTemplateId,
      _id: { $in: originalPoms.map(p => p._id) }
    });
    await Promise.all(
      copiedPoms.map(pom =>
        CopiedSpecTemPoms.findByIdAndUpdate(pom._id, { $unset: { [size]: "" } }, { new: true })
      )
    );

    // Recalculate size range from updated POMs
    const allSizes = new Set();
    updatedPoms.forEach(pom => {
      const obj = pom.toObject();
      Object.keys(obj).forEach(key => {
        if (!["_id", "code", "description", "specTemplateId", "createdAt", "updatedAt", "__v"].includes(key)) {
          if (obj[key] !== undefined) allSizes.add(key);
        }
      });
    });

    const validSizes = Array.from(allSizes);
    const numericSizes = validSizes.filter(s => !isNaN(s)).map(Number).sort((a, b) => a - b);
    const letterSizes = validSizes.filter(s => isNaN(s)).sort();

    let sizeRangeParts = [];
    if (numericSizes.length > 0) {
      sizeRangeParts.push(`${numericSizes[0]}-${numericSizes[numericSizes.length - 1]}`);
    }
    if (letterSizes.length > 0) {
      sizeRangeParts.push(letterSizes.join("-"));
    }
    const newSizeRange = sizeRangeParts.join(", ");

    // Update size range in related models
    await SpecsTemplate.findByIdAndUpdate(specTemplateId, { $set: { Size_Range: newSizeRange } });
    await SampleGradedSpecs.updateMany({ spec_template_Id: specTemplateId }, { $set: { size_range: newSizeRange } });
    await CopiedSampleGradedSpecs.updateMany({ spec_template_Id: specTemplateId }, { $set: { size_range: newSizeRange } });

    res.status(200).json({
      message: `Size '${size}' deleted and size range updated.`,
      newSizeRange,
    });

  } catch (error) {
    console.error("Error deleting size:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getTemplatesByGarmentAndSize = async (req, res) => {
  try {
    const { garmentTypeId, sizeRange } = req.query;

    if (!garmentTypeId || !sizeRange) {
      return res.status(400).json({
        message: "Garment Type ID and Size Range are required.",
      });
    }

    const templates = await SpecsTemplate.find({
      spec_type: garmentTypeId,
      Size_Range: sizeRange,
    });

    if (templates.length === 0) {
      return res.status(404).json({
        message: "No templates found for the given criteria.",
      });
    }

    return res.status(200).json({ data: templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.getPOMsByTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Template ID is required." });
    }

    const poms = await SpecTemPoms.find({ specTemplateId: id });

    if (poms.length === 0) {
      return res
        .status(404)
        .json({ message: "No POMs found for the selected template." });
    }

    return res.status(200).json({
      data: poms,
    });
  } catch (error) {
    console.error("Error fetching POMs:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};
