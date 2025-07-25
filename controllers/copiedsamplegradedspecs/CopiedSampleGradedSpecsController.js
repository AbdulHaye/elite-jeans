const SampleGradedSpecs = require("../../models/samplegradedspecs/SampleGradedSpecsModel");
const CopiedSampleGradedSpecs = require("../../models/copiedsamplegradedspecs/CopiedSampleGradedSpecsModel");
const CopiedSpecTemPoms = require("../../models/copiedspecstemplatepom/CopiedSpecsTemplatePomModel");
const { default: mongoose } = require("mongoose");

// Define valid sizes at the top of your file
const VALID_SIZES = [
  // From 1-19
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "50",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "59",
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69",
  "70",
  "71",
  "72",
  "73",
  "74",
  "75",
  "76",
  "77",
  "78",
  "79",
  "80",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
  "100",

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
  // From XS-XXL
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "XXXXL",
  "XXXXXL",
  "XXXXXXL",
  "XXXXXXXL",
]; // Add all your size variants here

// exports.overrideCopiedSampleGradedSpecs = async (req, res) => {
//   try {
//     const { sampleGradedSpecsId, selectedSize } = req.body;

//     // Validate input
//     if (!sampleGradedSpecsId || !selectedSize) {
//       return res.status(400).json({
//         success: false,
//         message: "Both sampleGradedSpecsId and selectedSize are required",
//       });
//     }

//     // Validate selectedSize
//     if (!VALID_SIZES.includes(selectedSize)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid size. Valid sizes are: ${VALID_SIZES.join(", ")}`,
//       });
//     }

//     // Delete existing copied sample if any
//     await CopiedSampleGradedSpecs.deleteOne({
//       originalSampleGradedId: sampleGradedSpecsId,
//     });

//     // Find the original sample
//     const existingSample =
//       await SampleGradedSpecs.findById(sampleGradedSpecsId);
//     if (!existingSample) {
//       return res.status(404).json({
//         success: false,
//         message: "SampleGradedSpecs not found",
//       });
//     }

//     // Get existing POMs
//     const existingPOMs = await CopiedSpecTemPoms.find({
//       sampleGradedSpecsId,
//     });
//     let copiedPOMs = existingPOMs.map((pom) => {
//       const { _id, sampleGradedSpecsId, ...pomData } = pom.toObject();
//       return { ...pomData, sampleGradedSpecsId: existingSample._id };
//     });

//     console.log("Original POMs values:");
//     console.log(JSON.stringify(copiedPOMs, null, 2));

//     // Process POMs if they exist
//     if (copiedPOMs.length > 0) {
//       copiedPOMs = copiedPOMs.map((pom) => {
//         const updatedPom = { ...pom };

//         if (Object.prototype.hasOwnProperty.call(updatedPom, selectedSize)) {
//           const previousValue = parseFloat(updatedPom[selectedSize]) || 0;
//           console.log(`\nProcessing POM ${updatedPom.code}:`);
//           console.log(`Previous ${selectedSize} value:`, previousValue);
//           console.log(`Final value:`, updatedPom.Final);

//           // Set the selected size to the Final value
//           updatedPom[selectedSize] = updatedPom.Final;

//           const finalValue = parseFloat(updatedPom.Final) || 0;
//           const difference = finalValue - previousValue;
//           console.log(`Difference:`, difference);

//           // Update all other sizes
//           Object.keys(updatedPom).forEach((key) => {
//             // Skip if it's not a size field or if it's in the exclusion list
//             if (
//               !VALID_SIZES.includes(key) ||
//               [
//                 "Final",
//                 "code",
//                 "description",
//                 "specTemplateId",
//                 "tolerance",
//                 "createdAt",
//                 "updatedAt",
//                 "_id",
//                 "sampleGradedSpecsId",
//               ].includes(key) ||
//               key === selectedSize
//             ) {
//               return;
//             }

//             if (updatedPom[key] !== "" && !isNaN(updatedPom[key])) {
//               const currentVal = parseFloat(updatedPom[key]) || 0;
//               const newValue = currentVal + difference;
//               console.log(`Updating ${key}: ${currentVal} -> ${newValue}`);
//               updatedPom[key] = String(newValue);
//             }
//           });
//         }

//         return updatedPom;
//       });

