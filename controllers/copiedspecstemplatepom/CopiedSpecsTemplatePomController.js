const CopiedSpecTemPoms = require("../../models/copiedspecstemplatepom/CopiedSpecsTemplatePomModel");
const PointOfMeasure = require("../../models/pom/PomModel");
const SpecsTemplate = require("../../models/specstemplate/SpecsTemplateModel");

exports.getCopiedPOMsBySampleAndTemplate = async (req, res) => {
  try {
    const { sampleGradedSpecsId, specTemplateId } = req.params;

    if (!sampleGradedSpecsId || !specTemplateId) {
      return res.status(400).json({
        message:
          "Both Sample Graded Specs ID and Spec Template ID are required.",
      });
    }

    const copiedPOMs = await CopiedSpecTemPoms.find({
      sampleGradedSpecsId,
      specTemplateId,
    })
      .populate("specTemplateId")
      .exec();

    if (!copiedPOMs || copiedPOMs.length === 0) {
      return res.status(404).json({
        message:
          "No copied POM records found for the given Sample Graded Specs ID and Spec Template ID.",
      });
    }

    return res.status(200).json({
      message: "Copied POM records retrieved successfully.",
      data: copiedPOMs,
    });
  } catch (error) {
    console.error("Error fetching copied POM records:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.deleteCopiedPOMRecord = async (req, res) => {
  try {
    const { deletedid } = req.params;

    if (!deletedid) {
      return res.status(400).json({
        message: "Copied POM ID is required to delete the record.",
      });
    }

    // Delete a single record from CopiedSpecTemPoms
    const deletedCopiedPOM =
      await CopiedSpecTemPoms.findByIdAndDelete(deletedid);

    if (!deletedCopiedPOM) {
      return res.status(404).json({ message: "Copied POM record not found." });
    }

    return res.status(200).json({
      message: "Copied POM record deleted successfully.",
      deletedCopiedPOM,
    });
  } catch (error) {
    console.error("Error deleting copied POM record:", error);
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

    const result = await CopiedSpecTemPoms.deleteMany({
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

exports.updateCopiedPOMRecord = async (req, res) => {
  try {
    const { pomId } = req.params;
    const updateData = req.body;

    if (!pomId || !updateData) {
      return res.status(400).json({
        message: "POM ID and update data are required.",
      });
    }

    const updatedCopiedPOM = await CopiedSpecTemPoms.findByIdAndUpdate(
      pomId,
      updateData,
      { new: true }
    );

    if (!updatedCopiedPOM) {
      return res.status(404).json({
        message: "POM record not found in CopiedSpecTemPoms.",
      });
    }

    return res.status(200).json({
      message: "Copied POM record updated successfully.",
      updatedCopiedPOM,
    });
  } catch (error) {
    console.error("Error updating copied POM record:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.getCopiedPOMsBySpecTemplateId = async (req, res) => {
  try {
    const { specTemplateId } = req.params;

    if (!specTemplateId) {
      return res
        .status(400)
        .json({ message: "Spec Template   ID is required." });
    }
    const copiedPOMs = await CopiedSpecTemPoms.find({ specTemplateId })
      .populate("specTemplateId")
      .exec();

    if (!copiedPOMs || copiedPOMs.length === 0) {
      return res.status(404).json({
        message:
          "No copied POM records found for the provided Spec Template ID.",
      });
    }

    return res.status(200).json({
      message: "Copied POM records retrieved successfully.",
      data: copiedPOMs,
    });
  } catch (error) {
    console.error("Error fetching copied POM records:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.getCopiedPOMById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Copied POM ID is required.",
      });
    }
    const copiedPOM = await CopiedSpecTemPoms.findById(id)
      .populate("specTemplateId")
      .exec();

    if (!copiedPOM) {
      return res.status(404).json({ message: "Copied POM record not found." });
    }

    return res.status(200).json({
      message: "Copied POM record retrieved successfully.",
      data: copiedPOM,
    });
  } catch (error) {
    console.error("Error fetching copied POM record:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

//mas update controller code
exports.updateMultipleCopiedPOMs = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        message: "Updates array is required in the request body.",
      });
    }
    // Prepare bulk write operations
    const bulkOps = updates.map((update) => {
      if (!update.id) {
        throw new Error("Each update must contain an 'id' field.");
      }
      // Remove id from update data (we don't want to update the ID)
      const { id, ...updateData } = update;
      return {
        updateOne: {
          filter: { _id: id },
          update: { $set: updateData },
        },
      };
    });
    // Execute bulk write
    const result = await CopiedSpecTemPoms.bulkWrite(bulkOps);
    return res.status(200).json({
      message: "Multiple POM records updated successfully.",
      updatedCount: result.modifiedCount,
      data: result,
    });
  } catch (error) {
    console.error("Error updating multiple POM records:", error);
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};
// create new record
exports.createCopiedPOM = async (req, res) => {
  try {
    const { sampleGradedSpecsId, specTemplateId } = req.params;
    const {
      code,
      description,
      tolerance,
      design,
      Initial,
      FirstPP,
      Rev1,
      SecondPP,
      Rev2,
      ThirdPP,
      Final,
      Ship,
      // Numeric fields
      0: zero,
      1: one,
      2: two,
      3: three,
      4: four,
      5: five,
      6: six,
      7: seven,
      8: eight,
      9: nine,
      10: ten,
      11: eleven,
      12: twelve,
      13: thirteen,
      14: fourteen,
      15: fifteen,
      16: sixteen,
      17: seventeen,
      18: eighteen,
      19: nineteen,
      20: twenty,
      22: twentyTwo,
      24: twentyFour,
      25: twentyFive,
      26: twentySix,
      28: twentyEight,
      // Size fields
      XS,
      S,
      M,
      L,
      XL,
      XXL,
      X,
      XX,
      XXX,
      XXXX,
    } = req.body;

    if (!sampleGradedSpecsId || !specTemplateId) {
      return res.status(400).json({
        message:
          "Both Sample Graded Specs ID and Spec Template ID are required.",
      });
    }

    if (!code || !description || !tolerance) {
      return res.status(400).json({
        message: "Code, description, and tolerance are required fields.",
      });
    }

    // Get the SpecsTemplate to determine the Size_Range
    const specsTemplate = await SpecsTemplate.findById(specTemplateId);
    if (!specsTemplate) {
      return res.status(404).json({
        message: "Spec Template not found.",
      });
    }

    const sizeRange = specsTemplate.Size_Range;
    const newCopiedPOMData = {
      sampleGradedSpecsId,
      specTemplateId,
      code,
      description,
      tolerance,
      design: design || null,
      Initial: Initial || null,
      FirstPP: FirstPP || null,
      Rev1: Rev1 || null,
      SecondPP: SecondPP || null,
      Rev2: Rev2 || null,
      ThirdPP: ThirdPP || null,
      Final: Final || null,
      Ship: Ship || null,
    };

    // Add size fields based on the Size_Range
    switch (sizeRange) {
      case "1-19":
        newCopiedPOMData[0] = zero || null;
        newCopiedPOMData[1] = one || null;
        newCopiedPOMData[3] = three || null;
        newCopiedPOMData[5] = five || null;
        newCopiedPOMData[7] = seven || null;
        newCopiedPOMData[9] = nine || null;
        newCopiedPOMData[11] = eleven || null;
        newCopiedPOMData[13] = thirteen || null;
        newCopiedPOMData[15] = fifteen || null;
        newCopiedPOMData[17] = seventeen || null;
        newCopiedPOMData[19] = nineteen || null;
        break;
      case "7-16":
        newCopiedPOMData[7] = seven || null;
        newCopiedPOMData[8] = eight || null;
        newCopiedPOMData[10] = ten || null;
        newCopiedPOMData[12] = twelve || null;
        newCopiedPOMData[14] = fourteen || null;
        newCopiedPOMData[16] = sixteen || null;
        break;
      case "0-16":
        newCopiedPOMData[0] = zero || null;
        newCopiedPOMData[2] = two || null;
        newCopiedPOMData[4] = four || null;
        newCopiedPOMData[6] = six || null;
        newCopiedPOMData[8] = eight || null;
        newCopiedPOMData[10] = ten || null;
        newCopiedPOMData[12] = twelve || null;
        newCopiedPOMData[14] = fourteen || null;
        newCopiedPOMData[16] = sixteen || null;
        break;
      case "14-28":
        newCopiedPOMData[14] = fourteen || null;
        newCopiedPOMData[16] = sixteen || null;
        newCopiedPOMData[18] = eighteen || null;
        newCopiedPOMData[20] = twenty || null;
        newCopiedPOMData[22] = twentyTwo || null;
        newCopiedPOMData[24] = twentyFour || null;
        newCopiedPOMData[26] = twentySix || null;
        newCopiedPOMData[28] = twentyEight || null;
        break;
      case "1X-4X":
        newCopiedPOMData.X = X || null;
        newCopiedPOMData.XX = XX || null;
        newCopiedPOMData.XXX = XXX || null;
        newCopiedPOMData.XXXX = XXXX || null;
        break;
      case "XS-XXL":
        newCopiedPOMData.XS = XS || null;
        newCopiedPOMData.S = S || null;
        newCopiedPOMData.M = M || null;
        newCopiedPOMData.L = L || null;
        newCopiedPOMData.XL = XL || null;
        newCopiedPOMData.XXL = XXL || null;
        break;
      default:
        // If no size range matches, include all fields
        Object.assign(newCopiedPOMData, {
          0: zero || null,
          1: one || null,
          2: two || null,
          3: three || null,
          4: four || null,
          5: five || null,
          6: six || null,
          7: seven || null,
          8: eight || null,
          9: nine || null,
          10: ten || null,
          11: eleven || null,
          12: twelve || null,
          13: thirteen || null,
          14: fourteen || null,
          15: fifteen || null,
          16: sixteen || null,
          17: seventeen || null,
          18: eighteen || null,
          19: nineteen || null,
          20: twenty || null,
          22: twentyTwo || null,
          24: twentyFour || null,
          25: twentyFive || null,
          26: twentySix || null,
          28: twentyEight || null,
          XS: XS || null,
          S: S || null,
          M: M || null,
          L: L || null,
          XL: XL || null,
          XXL: XXL || null,
          X: X || null,
          XX: XX || null,
          XXX: XXX || null,
          XXXX: XXXX || null,
        });
    }

    const newCopiedPOM = new CopiedSpecTemPoms(newCopiedPOMData);
    const savedRecord = await newCopiedPOM.save();

    return res.status(201).json({
      message: "Copied POM record created successfully.",
      data: savedRecord,
    });
  } catch (error) {
    console.error("Error creating copied POM record:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.addPOMsToCopiedPOMs = async (req, res) => {
  try {
    const { sampleGradedSpecsId, specTemplateId } = req.params;
    const { pomIds } = req.body;

    // Validate required fields
    if (!sampleGradedSpecsId || !specTemplateId) {
      return res.status(400).json({
        message:
          "Both Sample Graded Specs ID and Spec Template ID are required.",
      });
    }

    if (!pomIds || !Array.isArray(pomIds) || pomIds.length === 0) {
      return res.status(400).json({
        message: "Please provide an array of valid Point of Measure IDs.",
      });
    }

    // Get the Spec Template to determine sizeRange
    const specsTemplate = await SpecsTemplate.findById(specTemplateId);
    if (!specsTemplate) {
      return res.status(404).json({ message: "Spec Template not found." });
    }
    const sizeRange = specsTemplate.Size_Range;

    // Fetch POMs
    const existingPOMs = await PointOfMeasure.find({
      _id: { $in: pomIds },
    });
    if (existingPOMs.length !== pomIds.length) {
      const missingIds = pomIds.filter(
        (id) => !existingPOMs.some((pom) => pom._id.equals(id))
      );
      return res.status(400).json({
        message: "Some Point of Measure IDs are invalid.",
        missingIds,
      });
    }

    // Check for duplicates based on code
    const existingCodes = await CopiedSpecTemPoms.find({
      sampleGradedSpecsId,
      specTemplateId,
    }).distinct("code");

    const newPOMs = existingPOMs.filter(
      (pom) => !existingCodes.includes(pom.code)
    );

    if (newPOMs.length === 0) {
      return res.status(200).json({
        message: "All POMs already exist in the table.",
        data: [],
      });
    }

    // Prepare new records with size range values
    const recordsToInsert = newPOMs.map((pom) => {
      const {
        _id,
        code,
        description,
        tolerance,
        design,
        Initial,
        FirstPP,
        Rev1,
        SecondPP,
        Rev2,
        ThirdPP,
        Final,
        Ship,
        0: zero,
        1: one,
        2: two,
        3: three,
        4: four,
        5: five,
        6: six,
        7: seven,
        8: eight,
        9: nine,
        10: ten,
        11: eleven,
        12: twelve,
        13: thirteen,
        14: fourteen,
        15: fifteen,
        16: sixteen,
        17: seventeen,
        18: eighteen,
        19: nineteen,
        20: twenty,
        22: twentyTwo,
        24: twentyFour,
        25: twentyFive,
        26: twentySix,
        28: twentyEight,
        XS,
        S,
        M,
        L,
        XL,
        XXL,
        X,
        XX,
        XXX,
        XXXX,
      } = pom;

      const newCopiedPOMData = {
        sampleGradedSpecsId,
        specTemplateId,
        pointOfMeasureId: _id,
        code,
        description,
        tolerance,
        design: design || null,
        Initial: Initial || null,
        FirstPP: FirstPP || null,
        Rev1: Rev1 || null,
        SecondPP: SecondPP || null,
        Rev2: Rev2 || null,
        ThirdPP: ThirdPP || null,
        Final: Final || null,
        Ship: Ship || null,
      };

      switch (sizeRange) {
        case "1-19":
          Object.assign(newCopiedPOMData, {
            0: zero || null,
            1: one || null,
            3: three || null,
            5: five || null,
            7: seven || null,
            9: nine || null,
            11: eleven || null,
            13: thirteen || null,
            15: fifteen || null,
            17: seventeen || null,
            19: nineteen || null,
          });
          break;
        case "7-16":
          Object.assign(newCopiedPOMData, {
            7: seven || null,
            8: eight || null,
            10: ten || null,
            12: twelve || null,
            14: fourteen || null,
            16: sixteen || null,
          });
          break;
        case "0-16":
          Object.assign(newCopiedPOMData, {
            0: zero || null,
            2: two || null,
            4: four || null,
            6: six || null,
            8: eight || null,
            10: ten || null,
            12: twelve || null,
            14: fourteen || null,
            16: sixteen || null,
          });
          break;
        case "14-28":
          Object.assign(newCopiedPOMData, {
            14: fourteen || null,
            16: sixteen || null,
            18: eighteen || null,
            20: twenty || null,
            22: twentyTwo || null,
            24: twentyFour || null,
            26: twentySix || null,
            28: twentyEight || null,
          });
          break;
        case "1X-4X":
          Object.assign(newCopiedPOMData, {
            X: X || null,
            XX: XX || null,
            XXX: XXX || null,
            XXXX: XXXX || null,
          });
          break;
        case "XS-XXL":
          Object.assign(newCopiedPOMData, {
            XS: XS || null,
            S: S || null,
            M: M || null,
            L: L || null,
            XL: XL || null,
            XXL: XXL || null,
          });
          break;
        default:
          Object.assign(newCopiedPOMData, {
            0: zero || null,
            1: one || null,
            2: two || null,
            3: three || null,
            4: four || null,
            5: five || null,
            6: six || null,
            7: seven || null,
            8: eight || null,
            9: nine || null,
            10: ten || null,
            11: eleven || null,
            12: twelve || null,
            13: thirteen || null,
            14: fourteen || null,
            15: fifteen || null,
            16: sixteen || null,
            17: seventeen || null,
            18: eighteen || null,
            19: nineteen || null,
            20: twenty || null,
            22: twentyTwo || null,
            24: twentyFour || null,
            25: twentyFive || null,
            26: twentySix || null,
            28: twentyEight || null,
            XS: XS || null,
            S: S || null,
            M: M || null,
            L: L || null,
            XL: XL || null,
            XXL: XXL || null,
            X: X || null,
            XX: XX || null,
            XXX: XXX || null,
            XXXX: XXXX || null,
          });
      }

      return newCopiedPOMData;
    });

    // Insert records
    const insertedRecords = await CopiedSpecTemPoms.insertMany(recordsToInsert);

    // Populate and return inserted records
    const populatedRecords = await CopiedSpecTemPoms.find({
      _id: { $in: insertedRecords.map((r) => r._id) },
    })
      .populate("pointOfMeasureId")
      .populate("specTemplateId")
      .populate("sampleGradedSpecsId");

    return res.status(201).json({
      message: `${insertedRecords.length} new POMs added successfully.`,
      skipped: existingPOMs.length - newPOMs.length,
      data: populatedRecords,
    });
  } catch (error) {
    console.error("Error in addPOMsToCopiedPOMs:", error);
    return res.status(500).json({
      message: "Server error while adding POMs",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