//       console.log("\nUpdated POMs values:");
//       console.log(JSON.stringify(copiedPOMs, null, 2));
//     }

//     res.status(200).json({
//       success: true,
//       message: "Copied Sample Graded Specs updated successfully",
//       data: {
//         selectedSize,
//         updatedValues: copiedPOMs.map((pom) => {
//           return {
//             code: pom.code,
//             description: pom.description,
//             [selectedSize]: pom[selectedSize],
//             Final: pom.Final,
//           };
//         }),
//       },
//     });
//   } catch (error) {
//     console.error("Error in overrideCopiedSampleGradedSpecs:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };
//previous correct code

exports.overrideCopiedSampleGradedSpecs = async (req, res) => {
  try {
    const { sampleGradedSpecsId, selectedSize } = req.body;

    // Validate input
    if (!sampleGradedSpecsId || !selectedSize) {
      return res.status(400).json({
        success: false,
        message: "Both sampleGradedSpecsId and selectedSize are required",
      });
    }

    // Validate selectedSize
    if (!VALID_SIZES.includes(selectedSize)) {
      return res.status(400).json({
        success: false,
        message: `Invalid size. Valid sizes are: ${VALID_SIZES.join(", ")}`,
      });
    }

    // Delete existing copied sample if any
    await CopiedSampleGradedSpecs.deleteOne({
      originalSampleGradedId: sampleGradedSpecsId,
    });

    // Find the original sample
    const existingSample = await SampleGradedSpecs.findById(
      sampleGradedSpecsId
    );
    if (!existingSample) {
      return res.status(404).json({
        success: false,
        message: "SampleGradedSpecs not found",
      });
    }

    // Get existing POMs
    const existingPOMs = await CopiedSpecTemPoms.find({ sampleGradedSpecsId });
    let copiedPOMs = existingPOMs.map((pom) => {
      const { _id, sampleGradedSpecsId, ...pomData } = pom.toObject();
      return { ...pomData, sampleGradedSpecsId: existingSample._id };
    });

    console.log("Original POMs values:");
    console.log(JSON.stringify(copiedPOMs, null, 2));

    // Process POMs if they exist
    if (copiedPOMs.length > 0) {
      copiedPOMs = copiedPOMs.map((pom) => {
        const updatedPom = { ...pom };

        if (updatedPom.hasOwnProperty(selectedSize)) {
          const previousValue = parseFloat(updatedPom[selectedSize]) || 0;
          console.log(`\nProcessing POM ${updatedPom.code}:`);
          console.log(`Previous ${selectedSize} value:`, previousValue);
          console.log(`Final value:`, updatedPom.Final);

          // Set the selected size to the Final value
          updatedPom[selectedSize] = updatedPom.Final;

          const finalValue = parseFloat(updatedPom.Final) || 0;
          const difference = finalValue - previousValue;
          console.log(`Difference:`, difference);

          // Update all other sizes
          Object.keys(updatedPom).forEach((key) => {
            // Skip if it's not a size field or if it's in the exclusion list
            if (
              !VALID_SIZES.includes(key) ||
              [
                "Final",
                "code",
                "description",
                "specTemplateId",
                "tolerance",
                "createdAt",
                "updatedAt",
                "_id",
                "sampleGradedSpecsId",
              ].includes(key) ||
              key === selectedSize
            ) {
              return;
            }

            if (updatedPom[key] !== "" && !isNaN(updatedPom[key])) {
              const currentVal = parseFloat(updatedPom[key]) || 0;
              const newValue = currentVal + difference;
              console.log(`Updating ${key}: ${currentVal} -> ${newValue}`);
              updatedPom[key] = String(newValue);
            }
          });
        }

        return updatedPom;
      });

      console.log("\nUpdated POMs values:");
      console.log(JSON.stringify(copiedPOMs, null, 2));
    }

    // Create new copied sample
    const copiedSample = new CopiedSampleGradedSpecs({
      originalSampleGradedId: existingSample._id,
      techpack_Id: existingSample.techpack_Id,
      item_type_Id: existingSample.item_type_Id,
      size_range: existingSample.size_range,
      spec_template_Id: existingSample.spec_template_Id,
      workOrder_Id: existingSample.workOrder_Id,
      style_number: existingSample.style_number,
      fabric_content: existingSample.fabric_content,
      customer_or_brand: existingSample.customer_or_brand,
      size: selectedSize,
      garment_specs_details: existingSample.garment_specs_details,
      DesignDate: existingSample.DesignDate,
      IntialDate: existingSample.IntialDate,
      FirstPPdate: existingSample.FirstPPdate,
      Rev1date: existingSample.Rev1date,
      SecondPPdate: existingSample.SecondPPdate,
      Rev2date: existingSample.Rev2date,
      ThirdPPdate: existingSample.ThirdPPdate,
      Finaldate: existingSample.Finaldate,
      Shipdate: existingSample.Shipdate,
      copiedPOMs,
      realPOMs: [...copiedPOMs],
    });

    const savedCopiedSample = await copiedSample.save();

   res.status(200).json({
  success: true,
  message: "Copied Sample Graded Specs updated successfully",
  data: {
    copiedSample: {
      _id: savedCopiedSample._id,
    },
    selectedSize,
    updatedValues: copiedPOMs.map((pom) => {
      return {
        code: pom.code,
        description: pom.description,
        [selectedSize]: pom[selectedSize],
        Final: pom.Final,
      };
    }),
  },
});
  } catch (error) {
    console.error("Error in overrideCopiedSampleGradedSpecs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.createCopiedSampleGradedSpecs = async (req, res) => {
  try {
    const { sampleGradedSpecsId, selectedSize } = req.body;

    if (!sampleGradedSpecsId) {
      return res.status(400).json({
        success: false,
        message: "sampleGradedSpecsId is required",
      });
    }

    // Validate selectedSize if provided
    if (selectedSize && !VALID_SIZES.includes(selectedSize)) {
      return res.status(400).json({
        success: false,
        message: `Invalid size. Valid sizes are: ${VALID_SIZES.join(", ")}`,
      });
    }

    // Check if copied sample already exists
    const existingCopiedSample = await CopiedSampleGradedSpecs.findOne({
      originalSampleGradedId: sampleGradedSpecsId,
    });
    if (existingCopiedSample) {
      return res.status(400).json({
        success: false,
        message:
          "Copied Sample Graded Specs already exists for this sampleGradedSpecsId",
      });
    }

    // Find original sample
    const existingSample =
      await SampleGradedSpecs.findById(sampleGradedSpecsId);
    if (!existingSample) {
      return res.status(404).json({
        success: false,
        message: "SampleGradedSpecs not found",
      });
    }

    // Get existing POMs
    const existingPOMs = await CopiedSpecTemPoms.find({
      sampleGradedSpecsId,
    });
    console.log(
      "Original POMs data from CopiedSpecTemPoms:",
      JSON.stringify(existingPOMs, null, 2)
    );

    let copiedPOMs = existingPOMs.map((pom) => {
      const { _id, sampleGradedSpecsId, ...pomData } = pom.toObject();
      return { ...pomData, sampleGradedSpecsId: existingSample._id };
    });
    console.log(
      "Initial copied POMs data:",
      JSON.stringify(copiedPOMs, null, 2)
    );

    // Apply size override if selectedSize is provided
    if (selectedSize) {
      copiedPOMs = copiedPOMs.map((pom) => {
        const updatedPom = { ...pom };

        if (Object.prototype.hasOwnProperty.call(updatedPom, selectedSize)) {
          const previousValue = parseFloat(updatedPom[selectedSize]) || 0;
          const finalValue = parseFloat(updatedPom.Final) || 0;
          const difference = finalValue - previousValue;

          updatedPom[selectedSize] = updatedPom.Final;

          // Update all other sizes
          Object.keys(updatedPom).forEach((key) => {
            if (
              !VALID_SIZES.includes(key) ||
              [
                "Final",
                "code",
                "description",
                "specTemplateId",
                "tolerance",
                "createdAt",
                "updatedAt",
                "_id",
                "sampleGradedSpecsId",
              ].includes(key) ||
              key === selectedSize
            ) {
              return;
            }

            if (updatedPom[key] !== "" && !isNaN(updatedPom[key])) {
              const currentVal = parseFloat(updatedPom[key]) || 0;
              const newValue = currentVal + difference;
              updatedPom[key] = String(newValue);
            }
          });
        }

        return updatedPom;
      });
      console.log(
        "After size override, updated POMs data:",
        JSON.stringify(copiedPOMs, null, 2)
      );
    }

    // Create new copied sample
    const copiedSample = new CopiedSampleGradedSpecs({
      originalSampleGradedId: existingSample._id,
      techpack_Id: existingSample.techpack_Id,
      item_type_Id: existingSample.item_type_Id,
      size_range: existingSample.size_range,
      spec_template_Id: existingSample.spec_template_Id,
      workOrder_Id: existingSample.workOrder_Id,
      style_number: existingSample.style_number,
      fabric_content: existingSample.fabric_content,
      customer_or_brand: existingSample.customer_or_brand,
      size: selectedSize || existingSample.size,
      garment_specs_details: existingSample.garment_specs_details,
      DesignDate: existingSample.DesignDate,
      IntialDate: existingSample.IntialDate,
      FirstPPdate: existingSample.FirstPPdate,
      Rev1date: existingSample.Rev1date,
      SecondPPdate: existingSample.SecondPPdate,
      Rev2date: existingSample.Rev2date,
      ThirdPPdate: existingSample.ThirdPPdate,
      Finaldate: existingSample.Finaldate,
      Shipdate: existingSample.Shipdate,
      copiedPOMs,
      realPOMs: [...copiedPOMs],
    });

    const savedCopiedSample = await copiedSample.save();
    console.log("Final saved copied sample with POMs:", {
      copiedPOMs: savedCopiedSample.copiedPOMs,
      realPOMs: savedCopiedSample.realPOMs,
    });

    // Prepare response
    const responseData = {
      success: true,
      message: "Copied Sample Graded Specs created successfully",
      data: {
        copiedSample: savedCopiedSample,
      },
    };

    // Add override details if size was overridden
    if (selectedSize) {
      responseData.data.selectedSize = selectedSize;
      responseData.data.updatedValues = copiedPOMs.map((pom) => ({
        code: pom.code,
        description: pom.description,
        [selectedSize]: pom[selectedSize],
        Final: pom.Final,
      }));
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error("Error in createCopiedSampleGradedSpecs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getCopiedSampleGradedSpecsByTechPackId = async (req, res) => {
  try {
    const { techPackId } = req.params;

    // Verify ItemType model is registered (debugging)
    console.log("Registered models:", mongoose.modelNames());
    if (!mongoose.models.ItemType) {
      throw new Error("ItemType model not registered");
    }

    const copiedSamples = await CopiedSampleGradedSpecs.find({
      techpack_Id: techPackId,
    })
      .populate("copiedPOMs")
      .populate("realPOMs")
      .populate({
        path: "item_type_Id",
        model: "ItemType",
      })
      .populate({
        path: "techpack_Id",
        populate: {
          path: "itemType", // This is the field inside techpack_Id that you want to populate
          model: "ItemType", // Make sure this matches your model name
        },
      });

    if (!copiedSamples || copiedSamples.length === 0) {
      return res.status(404).json({
        message: "No Copied Sample Graded Specs found for this TechPack ID",
      });
    }

    res.status(200).json({
      message: "Copied Sample Graded Specs fetched successfully.",
      copiedSamples,
    });
  } catch (error) {
    console.error(
      "Error fetching Copied Sample Graded Specs by TechPack ID:",
      error
    );
    res.status(500).json({
      message: "Error fetching data",
      error: error.message,
    });
  }
};

exports.getCopiedSampleGradedSpecsByWorkOrderId = async (req, res) => {
  try {
    const { workOrderId } = req.params;

    const copiedSamples = await CopiedSampleGradedSpecs.find({
      workOrder_Id: workOrderId,
    })
      .populate("copiedPOMs")
      .populate("realPOMs")
      .populate({
        path: "item_type_Id",
        model: "ItemType",
      })
      .populate({
        path: "workOrder_Id",
        populate: {
          path: "itemType",
          model: "ItemType", // Make sure this matches your model name
        },
      });

    if (!copiedSamples || copiedSamples.length === 0) {
      return res.status(404).json({
        message: "No Copied Sample Graded Specs found for this Work Order ID",
      });
    }

    res.status(200).json({
      message: "Copied Sample Graded Specs fetched successfully.",
      copiedSamples,
    });
  } catch (error) {
    console.error(
      "Error fetching Copied Sample Graded Specs by Work Order ID:",
      error
    );
    res.status(500).json({
      message: "Error fetching data",
      error: error.message,
    });
  }
};

exports.getCopiedSampleGradedSpecsById = async (req, res) => {
  try {
    const { id } = req.params;

    const copiedSample =
      await CopiedSampleGradedSpecs.findById(id).populate("copiedPOMs");

    if (!copiedSample) {
      return res
        .status(404)
        .json({ message: "Copied Sample Graded Specs not found" });
    }

    res.status(200).json({
      message: "Copied Sample Graded Specs fetched successfully.",
      copiedSample,
    });
  } catch (error) {
    console.error("Error fetching Copied Sample Graded Specs:", error);
    res.status(500).json({
      message: "Error fetching Copied Sample Graded Specs",
      error: error.message,
    });
  }
};

exports.updateCopiedSampleGradedSpecs = async (req, res) => {
  try {
    const { id } = req.params; // ID of the copied sample to update
    const updateData = req.body;

    // Find the existing copied sample
    const existingSample = await CopiedSampleGradedSpecs.findById(id);
    if (!existingSample) {
      return res
        .status(404)
        .json({ message: "Copied Sample Graded Specs not found" });
    }

    existingSample.techpack_Id =
      updateData.techpack_Id || existingSample.techpack_Id;
    existingSample.item_type_Id =
      updateData.item_type_Id || existingSample.item_type_Id;
    existingSample.size_range =
      updateData.size_range || existingSample.size_range;
    existingSample.spec_template_Id =
      updateData.spec_template_Id || existingSample.spec_template_Id;
    existingSample.workOrder_Id =
      updateData.workOrder_Id || existingSample.workOrder_Id;
    existingSample.style_number =
      updateData.style_number || existingSample.style_number;
    existingSample.fabric_content =
      updateData.fabric_content || existingSample.fabric_content;
    existingSample.customer_or_brand =
      updateData.customer_or_brand || existingSample.customer_or_brand;
    existingSample.size = updateData.size || existingSample.size;
    existingSample.garment_specs_details =
      updateData.garment_specs_details || existingSample.garment_specs_details;
    existingSample.DesignDate =
      updateData.DesignDate || existingSample.DesignDate;
    existingSample.InitialDate =
      updateData.InitialDate || existingSample.InitialDate;
    existingSample.FirstPPdate =
      updateData.FirstPPdate || existingSample.FirstPPdate;
    existingSample.Rev1date = updateData.Rev1date || existingSample.Rev1date;
    existingSample.SecondPPdate =
      updateData.SecondPPdate || existingSample.SecondPPdate;
    existingSample.Rev2date = updateData.Rev2date || existingSample.Rev2date;
    existingSample.ThirdPPdate =
      updateData.ThirdPPdate || existingSample.ThirdPPdate;
    existingSample.Finaldate = updateData.Finaldate || existingSample.Finaldate;
    existingSample.Shipdate = updateData.Shipdate || existingSample.Shipdate;

    // Update copiedPOMs if provided
    if (updateData.copiedPOMs) {
      existingSample.copiedPOMs = updateData.copiedPOMs;
    }

    // Update realPOMs if provided
    if (updateData.realPOMs) {
      existingSample.realPOMs = updateData.realPOMs;
    }

    // Save updated data
    const updatedSample = await existingSample.save();

    res.status(200).json({
      message: "Copied Sample Graded Specs updated successfully.",
      updatedSample,
    });
  } catch (error) {
    console.error("Error updating Copied Sample Graded Specs:", error);
    res.status(500).json({
      message: "Error updating Copied Sample Graded Specs",
      error: error.message,
    });
  }
};

exports.deleteCopiedPom = async (req, res) => {
  try {
    const { id } = req.params;
    const { pomId } = req.body;

    const copiedSample = await CopiedSampleGradedSpecs.findById(id);
    if (!copiedSample) {
      return res.status(404).json({ message: "Copied Sample not found" });
    }

    const deleteIndex = copiedSample.copiedPOMs.findIndex(
      (pom) => pom._id.toString() === pomId
    );

    if (deleteIndex === -1) {
      return res.status(404).json({
        message: `POM not found for given id: ${pomId}`,
      });
    }

    copiedSample.copiedPOMs.splice(deleteIndex, 1);
    copiedSample.realPOMs.splice(deleteIndex, 1);
    copiedSample.updatedAt = new Date();
    await copiedSample.save();

    res.status(200).json({
      message: `POM with id: ${pomId} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting POM:", error);
    res.status(500).json({
      message: "Error deleting POM",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.updatePOM = async (req, res) => {
  try {
    const { id } = req.params;
    const { pomId, field, newValue } = req.body;

    if (!field || newValue === undefined || newValue === null) {
      return res
        .status(400)
        .json({ message: "Field and newValue are required" });
    }

    const copiedSample = await CopiedSampleGradedSpecs.findById(id);
    if (!copiedSample) {
      return res.status(404).json({ message: "Copied Sample not found" });
    }

    const pomIndex = copiedSample.realPOMs.findIndex(
      (pom) => pom._id.toString() === pomId
    );
    if (pomIndex === -1) {
      return res.status(404).json({ message: "POM not found in realPOMs" });
    }

    const pomToUpdate = copiedSample.realPOMs[pomIndex];
    if (!(field in pomToUpdate)) {
      return res
        .status(400)
        .json({ message: `Field ${field} does not exist in the POM` });
    }

    const originalValue = parseFloat(pomToUpdate[field]) || 0;
    const numericNewValue = parseFloat(newValue) || 0;
    const difference = numericNewValue - originalValue;

    // Step 1: Update realPOMs
    pomToUpdate[field] = newValue.toString();
    pomToUpdate.updatedAt = new Date();
    copiedSample.markModified("realPOMs");

    // Step 2: Update copiedPOMs at the same index
    if (copiedSample.copiedPOMs && copiedSample.copiedPOMs[pomIndex]) {
      const copiedPOM = copiedSample.copiedPOMs[pomIndex];

      const excludedFields = [
        "_id",
        "updatedAt",
        "createdAt",
        "code",
        "description",
        "specTemplateId",
        "tolerance",
        "Final",
        "FirstPP",
        "Initial",
        "Rev1",
        "Rev2",
        "SecondPP",
        "Ship",
        "ThirdPP",
      ];

      const sizeKeys = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "30",
        "31",
        "32",
        "33",
        "34",
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44",
        "45",
        "46",
        "47",
        "48",
        "49",
        "50",
        "51",
        "52",
        "53",
        "54",
        "55",
        "56",
        "57",
        "58",
        "59",
        "60",
        "61",
        "62",
        "63",
        "64",
        "65",
        "66",
        "67",
        "68",
        "69",
        "70",
        "71",
        "72",
        "73",
        "74",
        "75",
        "76",
        "77",
        "78",
        "79",
        "80",
        "81",
        "82",
        "83",
        "84",
        "85",
        "86",
        "87",
        "88",
        "89",
        "90",
        "91",
        "92",
        "93",
        "94",
        "95",
        "96",
        "97",
        "98",
        "99",
        "100",
        "X",
        "XX",
        "XXX",
        "XXXX",
        "XXXXX",
        "XXXXXXX",
        "XXXXXXXX",
        "XXXXXXXXX",
        "XXXXXXXXXX",
        "XXXXXXXXXXX",
        "XXXXXXXXXXXX",
        "XXXXXXXXXXXXX",
        "XXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXXX",
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL",
        "XXXL",
        "XXXXL",
        "XXXXXL",
        "XXXXXXL",
        "XXXXXXXL",
      ];

      for (const key of sizeKeys) {
        if (excludedFields.includes(key)) continue;
        if (copiedPOM[key] === undefined) continue;

        const currentValue = copiedPOM[key];
        const parsedValue = parseFloat(currentValue) || 0;
        copiedPOM[key] = (parsedValue + difference).toString();
      }

      copiedPOM.updatedAt = new Date();
      copiedSample.markModified(`copiedPOMs.${pomIndex}`);
    }

    copiedSample.updatedAt = new Date();
    await copiedSample.save();

    res.status(200).json({
      message: "POM updated successfully",
      updatedPOM: pomToUpdate,
      updatedCopiedPOM: copiedSample.copiedPOMs[pomIndex],
      originalValue,
      newValue,
      difference,
    });
  } catch (error) {
    console.error("Error updating POM:", error);
    res.status(500).json({
      message: "Error updating POM",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.deleteSizeFromCopiedSample = async (req, res) => {
  try {
    const { id, size } = req.params;

    const doc = await CopiedSampleGradedSpecs.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (Array.isArray(doc.realPOMs)) {
      doc.realPOMs = doc.realPOMs.map(pom => {
        pom[size] = undefined;
        return pom;
      });
    }

    if (Array.isArray(doc.copiedPOMs)) {
      doc.copiedPOMs = doc.copiedPOMs.map(pom => {
        pom[size] = undefined;
        return pom;
      });
    }

    // TODO: Update size range if necessary
    // if (typeof doc.size_range === "string") {
    //   const parts = doc.size_range.split(/[, -]+/);
    //   const newParts = parts.filter(p => p !== size);
    //   doc.size_range = newParts.join("-");
    // }

    doc.updatedAt = new Date();
    await doc.save();

    res.status(200).json({
      message: `Size '${size}' removed from copied sample`,
      updatedDoc: doc,
    });
  } catch (error) {
    console.error("Error deleting size from copied sample:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addSizeToCopiedSample = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, values } = req.body;

    const doc = await CopiedSampleGradedSpecs.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (
      !Array.isArray(values) ||
      values.length != doc.realPOMs.length ||
      values.length != doc.copiedPOMs.length
    ) {
      return res.status(400).send({
        message: "Invalid values passed."
      });
    }

    values.map((value, index) => {
      const pom = doc.realPOMs[index];
      const copy = doc.copiedPOMs[index];

      if (pom) pom[size] = value;
      if (copy) copy[size] = value;
    });

    await doc.save();

    return res.status(200).json({
      message: "New size addedd successfully!",
      data: doc,
    });
  } catch (error) {
    console.error("Error adding size from copied sample:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllCopiedSampleGradedSpecs = async (_req, res) => {
  try {
    const copiedSamples = await CopiedSampleGradedSpecs.find().populate(
      "techpack_Id item_type_Id spec_template_Id workOrder_Id"
    );
    res.status(200).json({ data: copiedSamples });
  } catch (error) {
    console.error("Error fetching copied samples:", error);
    res.status(500).json({
      message: "Error fetching copied samples",
      error: error.message,
    });
  }
};

// Get a single Copied Sample Graded Specs by ID
exports.getAllCopiedSampleGradedSpecs = async (_req, res) => {
  try {
    // Fetch all copied sample graded specs
    const copiedSamples = await CopiedSampleGradedSpecs.find();

    if (!copiedSamples.length) {
      return res
        .status(404)
        .json({ message: "No Copied Sample Graded Specs found." });
    }

    // Fetch all POMs linked to these copied samples
    const copiedSampleIds = copiedSamples.map((sample) => sample._id);
    const copiedPOMs = await CopiedSpecTemPoms.find({
      sampleGradedSpecsId: { $in: copiedSampleIds },
    });

    res.status(200).json({
      message: "Copied Sample Graded Specs retrieved successfully.",
      copiedSamples,
      copiedPOMs,
    });
  } catch (error) {
    console.error("Error fetching Copied Sample Graded Specs:", error);
    res.status(500).json({
      message: "Error fetching Copied Sample Graded Specs",
      error: error.message,
    });
  }
};

// Update Copied Sample Graded Specs
exports.updateCopiedSampleGradedSpecs = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedSample = await CopiedSampleGradedSpecs.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("techpack_Id item_type_Id spec_template_Id workOrder_Id");

    if (!updatedSample) {
      return res
        .status(404)
        .json({ message: "Copied Sample Graded Specs not found" });
    }

    res.status(200).json({
      message: "Copied Sample Graded Specs updated successfully",
      data: updatedSample,
    });
  } catch (error) {
    console.error("Error updating copied sample:", error);
    res.status(500).json({
      message: "Error updating copied sample",
      error: error.message,
    });
  }
};

// Delete Copied Sample Graded Specs
exports.deleteCopiedSampleGradedSpecs = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSample = await CopiedSampleGradedSpecs.findByIdAndDelete(id);

    if (!deletedSample) {
      return res
        .status(404)
        .json({ message: "Copied Sample Graded Specs not found" });
    }

    res.status(200).json({
      message: "Copied Sample Graded Specs deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting Copied Sample Graded Specs:", error);
    res.status(500).json({
      message: "Error deleting Copied Sample Graded Specs",
      error: error.message,
    });
  }
};
