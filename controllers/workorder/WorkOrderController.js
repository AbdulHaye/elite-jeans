const mongoose = require("mongoose");
const WorkOrder = require("../../models/workorder/WorkOrderModel");
const { uploadToS3 } = require("../../utils/s3Client");
const { validationResult } = require("express-validator");
const SampleRequest = require("../../models/samplerequest/SampleRequestModel");
const StyleDetail = require("../../models/styledetail/StyleDetailModel");
const WashDetail = require("../../models/washdetails/WashDetailModel");
const NewDetail = require("../../models/newdetail/NewDetailModel");
const Color = require("../../models/color/ColorModel");
const ItemDetail = require("../../models/itemdetail/ItemDetailModel");
const Client = require("../../models/client/ClientModel");
const Vendor = require("../../models/vendor/VendorModel");
const TechPack = require("../../models/techpack/TechPackModel");
const SalesContract = require("../../models/salescontract/SalesContractModel");
const Category = require("../../models/category/CategoryModel"); // Ensure you import Category model
const ItemType = require("../../models/itemtype/ItemTypeModel");
const SubCategory = require("../../models/subcategory/SubCategoryModel");
const SampleGradedSpecs = require("../../models/samplegradedspecs/SampleGradedSpecsModel");
const CopiedSampleGradedSpecs = require("../../models/copiedsamplegradedspecs/CopiedSampleGradedSpecsModel");
const { sendWorkOrderEmail } = require("../../utils/emailService");
const CopiedSpecTemPoms = require("../../models/copiedspecstemplatepom/CopiedSpecsTemplatePomModel");
const DigitalPatternModel = require("../../models/digitalpattern/DigitalPatternModel");
const DesignComments = require('../../models/designcomment/DesignCommentModel');
const FitComments = require('../../models/fitcomment/FitCommentModel');
const ASN = require("../../models/asn/ASNModel");
const Arrangement = require("../../models/arrangement/ArrangementModel");
// or mongoose.Types.ObjectId if using mongoose
// const DesignComments = require("../models/designCommentsModel");
// const FitComments = require("../models/fitCommentsModel");
// const sendWorkOrderEmail = require("../emails/workOrderEmail");
// const SampleStatus = require("../models/sampleStatusModel");
// const SampleRequestingStatus = require("../models/sampleRequestingStatus");
// const PDFDocument = require("pdfkit");
// const path = require("path");
// const { generateWorkOrderPDF } = require("../services/workorder-pdf.service");

// exports.createWorkOrder = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { vendor, category, itemType, subCategory, etd } = req.body;

//     if (!vendor || !category || !itemType || !subCategory) {
//       return res
//         .status(400)
//         .json({ message: "All required fields must be provided" });
//     }

//     const newWorkOrder = new workOrder({
//       vendor,
//       category,
//       itemType,
//       subCategory,
//       etd,
//       shippingStatus: "open",
//     });

//     await newWorkOrder.save();

//     res.status(201).json({
//       message: "WorkOrder created successfully",
//       data: newWorkOrder,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error creating WorkOrder", error: error.message });
//   }
// };
const generateUniqueWorkOrderId = async () => {
  try {
    const lastWorkOrder = await WorkOrder
      .aggregate([
        {
          $match: { workOrderId: /^WO-\d+$/ }, // Ensure correct format
        },
        {
          $project: {
            numericId: {
              $toInt: {
                $arrayElemAt: [{ $split: ["$workOrderId", "-"] }, 1],
              },
            },
          },
        },
        {
          $sort: { numericId: -1 }, // Sort numerically in descending order
        },
        { $limit: 1 }, // Get the latest one
      ])
      .exec();
    let newCounter = 1; // Default if no previous work order exists
    if (lastWorkOrder.length > 0) {
      newCounter = lastWorkOrder[0].numericId + 1; // Increment correctly
    }
    return `WO-${newCounter}`;
  } catch (error) {
    throw new Error("Error generating unique work order ID: " + error.message);
  }
};

// Generate a unique techPackId
const generateUniqueTechPackId = async () => {
  try {
    // Find the last tech pack sorted by `techPackId`
    const lastTechPack = await TechPack.findOne({})
      .sort({ techPackId: -1 })
      .exec();
    let newCounter = 1;

    if (lastTechPack && lastTechPack.techPackId) {
      const lastId = lastTechPack.techPackId.split("-")[1]; // Extract numeric part
      newCounter = parseInt(lastId, 10) + 1; // Increment
    }

    return `TP-${newCounter}`; // Format as TP-{number}
  } catch (error) {
    throw new Error("Error generating unique tech pack ID: " + error.message);
  }
};

exports.createWorkOrderInTechPack = async (req, res) => {
  try {
    const { workOrderId } = req.params;

    // Fetch the workOrder by ID with correct population paths
    const existingWorkOrder = await WorkOrder
      .findById(workOrderId)
      .populate("vendor categories itemType subCategories trim_id pictures");

    if (!existingWorkOrder) {
      return res.status(404).json({ message: "WorkOrder not found" });
    }

    // Generate a unique techPackId
    const techPackId = await generateUniqueTechPackId();

    // Create a new TechPack using the data from the WorkOrder
    const newTechPack = new TechPack({
      techPackId,
      styleId: existingWorkOrder.styleId || null,
      vendor: existingWorkOrder.vendor,
      categories: existingWorkOrder.categories,
      itemType: existingWorkOrder.itemType,
      subCategory: existingWorkOrder.subCategories[0], // Assuming you want the first subCategory
      pictures: existingWorkOrder.pictures,
      buttonImages: existingWorkOrder.buttonImages,
      rivetImages: existingWorkOrder.rivetImages,
    });

    // Save the TechPack in the database
    await newTechPack.save();

    res.status(201).json({
      message: "TechPack created successfully",
      data: newTechPack,
    });
  } catch (error) {
    console.error("Error creating TechPack:", error.message);
    res.status(500).json({
      message: "Error creating TechPack",
      error: error.message,
    });
  }
};


// exports.createRepeatWorkOrder = async (req, res) => {
//   try {
//     const { workOrderId } = req.params;
//     console.log("taha", workOrderId);

//     // Fetch the workOrder by ID
//     const existingWorkOrder = await WorkOrder
//       .findById(workOrderId)
//       .populate("vendor category itemType subCategory trim_id pictures");
//     if (!existingWorkOrder) {
//       return res.status(404).json({ message: "WorkOrder not found" });
//     }

//     // Generate a unique WorkOrder ID (ensure this is resolved)
//     const newWorkOrderId = await generateUniqueWorkOrderId();

//     // Create a new WorkOrder with the same data but a new WorkOrderId
//     const clonedWorkOrder = new WorkOrder({
//       ...existingWorkOrder.toObject(),
//       _id: undefined,
//       workOrderId: newWorkOrderId,
//       createdAt: Date.now(),
//     });

//     // Save the cloned WorkOrder
//     await clonedWorkOrder.save();

//     res.status(201).json({
//       message: "WorkOrder cloned successfully",
//       data: clonedWorkOrder,
//     });
//   } catch (error) {
//     console.error("Error cloning WorkOrder:", error);
//     res.status(500).json({
//       message: "Error cloning WorkOrder",
//       error: error.message,
//     });
//   }
// };

// correct function to repeat work order
// exports.createRepeatWorkOrder = async (req, res) => {
//   try {
//     const { workOrderId } = req.params;
//     console.log("Cloning work order:", workOrderId);

//     // 1. Fetch and clone the main WorkOrder
//     const existingWorkOrder = await WorkOrder
//       .findById(workOrderId)
//       .populate("vendor category itemType subCategory trim_id pictures");
    
//     if (!existingWorkOrder) {
//       return res.status(404).json({ message: "WorkOrder not found" });
//     }

//     // Generate a unique WorkOrder ID
//     const newWorkOrderId = await generateUniqueWorkOrderId();

//     // Create a new WorkOrder with the same data but a new WorkOrderId
//     const clonedWorkOrder = new WorkOrder({
//       ...existingWorkOrder.toObject(),
//       _id: undefined,
//       workOrderId: newWorkOrderId,
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     });

//     // Save the cloned WorkOrder
//     await clonedWorkOrder.save();

//     // 2. Clone Style Details and maintain mapping of old to new IDs
//     const styleDetails = await StyleDetail.find({ workOrder_Id: workOrderId });
//     const styleDetailMap = new Map(); // oldId -> newId
//     if (styleDetails.length > 0) {
//       const styleDetailPromises = styleDetails.map(async styleDetail => {
//         const newStyleDetail = new StyleDetail({
//           ...styleDetail.toObject(),
//           _id: undefined,
//           workOrder_Id: clonedWorkOrder._id
//         });
//         const savedStyleDetail = await newStyleDetail.save();
//         styleDetailMap.set(styleDetail._id.toString(), savedStyleDetail._id);
//         return savedStyleDetail;
//       });
//       await Promise.all(styleDetailPromises);
//     }

//     // 3. Clone Wash Details and maintain mapping of old to new IDs
//     const washDetails = await WashDetail.find({ workOrder_Id: workOrderId });
//     const washDetailMap = new Map(); // oldId -> newId
//     if (washDetails.length > 0) {
//       const washDetailPromises = washDetails.map(async washDetail => {
//         const newWashDetail = new WashDetail({
//           ...washDetail.toObject(),
//           _id: undefined,
//           workOrder_Id: clonedWorkOrder._id
//         });
//         const savedWashDetail = await newWashDetail.save();
//         washDetailMap.set(washDetail._id.toString(), savedWashDetail._id);
//         return savedWashDetail;
//       });
//       await Promise.all(washDetailPromises);
//     }

//     // 4. Clone Sample Requests
//     const sampleRequests = await SampleRequest.find({ workOrder_Id: workOrderId });
//     if (sampleRequests.length > 0) {
//       const sampleRequestPromises = sampleRequests.map(sampleRequest => {
//         const newSampleRequest = new SampleRequest({
//           ...sampleRequest.toObject(),
//           _id: undefined,
//           workOrder_Id: clonedWorkOrder._id
//         });
//         return newSampleRequest.save();
//       });
//       await Promise.all(sampleRequestPromises);
//     }

//     // 5. Clone Item Details
//     const itemDetails = await ItemDetail.find({ workOrder_Id: workOrderId });
//     if (itemDetails.length > 0) {
//       const itemDetailPromises = itemDetails.map(itemDetail => {
//         const newItemDetail = new ItemDetail({
//           ...itemDetail.toObject(),
//           _id: undefined,
//           workOrder_Id: clonedWorkOrder._id
//         });
//         return newItemDetail.save();
//       });
//       await Promise.all(itemDetailPromises);
//     }

//     // 6. Clone New Details (must be done after style and wash details)
//     const newDetails = await NewDetail.find({ workOrder_Id: workOrderId });
//     if (newDetails.length > 0) {
//       const newDetailPromises = newDetails.map(newDetail => {
//         // Map the old style_detail_id or wash_detail_id to the new ones
//         const newStyleDetailId = newDetail.style_detail_id 
//           ? styleDetailMap.get(newDetail.style_detail_id.toString()) 
//           : undefined;
        
//         const newWashDetailId = newDetail.wash_detail_id 
//           ? washDetailMap.get(newDetail.wash_detail_id.toString()) 
//           : undefined;

//         return new NewDetail({
//           ...newDetail.toObject(),
//           _id: undefined,
//           workOrder_Id: clonedWorkOrder._id,
//           style_detail_id: newStyleDetailId,
//           wash_detail_id: newWashDetailId
//         }).save();
//       });
//       await Promise.all(newDetailPromises);
//     }

//     res.status(201).json({
//       message: "WorkOrder and all related data cloned successfully",
//       data: {
//         workOrder: clonedWorkOrder,
//         styleDetails: styleDetails.length,
//         washDetails: washDetails.length,
//         sampleRequests: sampleRequests.length,
//         itemDetails: itemDetails.length,
//         newDetails: newDetails.length
//       },
//     });
//   } catch (error) {
//     console.error("Error cloning WorkOrder:", error);
//     res.status(500).json({
//       message: "Error cloning WorkOrder and related data",
//       error: error.message,
//       stack: error.stack // Include stack trace for debugging
//     });
//   }
// };

//work till sample garded creation copy

exports.createRepeatWorkOrder = async (req, res) => {
  try {
    const { workOrderId } = req.params;
    console.log("Cloning work order:", workOrderId);

    // 1. Fetch and clone the main WorkOrder
    const existingWorkOrder = await WorkOrder
      .findById(workOrderId)
      .populate("vendor categories itemType subCategories trim_id pictures");
    
    if (!existingWorkOrder) {
      return res.status(404).json({ message: "WorkOrder not found" });
    }

    // Generate a unique WorkOrder ID
    const newWorkOrderId = await generateUniqueWorkOrderId();

    // Create a new WorkOrder with the same data but a new WorkOrderId
    const clonedWorkOrder = new WorkOrder({
      ...existingWorkOrder.toObject(),
      _id: undefined,
      workOrderId: newWorkOrderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Save the cloned WorkOrder
    await clonedWorkOrder.save();

    // 2. Clone Style Details and maintain mapping of old to new IDs
    const styleDetails = await StyleDetail.find({ workOrder_Id: workOrderId });
    const styleDetailMap = new Map(); // oldId -> newId
    if (styleDetails.length > 0) {
      const styleDetailPromises = styleDetails.map(async styleDetail => {
        const newStyleDetail = new StyleDetail({
          ...styleDetail.toObject(),
          _id: undefined,
          workOrder_Id: clonedWorkOrder._id
        });
        const savedStyleDetail = await newStyleDetail.save();
        styleDetailMap.set(styleDetail._id.toString(), savedStyleDetail._id);
        return savedStyleDetail;
      });
      await Promise.all(styleDetailPromises);
    }

    // 3. Clone Wash Details and maintain mapping of old to new IDs
    const washDetails = await WashDetail.find({ workOrder_Id: workOrderId });
    const washDetailMap = new Map(); // oldId -> newId
    if (washDetails.length > 0) {
      const washDetailPromises = washDetails.map(async washDetail => {
        const newWashDetail = new WashDetail({
          ...washDetail.toObject(),
          _id: undefined,
          workOrder_Id: clonedWorkOrder._id
        });
        const savedWashDetail = await newWashDetail.save();
        washDetailMap.set(washDetail._id.toString(), savedWashDetail._id);
        return savedWashDetail;
      });
      await Promise.all(washDetailPromises);
    }

    // 4. Clone Sample Requests
    const sampleRequests = await SampleRequest.find({ workOrder_Id: workOrderId });
    if (sampleRequests.length > 0) {
      const sampleRequestPromises = sampleRequests.map(sampleRequest => {
        const newSampleRequest = new SampleRequest({
          ...sampleRequest.toObject(),
          _id: undefined,
          workOrder_Id: clonedWorkOrder._id
        });
        return newSampleRequest.save();
      });
      await Promise.all(sampleRequestPromises);
    }

    // 5. Clone Item Details with status handling
    const itemDetails = await ItemDetail.find({ workOrder_Id: workOrderId });
    if (itemDetails.length > 0) {
      const itemDetailPromises = itemDetails.map(itemDetail => {
        // Create a clean object without the status field
        const itemData = itemDetail.toObject();
        
        // Remove status field to avoid validation errors
        delete itemData.status;

        const newItemDetail = new ItemDetail({
          ...itemData,
          _id: undefined,
          workOrder_Id: clonedWorkOrder._id
        });
        return newItemDetail.save();
      });
      await Promise.all(itemDetailPromises);
    }

    // 6. Clone New Details (must be done after style and wash details)
    const newDetails = await NewDetail.find({ workOrder_Id: workOrderId });
    if (newDetails.length > 0) {
      const newDetailPromises = newDetails.map(newDetail => {
        // Map the old style_detail_id or wash_detail_id to the new ones
        const newStyleDetailId = newDetail.style_detail_id 
          ? styleDetailMap.get(newDetail.style_detail_id.toString()) 
          : undefined;
        
        const newWashDetailId = newDetail.wash_detail_id 
          ? washDetailMap.get(newDetail.wash_detail_id.toString()) 
          : undefined;

        return new NewDetail({
          ...newDetail.toObject(),
          _id: undefined,
          workOrder_Id: clonedWorkOrder._id,
          style_detail_id: newStyleDetailId,
          wash_detail_id: newWashDetailId
        }).save();
      });
      await Promise.all(newDetailPromises);
    }

    // 7. Clone Sample Graded Specs and their POMs using your exact controller logic
    const sampleGradedSpecsList = await SampleGradedSpecs.find({
      workOrder_Id: workOrderId
    });

    if (sampleGradedSpecsList.length > 0) {
      for (const originalSpec of sampleGradedSpecsList) {
        // Create new SampleGradedSpecs
        const newSpec = new SampleGradedSpecs({
          ...originalSpec.toObject(),
          _id: undefined,
          workOrder_Id: clonedWorkOrder._id,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        const savedSpec = await newSpec.save();

        // Get all POMs for the original spec using your GET controller logic
        const originalPoms = await CopiedSpecTemPoms.find({
          sampleGradedSpecsId: originalSpec._id
        }).populate("specTemplateId");

        // Clone each POM using your POST controller logic
        for (const originalPom of originalPoms) {
          const { specTemplateId } = originalPom;
          
          // Create the POM data structure exactly as in your POST controller
          const newPomData = {
            sampleGradedSpecsId: savedSpec._id,
            specTemplateId,
            code: originalPom.code,
            description: originalPom.description,
            tolerance: originalPom.tolerance,
            design: originalPom.design || null,
            Initial: originalPom.Initial || null,
            FirstPP: originalPom.FirstPP || null,
            Rev1: originalPom.Rev1 || null,
            SecondPP: originalPom.SecondPP || null,
            Rev2: originalPom.Rev2 || null,
            ThirdPP: originalPom.ThirdPP || null,
            Final: originalPom.Final || null,
            Ship: originalPom.Ship || null,
            workOrder_Id: clonedWorkOrder._id
          };

          // Add size fields based on the spec template's Size_Range
          if (originalPom.specTemplateId && originalPom.specTemplateId.Size_Range) {
            const sizeRange = originalPom.specTemplateId.Size_Range;
            
            // Include all possible size fields
            const sizeFields = {
              0: originalPom[0] || null,
              1: originalPom[1] || null,
              2: originalPom[2] || null,
              3: originalPom[3] || null,
              4: originalPom[4] || null,
              5: originalPom[5] || null,
              6: originalPom[6] || null,
              7: originalPom[7] || null,
              8: originalPom[8] || null,
              9: originalPom[9] || null,
              10: originalPom[10] || null,
              11: originalPom[11] || null,
              12: originalPom[12] || null,
              13: originalPom[13] || null,
              14: originalPom[14] || null,
              15: originalPom[15] || null,
              16: originalPom[16] || null,
              17: originalPom[17] || null,
              18: originalPom[18] || null,
              19: originalPom[19] || null,
              20: originalPom[20] || null,
              22: originalPom[22] || null,
              24: originalPom[24] || null,
              25: originalPom[25] || null,
              26: originalPom[26] || null,
              28: originalPom[28] || null,
              XS: originalPom.XS || null,
              S: originalPom.S || null,
              M: originalPom.M || null,
              L: originalPom.L || null,
              XL: originalPom.XL || null,
              XXL: originalPom.XXL || null,
              X: originalPom.X || null,
              XX: originalPom.XX || null,
              XXX: originalPom.XXX || null,
              XXXX: originalPom.XXXX || null
            };

            // Only include relevant sizes based on Size_Range
            switch (sizeRange) {
              case "1-19":
                Object.assign(newPomData, {
                  0: sizeFields[0], 1: sizeFields[1], 3: sizeFields[3],
                  5: sizeFields[5], 7: sizeFields[7], 9: sizeFields[9],
                  11: sizeFields[11], 13: sizeFields[13], 15: sizeFields[15],
                  17: sizeFields[17], 19: sizeFields[19]
                });
                break;
              case "7-16":
                Object.assign(newPomData, {
                  7: sizeFields[7], 8: sizeFields[8], 10: sizeFields[10],
                  12: sizeFields[12], 14: sizeFields[14], 16: sizeFields[16]
                });
                break;
              case "0-16":
                Object.assign(newPomData, {
                  0: sizeFields[0], 2: sizeFields[2], 4: sizeFields[4],
                  6: sizeFields[6], 8: sizeFields[8], 10: sizeFields[10],
                  12: sizeFields[12], 14: sizeFields[14], 16: sizeFields[16]
                });
                break;
              case "14-28":
                Object.assign(newPomData, {
                  14: sizeFields[14], 16: sizeFields[16], 18: sizeFields[18],
                  20: sizeFields[20], 22: sizeFields[22], 24: sizeFields[24],
                  26: sizeFields[26], 28: sizeFields[28]
                });
                break;
              case "1X-4X":
                Object.assign(newPomData, {
                  X: sizeFields.X, XX: sizeFields.XX, 
                  XXX: sizeFields.XXX, XXXX: sizeFields.XXXX
                });
                break;
              case "XS-XXL":
                Object.assign(newPomData, {
                  XS: sizeFields.XS, S: sizeFields.S, M: sizeFields.M,
                  L: sizeFields.L, XL: sizeFields.XL, XXL: sizeFields.XXL
                });
                break;
              default:
                Object.assign(newPomData, sizeFields);
            }
          }

          // Create and save the new POM
          const newPom = new CopiedSpecTemPoms(newPomData);
          await newPom.save();
        }
      }
    }

    // 8. Clone standalone POMs (not tied to any SampleGradedSpecs)
    const standalonePoms = await CopiedSpecTemPoms.find({
      workOrder_Id: workOrderId,
      sampleGradedSpecsId: { $exists: false }
    });

    // 9. Clone Digital Patterns
    const digitalPatterns = await DigitalPatternModel.find({ workOrder_Id: workOrderId });
    if (digitalPatterns.length > 0) {
      const patternPromises = digitalPatterns.map(pattern => {
        return new DigitalPatternModel({
          ...pattern.toObject(),
          _id: undefined,
          workOrder_Id: clonedWorkOrder._id,
          uploadDate: Date.now() // Update the upload date to now
        }).save();
      });
      await Promise.all(patternPromises);
    }
    
    if (standalonePoms.length > 0) {
      for (const pom of standalonePoms) {
        const newPomData = {
          ...pom.toObject(),
          _id: undefined,
          workOrder_Id: clonedWorkOrder._id,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await new CopiedSpecTemPoms(newPomData).save();
      }
    }

    // 10. Clone Design Comments
    const designComment = await DesignComments.findOne({ workOrder_Id: workOrderId })
      .populate("sampleStatus_id sampleRequestingStatus_id");
    
    if (designComment) {
      const newDesignComment = new DesignComments({
        ...designComment.toObject(),
        _id: undefined,
        workOrder_Id: clonedWorkOrder._id,
        // Reset all comment fields to null while keeping the status references
        PP1: null,
        PP2: null,
        PP3: null,
        Shipping: null,
        Other: null,
        // Keep the populated references if they exist
        sampleStatus_id: designComment.sampleStatus_id,
        sampleRequestingStatus_id: designComment.sampleRequestingStatus_id
      });
      await newDesignComment.save();
    }

    // 11. Clone Fit Comments
    const fitComment = await FitComments.findOne({ workOrder_Id: workOrderId })
      .populate("sampleStatus_id sampleRequestingStatus_id");
    
    if (fitComment) {
      const newFitComment = new FitComments({
        ...fitComment.toObject(),
        _id: undefined,
        workOrder_Id: clonedWorkOrder._id,
        // Reset all comment fields to null while keeping the status references
        PP1: null,
        PP2: null,
        PP3: null,
        Shipping: null,
        Other: null,
        // Keep the populated references if they exist
        sampleStatus_id: fitComment.sampleStatus_id?._id || fitComment.sampleStatus_id,
        sampleRequestingStatus_id: fitComment.sampleRequestingStatus_id?._id || fitComment.sampleRequestingStatus_id
      });
      await newFitComment.save();
    }

    res.status(201).json({
      message: "WorkOrder and all related data cloned successfully",
      data: {
        workOrder: clonedWorkOrder,
        styleDetails: styleDetails.length,
        washDetails: washDetails.length,
        sampleRequests: sampleRequests.length,
        itemDetails: itemDetails.length,
        newDetails: newDetails.length,
        sampleGradedSpecs: sampleGradedSpecsList.length,
        standalonePoms: standalonePoms.length
      },
    });
  } catch (error) {
    console.error("Error cloning WorkOrder:", error);
    res.status(500).json({
      message: "Error cloning WorkOrder and related data",
      error: error.message,
      stack: error.stack
    });
  }
};






// Helper function to generate the next work order ID
const generateWorkOrderId = async () => {
  try {
    // Find the latest work order
    const latestWorkOrder = await WorkOrder.findOne()
      .sort({ createdAt: -1 })
      .limit(1);

    if (!latestWorkOrder || !latestWorkOrder.workOrderId) {
      return "WO-1"; // First work order
    }

    // Extract the number part and increment
    const lastNumber = parseInt(latestWorkOrder.workOrderId.split('-')[1]);
    return `WO-${lastNumber + 1}`;
  } catch (error) {
    console.error("Error generating work order ID:", error);
    throw error;
  }
};

exports.createWorkOrder = async (req, res) => {
  try {
    // Generate the work order ID first
    const workOrderId = await generateUniqueWorkOrderId();

    // Validate required fields
    const { etd, itemType, vendor, categories, subCategory } = req.body;
    
    if (!etd || !itemType || !vendor || !categories || !subCategory) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate ObjectId formats
    const validateObjectId = (id) => {
      try {
        return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
      } catch (error) {
        return null;
      }
    };

    // Validate vendor and subCategory as ObjectIds
    const validatedVendor = validateObjectId(vendor);
    const validatedSubCategory = validateObjectId(subCategory);

    // Validate categories array
    let validatedCategories = [];
    if (Array.isArray(categories)) {
      validatedCategories = categories.map(cat => validateObjectId(cat)).filter(Boolean);
    }

    if (!validatedVendor || !validatedSubCategory || validatedCategories.length === 0) {
      return res.status(400).json({ 
        message: 'Invalid ID format',
        details: {
          vendor: !validatedVendor,
          categories: validatedCategories.length === 0,
          subCategory: !validatedSubCategory
        }
      });
    }

    // Create new work order with generated ID
    const newWorkOrder = new WorkOrder({
      workOrderId, // Add the generated ID here
      etd: new Date(etd),
      itemType: itemType,
      vendor: validatedVendor,
      categories: validatedCategories,
      subCategories: [validatedSubCategory],
      ...req.body
    });

    // Save to database
    const savedWorkOrder = await newWorkOrder.save();

    // Populate references
    const populatedWorkOrder = await WorkOrder.findById(savedWorkOrder._id)
      .populate('itemType')
      .populate('vendor')
      .populate('categories')
      .populate('subCategories');

    res.status(201).json({
      success: true,
      data: populatedWorkOrder
    });

  } catch (error) {
    console.error('Error creating WorkOrder:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation Error',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating WorkOrder',
      error: error.message 
    });
  }
};











exports.deleteWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const workOrderToDelete = await WorkOrder.findById(id);

    if (!workOrderToDelete) {
      return res.status(404).json({ message: "WorkOrder not found" });
    }

    await workOrderToDelete.deleteOne();

    res.status(200).json({ message: "WorkOrder deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting WorkOrder",
      error: error.message,
    });
  }
};

// exports.getAllWorkOrder = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1; // Default to 1 if no page is provided
//     const limit = 50; // Number of records per page
//     const skip = (page - 1) * limit; // Calculate the skip value

//     console.log("Page:", page, "Skip:", skip); // Debugging line to check if pagination is working

//     // Get the total number of records
//     const totalRecords = await workOrder.countDocuments();

//     // Fetch the work orders for the current page, sort, and apply pagination
//     const workOrders = await workOrder
//       .find() // Add search filters here if needed
//       .sort({ _id: -1 }) // You may consider sorting by a field like createdAt instead
//       .skip(skip)
//       .limit(limit)
//       .populate("vendor category itemType subCategory trim_id pictures");

//     // Calculate the total number of pages
//     const totalPages = Math.ceil(totalRecords / limit);

//     res.status(200).json({
//       message: "WorkOrders fetched successfully",
//       data: workOrders,
//       pagination: {
//         currentPage: page,
//         totalPages,
//         totalRecords,
//         hasNextPage: page < totalPages,
//         hasPrevPage: page > 1,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching WorkOrders",
//       error: error.message,
//     });
//   }
// };
exports.getAllWorkOrder = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const query = {};

    // ✅ Apply vendor filtering only if user is vendor
    if (
      req.user &&
      req.user.roles &&
      Array.isArray(req.user.roles) &&
      req.user.roles.includes("vendor") &&
      req.user.vendor &&
      req.user.vendor.length > 0
    ) {
      query.vendor = { $in: req.user.vendor }; // Match any vendor ID in the array
    }

    const totalRecords = await WorkOrder.countDocuments(query);

    const workOrders = await WorkOrder
      .find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("vendor categories itemType subCategories trim_id pictures") // Updated population paths
      .lean(); // Added lean() for better performance

    // Format the response to maintain backward compatibility if needed
    const formattedWorkOrders = workOrders.map(order => ({
      ...order,
      // For backward compatibility, include single category/subCategory fields
      category: order.categories?.[0], // First category
      subCategory: order.subCategories?.[0] // First subCategory
    }));

    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      message: "WorkOrders fetched successfully",
      data: formattedWorkOrders, // Using formatted data
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching WorkOrders",
      error: error.message,
    });
  }
};

// exports.getUnexportedWorkOrders = async (req, res) => {
//   try {
//     const workOrders = await workOrder.find({ purchaseOrder_Status: "UnExported" })
//       .populate("vendor")
//       .populate("categories")
//       .populate("itemType")
//       .populate("subCategory");

//     res.status(200).json({
//       message: "Unexported WorkOrders retrieved successfully",
//       data: workOrders,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error retrieving WorkOrders",
//       error: error.message
//     });
//   }
// };

// exports.getAllWorkOrder = async (req, res) => {
//   try {
//     // Extract page number from query parameters, default to 1
//     const page = parseInt(req.query.page) || 1;
//     const limit = 50; // Records per page

//     // Calculate the starting index for the query
//     const skip = (page - 1) * limit;

//     // Get the total count of documents
//     const totalRecords = await workOrder.countDocuments();

//     // Fetch the work orders with pagination and populate
//     const workOrders = await workOrder
//       .find()
//       .sort({ _id: -1 })
//       .populate("vendor category itemType subCategory trim_id pictures")
//       .skip(skip)
//       .limit(limit);

//     // Calculate total pages
//     const totalPages = Math.ceil(totalRecords / limit);

//     // Send the paginated response
//     res.status(200).json({
//       message: "WorkOrders fetched successfully",
//       data: workOrders,
//       pagination: {
//         currentPage: page,
//         totalPages,
//         totalRecords,

//       },
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching WorkOrders", error: error.message });
//   }
// };

exports.getFilteredWorkOrders = async (req, res) => {
  try {
    // Extract query parameters for filtering and pagination
    const {
      vendor,
      category,
      itemType,
      subCategory,
      trim_id,
      etdFrom,
      etdTo,
      page = 1,
      limit = 50
    } = req.query;

    // Build the filter object based on provided query parameters
    const filter = {};

    if (vendor) filter.vendor = vendor;
    if (category) filter.category = category;
    if (itemType) filter.itemType = itemType;
    if (subCategory) filter.subCategory = subCategory;
    if (trim_id) filter.trim_id = trim_id;

    // Add date range filtering for `etd` (Estimated Time of Delivery)
    if (etdFrom || etdTo) {
      filter.etd = {};
      if (etdFrom) filter.etd.$gte = new Date(etdFrom);
      if (etdTo) filter.etd.$lte = new Date(etdTo);
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch filtered work orders with pagination
    const [workOrders, totalRecords] = await Promise.all([
      WorkOrder
        .find(filter)
        .populate("vendor category itemType subCategory trim_id pictures")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }), // Sort by creation date
      WorkOrder.countDocuments(filter),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / limit);

    // Response with data and pagination metadata
    res.status(200).json({
      message: "Filtered WorkOrders fetched successfully",
      data: workOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching WorkOrders",
      error: error.message,
    });
  }
};

exports.getSearchWorkOrder = async (req, res) => {
  try {
    const {
      workOrderId,
      vendor,
      category,
      itemType,
      subCategory,
      styleId,
      lastUpdatedFrom,
      lastUpdatedTo,
      createdFrom,
      createdTo,
      search,
      trim_id,
      etdFrom,
      etdTo,
      page = 1,
      limit = 50,
      design_status,
      fit_status,
      shippping_status,
      customer_po_number,
    } = req.query;

    // Function to convert date from DD-MM-YYYY to YYYY-MM-DD
    const convertSearchDate = (dateString) => {
      if (!dateString) return null;
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('-');
        return `${year}-${month}-${day}`;
      }
      return dateString;
    };

    const filter = {};

    if (customer_po_number) {
      filter.customer_po_number = {
        $elemMatch: { $regex: new RegExp(customer_po_number, "i") },
      };
    }

    if (vendor && mongoose.Types.ObjectId.isValid(vendor)) {
      filter.vendor = vendor;
    }
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.categories = category;
    }
    if (itemType && mongoose.Types.ObjectId.isValid(itemType)) {
      filter.itemType = itemType;
    }
    if (subCategory && mongoose.Types.ObjectId.isValid(subCategory)) {
      filter.subCategories = subCategory;
    }

    if (workOrderId) {
      filter.workOrderId = { $regex: workOrderId, $options: "i" };
    }
    if (styleId) {
      filter.styleId = { $regex: styleId, $options: "i" };
    }
    if (trim_id) {
      filter.trim_id = trim_id;
    }

    if (design_status) {
      filter.design_status = { $regex: design_status, $options: "i" };
    }
    if (fit_status) {
      filter.fit_status = { $regex: fit_status, $options: "i" };
    }
    if (shippping_status) {
      filter.shippping_status = {
        $regex: shippping_status,
        $options: "i",
      };
    }

    // Date range filters - convert dates if needed
    if (lastUpdatedFrom || lastUpdatedTo) {
      filter.lastUpdated = {};
      if (lastUpdatedFrom) {
        const convertedDate = convertSearchDate(lastUpdatedFrom);
        filter.lastUpdated.$gte = new Date(convertedDate || lastUpdatedFrom);
      }
      if (lastUpdatedTo) {
        const convertedDate = convertSearchDate(lastUpdatedTo);
        filter.lastUpdated.$lte = new Date(convertedDate || lastUpdatedTo);
      }
    }

    if (etdFrom || etdTo) {
      filter.etd = {};
      if (etdFrom) {
        const convertedDate = convertSearchDate(etdFrom);
        filter.etd.$gte = new Date(convertedDate || etdFrom);
      }
      if (etdTo) {
        const convertedDate = convertSearchDate(etdTo);
        filter.etd.$lte = new Date(convertedDate || etdTo);
      }
    }

    if (createdFrom || createdTo) {
      filter.createdAt = {};
      if (createdFrom) {
        const convertedDate = convertSearchDate(createdFrom);
        filter.createdAt.$gte = new Date(convertedDate || createdFrom);
      }
      if (createdTo) {
        const convertedDate = convertSearchDate(createdTo);
        filter.createdAt.$lte = new Date(convertedDate || createdTo);
      }
    }

    // Fuzzy Search - handle date format conversion in search term
    if (search) {
      // First try to convert any date in the search term
      let processedSearch = search;
      if (search.includes('-')) {
        processedSearch = search.split(' ').map(term => {
          if (/^\d{2}-\d{2}-\d{4}$/.test(term)) {
            return convertSearchDate(term);
          }
          return term;
        }).join(' ');
      }

      const fuzzyRegex = new RegExp(processedSearch, "i");

      const [
        matchingCategories,
        matchingVendors,
        matchingItemTypes,
        matchingSubCategories,
      ] = await Promise.all([
        Category.find({ name: fuzzyRegex }).select("_id"),
        Vendor.find({ name: fuzzyRegex }).select("_id"),
        ItemType.find({ name: fuzzyRegex }).select("_id"),
        SubCategory.find({ name: fuzzyRegex }).select("_id"),
      ]);

      const categoryIds = matchingCategories.map((cat) => cat._id);
      const vendorIds = matchingVendors.map((vendor) => vendor._id);
      const itemTypeIds = matchingItemTypes.map((type) => type._id);
      const subCategoryIds = matchingSubCategories.map((sub) => sub._id);

      filter.$or = [
        { workOrderId: { $regex: fuzzyRegex } },
        { styleId: { $regex: fuzzyRegex } },
        { categories: { $in: categoryIds } },
        { vendor: { $in: vendorIds } },
        { customer_po_number: { $elemMatch: { $regex: fuzzyRegex } } },
        { itemType: { $in: itemTypeIds } },
        { subCategories: { $in: subCategoryIds } },
        { design_status: { $regex: fuzzyRegex } },
        { fit_status: { $regex: fuzzyRegex } },
        { shippping_status: { $regex: fuzzyRegex } },
        { shippingStatus: { $elemMatch: { $regex: fuzzyRegex } } },
        {
          $expr: {
            $regexMatch: {
              input: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                },
              },
              regex: fuzzyRegex,
            },
          },
        },
        {
          $expr: {
            $regexMatch: {
              input: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$etd",
                },
              },
              regex: fuzzyRegex,
            },
          },
        },
      ].filter((condition) => condition !== undefined);
    }

    const skip = (page - 1) * limit;

    const [workOrders, totalRecords] = await Promise.all([
      WorkOrder
        .find(filter)
        .populate("vendor categories itemType subCategories trim_id pictures")
        .populate({
          path: "itemType",
          select: "name customer_po_number",
        })
        .populate({ path: "rivetImages.image", model: "Picture" })
        .populate({ path: "buttonImages.image", model: "Picture" })
        .populate({ path: "trimImages.image", model: "Picture" })
        .skip(skip)
        .limit(parseInt(limit)),
      WorkOrder.countDocuments(filter),
    ]);

    // Get all style numbers and shipping statuses for the work orders from ItemDetail
    const workOrderIds = workOrders.map(wo => wo._id);
    const itemDetailsByWorkOrder = await ItemDetail.aggregate([
  {
    $match: {
      workOrder_Id: { $in: workOrderIds }
    }
  },
  {
    $group: {
      _id: "$workOrder_Id",
      styleNumbers: {
        $addToSet: "$stylenumber"  // Keep this as $addToSet for style numbers
      },
      shippingStatuses: {
        $push: "$status"  // Changed to $push to include all statuses (including duplicates)
      }
    }
  }
]);

    // Create maps of workOrderId to styleNumbers and shippingStatuses
    const styleNumbersMap = {};
    const shippingStatusesMap = {};
    
    itemDetailsByWorkOrder.forEach(item => {
      styleNumbersMap[item._id.toString()] = item.styleNumbers;
      shippingStatusesMap[item._id.toString()] = item.shippingStatuses;
    });

    // Get design and fit status information for each work order
    const workOrdersWithStatus = await Promise.all(
      workOrders.map(async (workOrder) => {
        const workOrderObj = workOrder.toObject();
        
        // Add style numbers and shipping statuses from the maps
        workOrderObj.styleNumbers = styleNumbersMap[workOrder._id.toString()] || [];
        workOrderObj.shippingStatus = shippingStatusesMap[workOrder._id.toString()] || [];
        
        // Get design comment info
        const designComments = await DesignComments.find({
          workOrder_Id: workOrder._id
        }).sort({ updatedAt: -1 });
        
        if (designComments.length > 0) {
          // Get the latest design approval status from any stage across all style numbers
          const designStages = ['PP1', 'PP2', 'PP3', 'Shipping', 'Other'];
          let latestDesignApprovalStatus = null;
          let latestDesignApprovalDate = null;
          
          designComments.forEach(designComment => {
            designStages.forEach(stage => {
              if (designComment[stage]?.approval_status && 
                  (!latestDesignApprovalDate || designComment[stage].date > latestDesignApprovalDate)) {
                latestDesignApprovalStatus = designComment[stage].approval_status;
                latestDesignApprovalDate = designComment[stage].date;
              }
            });
          });
          
          workOrderObj.designStatusDate = designComments[0].updatedAt;
          workOrderObj.latestDesignApprovalStatus = latestDesignApprovalStatus;
          workOrderObj.latestDesignApprovalDate = latestDesignApprovalDate;
        } else {
          workOrderObj.designStatusDate = null;
          workOrderObj.latestDesignApprovalStatus = null;
          workOrderObj.latestDesignApprovalDate = null;
        }
        
        // Get fit comment info - now checking all style numbers
        const fitComments = await FitComments.find({
          workOrder_Id: workOrder._id
        }).sort({ updatedAt: -1 });
        
        if (fitComments.length > 0) {
          // Get the latest fit approval status from any stage across all style numbers
          const fitStages = ['PP1', 'PP2', 'PP3', 'Shipping', 'Other'];
          let latestFitApprovalStatus = null;
          let latestFitApprovalDate = null;
          
          fitComments.forEach(fitComment => {
            // Check stages first
            fitStages.forEach(stage => {
              if (fitComment[stage]?.approval_status && 
                  (!latestFitApprovalDate || fitComment[stage].date > latestFitApprovalDate)) {
                latestFitApprovalStatus = fitComment[stage].approval_status;
                latestFitApprovalDate = fitComment[stage].date;
              }
            });
            
            // Then check root level approval_status if it exists
            if (fitComment.approval_status && 
                (!latestFitApprovalDate || fitComment.updatedAt > latestFitApprovalDate)) {
              latestFitApprovalStatus = fitComment.approval_status;
              latestFitApprovalDate = fitComment.updatedAt;
            }
          });
          
          workOrderObj.fitStatusDate = fitComments[0].updatedAt;
          workOrderObj.latestFitApprovalStatus = latestFitApprovalStatus;
          workOrderObj.latestFitApprovalDate = latestFitApprovalDate;
        } else {
          workOrderObj.fitStatusDate = null;
          workOrderObj.latestFitApprovalStatus = null;
          workOrderObj.latestFitApprovalDate = null;
        }
        
        return workOrderObj;
      })
    );

    const totalPages = Math.ceil(totalRecords / limit);

    if (workOrdersWithStatus.length === 0) {
      return res.status(200).json({
        message: "No WorkOrders found matching the criteria",
        data: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords,
        },
      });
    }

    res.status(200).json({
      message: "Filtered WorkOrders fetched successfully",
      data: workOrdersWithStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching WorkOrders",
      error: error.message,
    });
  }
};

exports.getWorkOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const workOrderDetail = await WorkOrder
      .findById(id)
      .populate("vendor")
      .populate("categories") // Changed from "category" to "categories"
      .populate("itemType")
      .populate("subCategories") // Changed from "subCategory" to "subCategories"
      .populate("pictures")
      .populate("trim_id")
      .populate({
        path: "rivetImages.image",
        model: "Picture",
      })
      .populate({
        path: "buttonImages.image",
        model: "Picture",
      })
      .populate({
        path: "trimImages.image",
        model: "Picture",
      })
      .lean(); // Added lean() for better performance

    if (!workOrderDetail) {
      return res.status(404).json({ message: "WorkOrder not found!" });
    }

    // For backward compatibility, add single category/subCategory fields
    const responseData = {
      ...workOrderDetail,
      category: workOrderDetail.categories?.[0], // First category
      subCategory: workOrderDetail.subCategories?.[0] // First subCategory
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching WorkOrder",
      error: error.message,
    });
  }
};

exports.editWorkOrder = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      vendor,
      category,
      itemType,
      subCategory,
      trim_id,
      etd,
      pictures,
      buttonImages,
      rivetImages,
      trimImages,
    } = req.body;

    // // Ensure required fields are present
    // if (!vendor || !category || !itemType || !subCategory || !trim_id) {
    //     return res.status(400).json({ message: 'All required fields must be provided' });
    // }

    // Prepare the update payload
    const updateData = {
      vendor,
      category,
      itemType,
      subCategory,
      trim_id,
      etd,
    };

    // Conditionally update pictures
    if (pictures) {
      updateData.pictures = pictures; // This should be an array of picture IDs
    }

    // Conditionally update buttonImages
    if (buttonImages) {
      updateData.buttonImages = buttonImages.map((button) => ({
        image: button.image, // Picture ID
        color: button.color,
        size: button.size,
        quantity: button.quantity,
        comment: button.comment,
      }));
    }

    // Conditionally update rivetImages
    if (rivetImages) {
      updateData.rivetImages = rivetImages.map((rivet) => ({
        image: rivet.image, // Picture ID
        color: rivet.color,
        size: rivet.size,
        quantity: rivet.quantity,
        comment: rivet.comment,
      }));
    }

    // Conditionally update trimImages
    if (trimImages) {
      updateData.trimImages = trimImages.map((trimImage) => ({
        image: trimImage.image, // Picture ID
        color: trimImage.color,
        size: trimImage.size,
        quantity: trimImage.quantity,
        comment: trimImage.comment,
      }));
    }

    // Find and update the WorkOrder
    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    // If no workOrder found
    if (!updatedWorkOrder) {
      return res.status(404).json({ message: "WorkOrder not found!" });
    }

    res.status(200).json({
      message: "WorkOrder updated successfully",
      data: updatedWorkOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating WorkOrder",
      error: error.message,
    });
  }
};

exports.createSampleRequest = async (req, res) => {
  try {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      workOrder_Id,
      techpack_Id,
      styleId, 
      styleNumber,
      size,
      quantity,
      sampleType,
      dueDate,
      comments,
    } = req.body;

    // Ensure all required fields are provided

    // Create a new SampleRequest
    const newSampleRequest = new SampleRequest({
      workOrder_Id,
      techpack_Id,
      styleId,
      styleNumber,
      size,
      quantity,
      sampleType,
      dueDate,
      comments,
    });

    await newSampleRequest.save();

    res.status(201).json({
      message: "Sample Request created successfully",
      data: newSampleRequest,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating Sample Request",
      error: error.message,
    });
  }
};

// Get all SampleRequests
exports.getAllSampleRequests = async (_req, res) => {
  try {
    const sampleRequests = await SampleRequest.find()
      .populate("workOrder")
      .exec();

    res.status(200).json({
      message: "Sample Requests fetched successfully",
      data: sampleRequests,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Sample Requests",
      error: error.message,
    });
  }
};
// Get all SampleRequests against workorder
exports.getAllSampleRequestsByWorkOrderID = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "ID is required." });
    }

    // Query to find records where `id` matches either `techpack_Id` or `workOrder_Id`
    const sampleRequests = await SampleRequest.find({
      $or: [{ techpack_Id: id }, { workOrder_Id: id }],
    });

    console.log(`Found ${sampleRequests.length} sample requests for ID: ${id}`);

    if (sampleRequests.length === 0) {
      return res.status(404).json({
        message: "No Sample Requests found for the provided ID.",
      });
    }

    res.status(200).json({
      message: "Sample Requests fetched successfully",
      count: sampleRequests.length,
      data: sampleRequests,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Sample Requests",
      error: error.message,
    });
  }
};

// Get SampleRequest by ID
exports.getSampleRequestById = async (req, res) => {
  const { id } = req.params;

  try {
    const sampleRequest = await SampleRequest.findById(id)
      .populate("techpackId workOrder_Id")
      .exec();

    if (!sampleRequest) {
      return res.status(404).json({ message: "Sample Request not found!" });
    }

    res.status(200).json({
      message: "Sample Request fetched successfully",
      data: sampleRequest,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Sample Request",
      error: error.message,
    });
  }
};

exports.editSampleRequest = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      styleNumber,
      size,
      quantity,
      sampleType,
      dueDate,
      comments,
      status,
    } = req.body;

    // Find the existing Sample Request by ID
    const sampleRequest = await SampleRequest.findById(id);
    if (!sampleRequest) {
      return res.status(404).json({ message: "Sample Request not found!" });
    }

    // Update fields if provided
    if (styleNumber) sampleRequest.styleNumber = styleNumber;
    if (size) sampleRequest.size = size;
    if (quantity) sampleRequest.quantity = quantity;
    if (sampleType) sampleRequest.sampleType = sampleType;
    if (dueDate) sampleRequest.dueDate = dueDate;
    if (comments) sampleRequest.comments = comments;
    if (status) sampleRequest.status = status;

    await sampleRequest.save();

    res.status(200).json({
      message: "Sample Request updated successfully",
      data: sampleRequest,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating Sample Request",
      error: error.message,
    });
  }
};

exports.deleteSampleRequest = async (req, res) => {
  const { id } = req.params;

  try {
    // Find and delete the Sample Request
    const sampleRequest = await SampleRequest.findByIdAndDelete(id);

    if (!sampleRequest) {
      return res.status(404).json({ message: "Sample Request not found!" });
    }

    res.status(200).json({
      message: "Sample Request deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Sample Request",
      error: error.message,
    });
  }
};

exports.createStyleDetail = async (req, res) => {
  try {
    const {
      description,
      frontPocket,
      waistband,
      flyArea,
      stitchingThickness,
      inseam,
      zipper,
      fabric,
      backPocket,
      beltLoop,
      backYoke,
      sewingThreadColor,
      hem,
      summary,
      dynamicAttributes,
      techpack_Id,
      workOrder_Id,
      category_Id,
    } = req.body;

    // Validate that either techpack_Id or workOrder_Id is provided along with category_Id
    if (!category_Id || (!techpack_Id && !workOrder_Id)) {
      return res.status(400).json({
        message: "Either techpack_Id or workOrder_Id must be provided along with category_Id",
      });
    }

    let samplePictureUrl = null;

    // If an image is uploaded, upload it to S3
    if (req.file) {
      samplePictureUrl = await uploadToS3(req.file);
    }

    // ✅ Automatically parse `dynamicAttributes` only if it's a string
    let parsedDynamicAttributes = {};
    if (typeof dynamicAttributes === "string") {
      try {
        parsedDynamicAttributes = JSON.parse(dynamicAttributes);
      } catch (_error) {
        return res.status(400).json({
          message:
            "Invalid dynamicAttributes format. Please provide a valid JSON object.",
        });
      }
    } else if (
      typeof dynamicAttributes === "object" &&
      dynamicAttributes !== null
    ) {
      parsedDynamicAttributes = dynamicAttributes; // Already an object, use directly
    }

    // ✅ Create a new StyleDetail document
    const styleDetail = new StyleDetail({
      description,
      frontPocket,
      waistband,
      flyArea,
      stitchingThickness,
      inseam,
      zipper,
      samplePicture: samplePictureUrl,
      fabric,
      backPocket,
      beltLoop,
      backYoke,
      sewingThreadColor,
      hem,
      summary,
      dynamicAttributes: parsedDynamicAttributes,
      techpack_Id: techpack_Id || null,
      workOrder_Id: workOrder_Id || null,
      category_Id,
    });

    const savedStyleDetail = await styleDetail.save();
    res.status(201).json(savedStyleDetail);
  } catch (error) {
    res.status(500).json({
      message: "Error creating StyleDetail",
      error: error.message,
    });
  }
};

// Get All Style Details
exports.getAllStyleDetails = async (_req, res) => {
  try {
    const styleDetails = await StyleDetail.find()
      .populate("workOrder_Id")
      .populate("techpack_Id");
    res.status(200).json(styleDetails);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Style Details",
      error: error.message,
    });
  }
};

exports.getAllStyleDetailsByWorkOrderID = async (req, res) => {
  try {
    const { workOrder_Id, techpack_Id, category_Id } = req.body;

    // Validate required parameters
    if (!category_Id) {
      return res.status(400).json({
        message: "category_Id is required",
      });
    }

    // Check that either workOrder_Id or techpack_Id is provided (but not both)
    if (!workOrder_Id && !techpack_Id) {
      return res.status(400).json({
        message: "Either workOrder_Id or techpack_Id must be provided along with category_Id",
      });
    }

    // Build the filter object
    const filter = { category_Id };
    if (workOrder_Id) {
      filter.workOrder_Id = workOrder_Id;
    } else {
      filter.techpack_Id = techpack_Id;
    }

    // Fetch StyleDetails with the filter (without populate for now)
    const styleDetails = await StyleDetail.find(filter);

    if (styleDetails.length === 0) {
      return res.status(404).json({ 
        message: "No StyleDetails found for the provided criteria",
        criteria: filter
      });
    }

    res.status(200).json({
      message: "StyleDetails retrieved successfully",
      data: styleDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Style Details",
      error: error.message,
    });
  }
};
// Get Style Detail By ID
exports.getStyleDetailById = async (req, res) => {
  const { id } = req.params;
  try {
    const styleDetail = await StyleDetail.findById(id).populate("workOrder_Id");
    if (!styleDetail) {
      return res.status(404).json({ message: "Style Detail not found!" });
    }
    res.status(200).json(styleDetail);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Style Detail",
      error: error.message,
    });
  }
};

// Update Style Detail
exports.editStyleDetail = async (req, res) => {
  const { id } = req.params;
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      description,
      frontPocket,
      waistband,
      flyArea,
      stitchingThickness,
      inseam,
      zipper,
      samplePicture,
      fabric,
      backPocket,
      beltLoop,
      backYoke,
      sewingThreadColor,
      hem,
      summary,
      dynamicAttributes,
      category_Id, // Required field
      techpack_Id,
      workOrder_Id,
    } = req.body;

    // Validate that category_Id is provided
    if (!category_Id) {
      return res.status(400).json({ 
        message: "category_Id is required for updating Style Detail" 
      });
    }

    const updateData = {
      ...(description && { description }),
      ...(frontPocket && { frontPocket }),
      ...(waistband && { waistband }),
      ...(flyArea && { flyArea }),
      ...(stitchingThickness && { stitchingThickness }),
      ...(inseam && { inseam }),
      ...(zipper && { zipper }),
      ...(samplePicture && { samplePicture }),
      ...(fabric && { fabric }),
      ...(backPocket && { backPocket }),
      ...(beltLoop && { beltLoop }),
      ...(backYoke && { backYoke }),
      ...(sewingThreadColor && { sewingThreadColor }),
      ...(hem && { hem }),
      ...(summary && { summary }),
      ...(dynamicAttributes && { dynamicAttributes }),
      category_Id, // Always included (required)
      ...(techpack_Id && { techpack_Id }), // Optional
      ...(workOrder_Id && { workOrder_Id }), // Optional
    };

    const updatedStyleDetail = await StyleDetail.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedStyleDetail) {
      return res.status(404).json({ message: "Style Detail not found!" });
    }

    res.status(200).json({
      message: "Style Detail updated successfully",
      data: updatedStyleDetail,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating Style Detail",
      error: error.message,
    });
  }
};

// Delete Style Detail
exports.deleteStyleDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedStyleDetail = await StyleDetail.findByIdAndDelete(id);

    if (!deletedStyleDetail) {
      return res.status(404).json({ message: "Style Detail not found!" });
    }

    res.status(200).json({ message: "Style Detail deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Style Detail",
      error: error.message,
    });
  }
};

// exports.createWashDetail = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const {
//       wash,
//       dryProcess,
//       color,
//       comments,
//       washPicture,
//       dynamicAttributes,
//       techPackId,
//       workOrder_Id,
//     } = req.body;

//     // Ensure required fields are provided
//     if (!techPackId && !workOrder_Id) {
//       return res
//         .status(400)
//         .json({ message: "All required fields must be provided." });
//     }

//     // Create a new WashDetail
//     const newWashDetail = new WashDetail({
//       wash,
//       dryProcess,
//       color,
//       comments,
//       washPicture,
//       dynamicAttributes,
//       techPackId,
//       workOrder_Id,
//     });

//     await newWashDetail.save();

//     res.status(201).json({
//       message: "WashDetail created successfully.",
//       data: newWashDetail,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error creating WashDetail", error: error.message });
//   }
// };

// Get All WashDetails


exports.createWashDetail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      wash,
      dryProcess,
      color,
      comments,
      washPicture,
      dynamicAttributes,
      techpack_Id,
      workOrder_Id,
      category_Id,
    } = req.body;

    // Validate that either techpack_Id or workOrder_Id is provided along with category_Id
    if (!category_Id || (!techpack_Id && !workOrder_Id)) {
      return res.status(400).json({
        message: "Either techpack_Id or workOrder_Id must be provided along with category_Id",
      });
    }

    // Automatically parse `dynamicAttributes`
    let parsedDynamicAttributes = {};
    if (typeof dynamicAttributes === "string") {
      try {
        parsedDynamicAttributes = JSON.parse(dynamicAttributes);
      } catch (_error) {
        return res.status(400).json({
          message: "Invalid dynamicAttributes format. Please provide a valid JSON object.",
        });
      }
    } else if (typeof dynamicAttributes === "object" && dynamicAttributes !== null) {
      parsedDynamicAttributes = dynamicAttributes;
    }

    // Create new WashDetail
    const newWashDetail = new WashDetail({
      wash,
      dryProcess,
      color,
      comments,
      washPicture,
      dynamicAttributes: parsedDynamicAttributes,
      techpack_Id: techpack_Id || null,
      workOrder_Id: workOrder_Id || null,
      category_Id,
    });

    const savedWashDetail = await newWashDetail.save();
    
    res.status(201).json({
      message: "WashDetail created successfully",
      data: savedWashDetail
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating WashDetail",
      error: error.message,
    });
  }
};

exports.getAllWashDetails = async (_req, res) => {
  try {
    const washDetails = await WashDetail.find()
      .populate("techpack_Id")
      .populate("workOrder_Id");
    res.status(200).json(washDetails);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching WashDetails",
      error: error.message,
    });
  }
};

// Get WashDetail by ID
exports.getWashDetailById = async (req, res) => {
  const { id } = req.params;
  try {
    const washDetail = await WashDetail.findById(id)
      .populate("techpack_Id")
      .populate("workOrder_Id");
    if (!washDetail) {
      return res.status(404).json({ message: "WashDetail not found!" });
    }
    res.status(200).json(washDetail);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching WashDetail",
      error: error.message,
    });
  }
};

// Update WashDetail
exports.editWashDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      wash,
      dryProcess,
      color,
      comments,
      washPicture,
      dynamicAttributes,
      techpack_Id,
      workOrder_Id,
    } = req.body;

    // Find the WashDetail by ID
    const washDetail = await WashDetail.findById(id);
    if (!washDetail) {
      return res.status(404).json({ message: "WashDetail not found!" });
    }

    // Update fields if provided
    if (wash) washDetail.wash = wash;
    if (dryProcess) washDetail.dryProcess = dryProcess;
    if (color) washDetail.color = color;
    if (comments) washDetail.comments = comments;
    if (washPicture) washDetail.washPicture = washPicture;
    if (dynamicAttributes) washDetail.dynamicAttributes = dynamicAttributes;
    if (techpack_Id) washDetail.techpack = techpack_Id;
    if (workOrder_Id) washDetail.workOrder_Id = workOrder_Id;

    await washDetail.save();

    res.status(200).json({
      message: "WashDetail updated successfully.",
      data: washDetail,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating WashDetail",
      error: error.message,
    });
  }
};

// exports.editWashDetailbyDynamic = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { dynamicAttributes } = req.body;

//     // Validate ID
//     if (!id) {
//       return res.status(400).json({ message: "WashDetail ID is required." });
//     }

//     // Ensure `dynamicAttributes` is provided
//     if (!dynamicAttributes) {
//       return res.status(400).json({ message: "dynamicAttributes is required." });
//     }

//     // Parse `dynamicAttributes` if it's a string
//     let parsedDynamicAttributes = {};
//     if (typeof dynamicAttributes === "string") {
//       try {
//         parsedDynamicAttributes = JSON.parse(dynamicAttributes);
//       } catch (error) {
//         return res.status(400).json({
//           message: "Invalid dynamicAttributes format. Please provide a valid JSON object.",
//         });
//       }
//     } else if (typeof dynamicAttributes === "object" && dynamicAttributes !== null) {
//       parsedDynamicAttributes = dynamicAttributes;
//     }

//     // Update only `dynamicAttributes`
//     const updatedWashDetail = await WashDetail.findByIdAndUpdate(
//       id,
//       { $set: { dynamicAttributes: parsedDynamicAttributes } },
//       { new: true }
//     );

//     if (!updatedWashDetail) {
//       return res.status(404).json({ message: "WashDetail not found!" });
//     }

//     res.status(200).json({
//       message: "WashDetail updated successfully.",
//       data: updatedWashDetail,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error updating WashDetail",
//       error: error.message,
//     });
//   }
// };

// Delete WashDetail

exports.deleteWashDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const washDetail = await WashDetail.findByIdAndDelete(id);

    if (!washDetail) {
      return res.status(404).json({ message: "WashDetail not found!" });
    }

    res.status(200).json({ message: "WashDetail deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting WashDetail",
      error: error.message,
    });
  }
};

exports.getWashDetailWorkorderID = async (req, res) => {
  try {
    const { workOrder_Id, techpack_Id, category_Id } = req.body;

    // Validate required parameters
    if (!category_Id) {
      return res.status(400).json({
        message: "category_Id is required for all queries.",
      });
    }

    if (!workOrder_Id && !techpack_Id) {
      return res.status(400).json({
        message: "Either workOrder_Id or techpack_Id must be provided along with category_Id.",
      });
    }

    // Build query - must include category_Id and one of workOrder_Id or techpack_Id
    const query = { 
      category_Id,
      ...(workOrder_Id ? { workOrder_Id } : { techpack_Id })
    };

    const washDetails = await WashDetail.find(query)
      .populate({
        path: "workOrder_Id",
        model: "WorkOrder",
        select: "workOrderId vendor" // Only include necessary fields
      })
      .populate({
        path: "techpack_Id",
        model: "TechPack",
        select: "name styleNumber" // Only include necessary fields
      })
      .populate({
        path: "category_Id",
        model: "Category",
        select: "name" // Only include category name
      });

    if (!washDetails || washDetails.length === 0) {
      return res.status(404).json({
        message: "No wash details found for the specified criteria.",
      });
    }

    res.status(200).json({
      message: "Wash details retrieved successfully",
      data: washDetails,
    });
  } catch (error) {
    console.error("Error in getWashDetailWorkorderID:", error);
    res.status(500).json({
      message: "Error retrieving wash details",
      error: error.message,
    });
  }
};

// Create a NewDetail

// exports.createNewDetail = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const {
//       workOrder_Id,
//       techpack_Id,
//       wash_detail_id,
//       style_detail_id,
//       detail_category,
//       comment,
//       pic,
//       size,
//     } = req.body;

//     const newDetail = new NewDetail({
//       workOrder_Id,
//       techpack_Id,
//       wash_detail_id,
//       style_detail_id,
//       detail_category,
//       comment,
//       pic,
//       size,
//     });

//     await newDetail.save();

//     res.status(201).json({
//       message: "NewDetail created successfully",
//       data: newDetail,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error creating NewDetail", error: error.message });
//   }
// };

exports.createNewDetail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      workOrder_Id,
      techpack_Id,
      wash_detail_id,
      style_detail_id,
      detail_category,
      comment,
      pic,
      size,
    } = req.body;

    // Check for at least one of the required valid combinations
    const validCombinations = [
      workOrder_Id && style_detail_id,
      workOrder_Id && wash_detail_id,
      techpack_Id && wash_detail_id,
      techpack_Id && style_detail_id,
    ];

    const isValid = validCombinations.some(Boolean);

    if (!isValid) {
      return res.status(400).json({
        message: "Not created",
      });
    }

    const newDetail = new NewDetail({
      workOrder_Id,
      techpack_Id,
      wash_detail_id,
      style_detail_id,
      detail_category,
      comment,
      pic,
      size,
    });

    await newDetail.save();

    res.status(201).json({
      message: "NewDetail created successfully",
      data: newDetail,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating NewDetail",
      error: error.message,
    });
  }
};

// Get a single NewDetail by ID
exports.getNewDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const newDetail = await NewDetail.findById(id)
      .populate("workOrder_Id")
      .populate("pic")
      .populate("style_detail_id");

    if (!newDetail) {
      return res.status(404).json({ message: "NewDetail not found" });
    }

    res.status(200).json({
      message: "NewDetail retrieved successfully",
      data: newDetail,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving NewDetail",
      error: error.message,
    });
  }
};

// Update a NewDetail by ID
exports.updateNewDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const newDetail = await NewDetail.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("workOrder_Id")
      .populate("pic")
      .populate("wash_detail_id")
      .populate("style_detail_id");

    if (!newDetail) {
      return res.status(404).json({ message: "NewDetail not found" });
    }

    res.status(200).json({
      message: "NewDetail updated successfully",
      data: newDetail,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating NewDetail",
      error: error.message,
    });
  }
};

// Delete a NewDetail by ID
exports.deleteNewDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const newDetail = await NewDetail.findByIdAndDelete(id);

    if (!newDetail) {
      return res.status(404).json({ message: "NewDetail not found" });
    }

    res.status(200).json({
      message: "NewDetail deleted successfully",
      data: newDetail,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting NewDetail",
      error: error.message,
    });
  }
};

// Get all NewDetails
exports.getAllNewDetails = async (_req, res) => {
  try {
    const newDetails = await NewDetail.find()
      .populate("workOrder_Id")
      .populate("pic")
      .populate("wash_detail_id")
      .populate("style_detail_id");

    res.status(200).json({
      message: "NewDetails retrieved successfully",
      data: newDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving NewDetails",
      error: error.message,
    });
  }
};

// Get all NewDetails against workorder
// exports.getAllNewDetailsByWorkOrderID = async (req, res) => {
//   try {
//     const { workOrderId, styleDetailId, washDetailId } = req.body;

//     if (!workOrderId) {
//       return res.status(400).json({
//         message: "Invalid workOrderId provided",
//       });
//     }

//     // ✅ Create a filter object dynamically
//     let query = { workOrder_Id: workOrderId };

//     if (styleDetailId) query.style_detail_id = styleDetailId;
//     if (washDetailId) query.wash_detail_id = washDetailId;

//     // ✅ Fetch all matching records and populate the 'pic' field
//     const newDetails = await NewDetail.find(query).populate("pic");

//     if (!newDetails || newDetails.length === 0) {
//       return res.status(404).json({
//         message: "No records found for the provided criteria",
//       });
//     }

//     res.status(200).json({
//       message: "NewDetails retrieved successfully",
//       data: newDetails,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error retrieving NewDetails",
//       error: error.message,
//     });
//   }
// };

// exports.getAllNewDetailsByWorkOrderID = async (req, res) => {
//   try {
//     const { workOrderId, styleDetailId, washDetailId } = req.body;
//     if (!workOrderId) {
//       return res.status(400).json({
//         message: "Invalid workOrderId provided",
//       });
//     }
//     let newDetails;
//     if (styleDetailId) {
//       newDetails = await NewDetail.find({
//         workOrder_Id: workOrderId,
//         style_detail_id: styleDetailId,
//       }).populate("pic");
//     } else if (washDetailId) {
//       newDetails = await NewDetail.find({
//         workOrder_Id: workOrderId,
//         wash_detail_id: washDetailId,
//       }).populate("pic");
//     } else {
//       return res.status(400).json({
//         message: "Either styleDetailId or washDetailId must be provided",
//       });
//     }
//     res.status(200).json({
//       message: "NewDetails retrieved successfully",
//       data: newDetails,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error retrieving NewDetails", error: error.message });
//   }
// };

exports.getAllNewDetailsByWorkOrderID = async (req, res) => {
  try {
    const { workOrder_Id, techpack_Id, style_detail_id, wash_detail_id } =
      req.body;

    // Ensure that either workOrder_Id or techpack_Id is provided
    if (!workOrder_Id && !techpack_Id) {
      return res.status(400).json({
        message: "Provide either workOrder_Id or techpack_Id",
      });
    }

    // Ensure that either style_detail_id or wash_detail_id is provided, not both
    if (style_detail_id && wash_detail_id) {
      return res.status(400).json({
        message: "Provide only style_detail_id OR wash_detail_id, not both",
      });
    }

    let query = {};

    // Assign workOrder_Id or techpack_Id to the query
    if (workOrder_Id) {
      query.workOrder_Id = workOrder_Id;
    } else if (techpack_Id) {
      query.techpack_Id = techpack_Id;
    }

    // Assign style_detail_id or wash_detail_id to the query
    if (style_detail_id) {
      query.style_detail_id = style_detail_id;
      query.wash_detail_id = { $exists: false }; // Exclude wash details
    } else if (
      wash_detail_id &&
      mongoose.Types.ObjectId.isValid(wash_detail_id)
    ) {
      query.wash_detail_id = wash_detail_id;
      query.style_detail_id = { $exists: false }; // Exclude style details
    }

    // Fetch matching records
    const newDetails = await NewDetail.find(query).populate("pic");

    if (!newDetails || newDetails.length === 0) {
      return res.status(404).json({
        message: "No records found for the provided criteria",
      });
    }

    res.status(200).json({
      message: "NewDetails retrieved successfully",
      data: newDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving NewDetails",
      error: error.message,
    });
  }
};

// exports.getAllNewDetailsByWorkOrderID = async (req, res) => {
//   try {
//     const { workOrder_Id, style_detail_id, wash_detail_id } = req.body;

//     if (!workOrder_Id) {
//       return res.status(400).json({ message: "Invalid workOrderId provided" });
//     }

//     if (style_detail_id && wash_detail_id) {
//       return res.status(400).json({ message: "Provide only styleDetailId OR washDetailId, not both" });
//     }

//     let query = { workOrder_Id: workOrder_Id };

//     if (style_detail_id) {
//       query.style_detail_id = style_detail_id;
//       query.wash_detail_id = { $exists: false };
//     } else if (wash_detail_id && mongoose.Types.ObjectId.isValid(wash_detail_id)) {
//       query.wash_detail_id = wash_detail_id;
//       query.style_detail_id = { $exists: false };
//     }

//     const newDetails = await NewDetail.find(query).populate("pic");

//     if (!newDetails || newDetails.length === 0) {
//       return res.status(404).json({ message: "No records found for the provided criteria" });
//     }

//     res.status(200).json({
//       message: "NewDetails retrieved successfully",
//       data: newDetails,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error retrieving NewDetails", error: error.message });
//   }
// };

exports.createColor = async (req, res) => {
  try {
    const { name, workOrder_Id, wash_detail_id, comment } = req.body;

    if (!name || !workOrder_Id) {
      return res
        .status(400)
        .json({ message: "Name and workOrder_Id are required" });
    }

    const newColor = new Color({
      name,
      workOrder_Id,
      wash_detail_id,
      comment,
    });

    await newColor.save();

    res.status(201).json({
      message: "Color created successfully",
      data: newColor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating Color",
      error: error.message,
    });
  }
};

exports.getAllColors = async (_req, res) => {
  try {
    const colors = await Color.find();
    res.status(200).json(colors);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Colors",
      error: error.message,
    });
  }
};

exports.getColorById = async (req, res) => {
  try {
    const { id } = req.params;
    const color = await Color.findById(id);

    if (!color) {
      return res.status(404).json({ message: "Color not found" });
    }

    res.status(200).json(color);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Color",
      error: error.message,
    });
  }
};

exports.updateColorById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, workOrder_Id, wash_detail_id, comment } = req.body;

    const updatedColor = await Color.findByIdAndUpdate(
      id,
      { name, workOrder_Id, wash_detail_id, comment },
      { new: true }
    );

    if (!updatedColor) {
      return res.status(404).json({ message: "Color not found" });
    }

    res.status(200).json({
      message: "Color updated successfully",
      data: updatedColor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating Color",
      error: error.message,
    });
  }
};

exports.deleteColorById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedColor = await Color.findByIdAndDelete(id);

    if (!deletedColor) {
      return res.status(404).json({ message: "Color not found" });
    }

    res.status(200).json({
      message: "Color deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Color",
      error: error.message,
    });
  }
};

// Create an ItemDetail
// exports.createItemDetail = async (req, res) => {
//   try {
//     const itemDetail = new ItemDetail(req.body);
//     await itemDetail.save();
//     res
//       .status(201)
//       .json({ message: "ItemDetail created successfully", data: itemDetail });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error creating ItemDetail", error: error.message });
//   }
// };

// exports.getFilterItemDetails = async (req, res) => {
//   try {
//     const { status, style_number, customer_po_number } = req.query;

//     let query = {};

//     // Filter by multiple statuses (array support)
//     if (status) {
//       const statusArray = Array.isArray(status) ? status : [status]; // Ensure array format
//       query.status = { $in: statusArray };
//     }

//     // Search by style_number (case-insensitive)
//     if (style_number) {
//       query.style_number = { $regex: style_number, $options: 'i' };
//     }

//     // Search by customer_po_number (case-insensitive)
//     if (customer_po_number) {
//       query.customer_po_number = { $regex: customer_po_number, $options: 'i' };
//     }

//     const itemDetails = await ItemDetail.find(query).populate('workOrder_Id client_Id class_Id color_Id size_break');

//     res.status(200).json({
//       message: "ItemDetails retrieved successfully",
//       data: itemDetails,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching ItemDetails",
//       error: error.message,
//     });
//   }
// };

// exports.getFilterItemDetails = async (req, res) => {
//   try {
//     const { search, status, startDate, endDate } = req.query;

//     let query = {};

//     // ✅ Handle multiple statuses passed as comma-separated values
//     if (status) {
//       const statusArray = status.split(',').map(s => s.trim());
//       query.status = { $in: statusArray };
//     }

//     // ✅ Universal Search (fuzzy match across multiple fields)
//     if (search) {
//       query.$or = [
//         { style_number: { $regex: search, $options: 'i' } },
//         { customer_po_number: { $regex: search, $options: 'i' } }
//       ];

//       // 🔹 Fetch matching vendors & clients by name
//       const vendors = await Vendor.find({ name: { $regex: search, $options: 'i' } }, '_id');
//       const clients = await Client.find({ name: { $regex: search, $options: 'i' } }, '_id');

//       // 🔹 Add vendor and client matches to the search query
//       if (vendors.length) query.$or.push({ 'work_order_quotes.vendor': { $in: vendors.map(v => v._id) } });
//       if (clients.length) query.$or.push({ client_Id: { $in: clients.map(c => c._id) } });
//     }

//     // ✅ Filter by Date Range (createdAt or updatedAt)
//     if (startDate || endDate) {
//       query.$or = query.$or || [];
//       let dateFilter = {};

//       if (startDate) dateFilter.$gte = new Date(startDate); // Greater than or equal to startDate
//       if (endDate) dateFilter.$lte = new Date(endDate); // Less than or equal to endDate

//       query.$or.push(
//         { createdAt: dateFilter },
//         { updatedAt: dateFilter }
//       );
//     }

//     // ✅ Fetch matching records, including `createdAt` & `updatedAt`
//     let itemDetails = await ItemDetail.find(query)
//     .populate({
//       path: "workOrder_Id",
//       populate: { path: "vendor" }, // Populate the vendor inside workOrder_Id
//     })
//       .populate('client_Id class_Id color_Id size_break work_order_quotes.vendor', 'name');

//     // ✅ Randomize results if more than 10
//     if (itemDetails.length > 10) {
//       itemDetails = itemDetails.sort(() => 0.5 - Math.random()).slice(0, 10);
//     }

//     res.status(200).json({
//       message: "ItemDetails retrieved successfully",
//       data: itemDetails,
//     });

//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching ItemDetails",
//       error: error.message,
//     });
//   }
// };

exports.getFilterItemDetails = async (req, res) => {
  try {
    const { search, shippingStatus, startDate, endDate } = req.query;

    let query = {};

    // Handle multiple shippingStatuses
  if (shippingStatus) {
  const statusArray = shippingStatus.split(",").map((s) => s.trim());

  query.$or = query.$or || [];
  query.$or.push(
    { shippingStatus: { $in: statusArray } }, // directly on ItemDetail
    { status: { $in: statusArray } }          // status field also
  );
}

    // Universal search
    if (search) {
      query.$or = [
        { style_number: { $regex: search, $options: "i" } },
        { customer_po_number: { $regex: search, $options: "i" } },
      ];

      const vendors = await Vendor.find(
        { name: { $regex: search, $options: "i" } },
        "_id"
      );
      const clients = await Client.find(
        { name: { $regex: search, $options: "i" } },
        "_id"
      );

      if (vendors.length)
        query.$or.push({
          "work_order_quotes.vendor": {
            $in: vendors.map((v) => v._id),
          },
        });
      if (clients.length)
        query.$or.push({
          client_Id: { $in: clients.map((c) => c._id) },
        });
    }

    // Date range filtering
    if (startDate || endDate) {
      query.$or = query.$or || [];
      let dateFilter = {};

      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);

      query.$or.push({ createdAt: dateFilter }, { updatedAt: dateFilter });
    }

    const itemDetails = await ItemDetail.find(query)
      .populate({
        path: "workOrder_Id",
        populate: { path: "vendor" },
      })
      .populate(
        "client_Id class_Id color_Id size_break work_order_quotes.vendor",
        "name"
      );

    // Get arrangement and ASN data for each item detail
    const itemDetailsWithStatus = await Promise.all(
      itemDetails.map(async (itemDetail) => {
        const itemDetailObj = itemDetail.toObject();
        
        // Find ASN that contains this item detail
        const asn = await ASN.findOne({ 
          selectedItemDetails: itemDetail._id 
        });
        
        if (asn) {
          itemDetailObj.asn = {
            _id: asn._id,
            asnNumber: asn.asnNumber,
            status: asn.status,
            loadingDate: asn.loadingDate,
            vesselETD: asn.vesselETD,
            arrivalDate: asn.arrivalDate,
            shipDate: asn.shipDate,
            portShippingForm: asn.portShippingForm,
            comments: asn.comments,
            selectedItemDetails: asn.selectedItemDetails,
            createdAt: asn.createdDate,
          };
          
          // Find arrangement that references this ASN
          const arrangement = await Arrangement.findOne({
            selectedASN: asn._id
          });
          
          if (arrangement) {
            itemDetailObj.arrangement = {
              _id: arrangement._id,
              arrangementNumber: arrangement.arrangementNumber,
              shipDate: arrangement.shipDate,
              arrivalDate: arrangement.arrivalDate,
              destination: arrangement.destination,
              shippingStatus: arrangement.shippingStatus,
              bookingNumber: arrangement.bookingNumber,
              createdAt: arrangement.createdAt
            };
            // Use the arrangement's shippingStatus as the primary status
            itemDetailObj.shippingStatus = arrangement.shippingStatus;
          } else {
            itemDetailObj.arrangement = null;
            // Fall back to ASN status if no arrangement exists
            itemDetailObj.shippingStatus = asn.status;
          }
        } else {
          itemDetailObj.arrangement = null;
          itemDetailObj.asn = null;
          // Fall back to the item's shippingStatus if no ASN exists
          itemDetailObj.shippingStatus = itemDetail.shippingStatus || itemDetail.status;
        }

        // Get design comment info
        const designComments = await DesignComments.find({
          workOrder_Id: itemDetail.workOrder_Id,
          style_number: itemDetail.style_number
        }).sort({ updatedAt: -1 });
        
        if (designComments.length > 0) {
          const designStages = ['PP1', 'PP2', 'PP3', 'Shipping', 'Other'];
          let latestDesignApprovalStatus = null;
          let latestDesignApprovalDate = null;
          
          designComments.forEach(designComment => {
            designStages.forEach(stage => {
              if (designComment[stage]?.approval_status && 
                  (!latestDesignApprovalDate || designComment[stage].date > latestDesignApprovalDate)) {
                latestDesignApprovalStatus = designComment[stage].approval_status;
                latestDesignApprovalDate = designComment[stage].date;
              }
            });
          });
          
          itemDetailObj.designStatusDate = designComments[0].updatedAt;
          itemDetailObj.latestDesignApprovalStatus = latestDesignApprovalStatus;
          itemDetailObj.latestDesignApprovalDate = latestDesignApprovalDate;
        } else {
          itemDetailObj.designStatusDate = null;
          itemDetailObj.latestDesignApprovalStatus = null;
          itemDetailObj.latestDesignApprovalDate = null;
        }
        
        // Get fit comment info
        const fitComments = await FitComments.find({
          workOrder_Id: itemDetail.workOrder_Id,
          style_number: itemDetail.style_number
        }).sort({ updatedAt: -1 });
        
        if (fitComments.length > 0) {
          const fitStages = ['PP1', 'PP2', 'PP3', 'Shipping', 'Other'];
          let latestFitApprovalStatus = null;
          let latestFitApprovalDate = null;
          
          fitComments.forEach(fitComment => {
            // Check stages first
            fitStages.forEach(stage => {
              if (fitComment[stage]?.approval_status && 
                  (!latestFitApprovalDate || fitComment[stage].date > latestFitApprovalDate)) {
                latestFitApprovalStatus = fitComment[stage].approval_status;
                latestFitApprovalDate = fitComment[stage].date;
              }
            });
            
            // Then check root level approval_status if it exists
            if (fitComment.approval_status && 
                (!latestFitApprovalDate || fitComment.updatedAt > latestFitApprovalDate)) {
              latestFitApprovalStatus = fitComment.approval_status;
              latestFitApprovalDate = fitComment.updatedAt;
            }
          });
          
          itemDetailObj.fitStatusDate = fitComments[0].updatedAt;
          itemDetailObj.latestFitApprovalStatus = latestFitApprovalStatus;
          itemDetailObj.latestFitApprovalDate = latestFitApprovalDate;
        } else {
          itemDetailObj.fitStatusDate = null;
          itemDetailObj.latestFitApprovalStatus = null;
          itemDetailObj.latestFitApprovalDate = null;
        }
        
        return itemDetailObj;
      })
    );

    res.status(200).json({
      message: "ItemDetails retrieved successfully",
      data: itemDetailsWithStatus,
      totalRecords: itemDetailsWithStatus.length
    });
  } catch (error) {
    console.error("Error fetching ItemDetails:", error);
    res.status(500).json({
      message: "Error fetching ItemDetails",
      error: error.message,
    });
  }
};

// exports.createItemDetail = async (req, res) => {
//   try {
//     const { workOrder_Id, style_number, customer_po_number } = req.body;

//     // Validate required fields
//     if (!workOrder_Id || !style_number) {
//       return res
//         .status(400)
//         .json({ error: "workOrder_Id and style_number are required" });
//     }

//     // Create the new ItemDetail entry
//     const itemDetail = new ItemDetail({
//       ...req.body,
//       status: req.body.status || "open", // Default status to 'open'
//     });

//     await itemDetail.save();

//     // Find the corresponding WorkOrder
//     const foundWorkOrder = await WorkOrder.findById(workOrder_Id);
//     if (!foundWorkOrder) {
//       return res.status(404).json({ error: "Work Order not found" });
//     }

//     // Update style_number if not already present
//     if (!foundWorkOrder.stylenumber.includes(style_number)) {
//       foundWorkOrder.stylenumber.push(style_number);
//     }

//     // Update customer_po_number if provided and not already present
//     if (
//       customer_po_number &&
//       !foundWorkOrder.customer_po_number.includes(customer_po_number)
//     ) {
//       foundWorkOrder.customer_po_number.push(customer_po_number);
//     }

//     await foundWorkOrder.save();

//     res.status(201).json({
//       message: "ItemDetail created successfully and WorkOrder updated",
//       data: itemDetail,
//     });
//   } catch (error) {
//     console.error("Error creating ItemDetail:", error.message);
//     res.status(500).json({
//       message: "Error creating ItemDetail",
//       error: error.message,
//     });
//   }
// };






// exports.createItemDetail = async (req, res) => {
//   try {

//     const itemDetail = new ItemDetail({
//       ...req.body,
//       status: req.body.status || 'open',
//       // purchaseOrder_Status: req.body.purchaseOrder_Status || 'UnExported'
//        // Ensure status is 'open' if not provided
//     });
//     await itemDetail.save();
//     res.status(201).json({
//       message: "ItemDetail created successfully",
//       data: itemDetail,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error creating ItemDetail",
//       error: error.message,
//     });
//   }
// };
// exports.getAllItemDetails = async (req, res) => {
//   try {
//     const itemDetails = await ItemDetail.find({ purchaseOrder_Status: "UnExported" })
//       .populate({
//         path: "workOrder_Id",
//         populate: { path: "vendor" },
//       })
//       .populate("client_Id")
//       .populate("color_Id");

//     res.status(200).json({
//       message: "All ItemDetails with UnExported purchaseOrder_Status retrieved successfully",
//       data: itemDetails,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error retrieving ItemDetails",
//       error: error.message,
//     });
//   }
// };

// Get all ItemDetails


// exports.createItemDetail = async (req, res) => {
//   try {
//     const { workOrder_Id, style_number, customer_po_number } = req.body;

//     // Validate required fields
//     if (!workOrder_Id || !style_number) {
//       return res
//         .status(400)
//         .json({ error: "workOrder_Id and style_number are required" });
//     }

//     // Create the new ItemDetail entry
//     const itemDetail = new ItemDetail({
//       ...req.body,
//       status: req.body.status || "open", // Default status to 'open'
//     });

//     await itemDetail.save();

//     // Find the corresponding WorkOrder
//     const foundWorkOrder = await WorkOrder.findById(workOrder_Id);
//     if (!foundWorkOrder) {
//       return res.status(404).json({ error: "Work Order not found" });
//     }

//     // Update style_number if not already present
//     if (!foundWorkOrder.stylenumber.includes(style_number)) {
//       foundWorkOrder.stylenumber.push(style_number);
//     }

//     // Update customer_po_number if provided and not already present
//     if (
//       customer_po_number &&
//       !foundWorkOrder.customer_po_number.includes(customer_po_number)
//     ) {
//       foundWorkOrder.customer_po_number.push(customer_po_number);
//     }

//     // Validate rivetImages before saving
//     if (foundWorkOrder.rivetImages && foundWorkOrder.rivetImages.length > 0) {
//       foundWorkOrder.rivetImages = foundWorkOrder.rivetImages.map(image => ({
//         ...image,
//         color: image.color || 'default_color', // Provide default if missing
//         size: image.size || 'default_size'    // Provide default if missing
//       }));
//     }

//     await foundWorkOrder.save();

//     res.status(201).json({
//       message: "ItemDetail created successfully and WorkOrder updated",
//       data: itemDetail,
//     });
//   } catch (error) {
//     console.error("Error creating ItemDetail:", error.message);
//     res.status(500).json({
//       message: "Error creating ItemDetail",
//       error: error.message,
//     });
//   }
// };

// exports.createItemDetail = async (req, res) => {
//   try {
//     const { workOrder_Id, style_number, customer_po_number, package_by_size } = req.body;

//     // Validate required fields
//     if (!workOrder_Id || !style_number) {
//       return res
//         .status(400)
//         .json({ error: "workOrder_Id and style_number are required" });
//     }

//     // Process package_by_size if provided
//     let processedPackageBySize = [];
//     if (package_by_size && Array.isArray(package_by_size)) {
//       processedPackageBySize = package_by_size.map(item => ({
//         id: item.id || Date.now(), // Generate ID if not provided
//         size: item.size,
//         quantity: item.quantity || 0,
//         pieces_per_polybag: item.pieces_per_polybag || 0,
//         master_polybags_per_carton: item.master_polybags_per_carton || 0,
//         pieces_per_carton: item.pieces_per_carton || 0,
//         cartons: item.cartons || 0
//       }));
//     }

//     // Calculate total quantity if package_by_size is provided
//     const totalQuantity = processedPackageBySize.reduce(
//       (sum, item) => sum + (item.quantity || 0),
//       0
//     );

//     // Create the new ItemDetail entry
//     const itemDetail = new ItemDetail({
//       ...req.body,
//       package_by_size: processedPackageBySize,
//       quantity: totalQuantity > 0 ? totalQuantity : req.body.quantity || 0,
//       status: req.body.status || "open", // Default status to 'open'
//       // Set default values for other fields
//       number_of_cartons: req.body.number_of_cartons || 0,
//       total_cbm: req.body.total_cbm || 0,
//       comments: req.body.comments || "",
//       internal_comments: req.body.internal_comments || "",
//     });

//     await itemDetail.save();

//     // Find the corresponding WorkOrder
//     const foundWorkOrder = await WorkOrder.findById(workOrder_Id);
//     if (!foundWorkOrder) {
//       return res.status(404).json({ error: "Work Order not found" });
//     }

//     // Update style_number if not already present
//     if (!foundWorkOrder.stylenumber.includes(style_number)) {
//       foundWorkOrder.stylenumber.push(style_number);
//     }

//     // Update customer_po_number if provided and not already present
//     if (
//       customer_po_number &&
//       !foundWorkOrder.customer_po_number.includes(customer_po_number)
//     ) {
//       foundWorkOrder.customer_po_number.push(customer_po_number);
//     }

//     // Validate rivetImages before saving
//     if (foundWorkOrder.rivetImages && foundWorkOrder.rivetImages.length > 0) {
//       foundWorkOrder.rivetImages = foundWorkOrder.rivetImages.map(image => ({
//         ...image,
//         color: image.color || 'default_color', // Provide default if missing
//         size: image.size || 'default_size'    // Provide default if missing
//       }));
//     }

//     await foundWorkOrder.save();

//     res.status(201).json({
//       message: "ItemDetail created successfully and WorkOrder updated",
//       data: itemDetail,
//     });
//   } catch (error) {
//     console.error("Error creating ItemDetail:", error.message);
//     res.status(500).json({
//       message: "Error creating ItemDetail",
//       error: error.message,
//     });
//   }
// };

exports.createItemDetail = async (req, res) => {
  try {
    const { workOrder_Id, style_number, customer_po_number } = req.body;

    if (!workOrder_Id || !style_number) {
      return res.status(400).json({ 
        error: "workOrder_Id and style_number are required" 
      });
    }

    const style_number_id = new mongoose.Types.ObjectId().toString();

    const itemDetailData = {
      ...req.body,
      stylenumber: {
        _id: style_number_id,
        number: style_number
      }
    };

    const itemDetail = new ItemDetail(itemDetailData);
    await itemDetail.save();

    const foundWorkOrder = await WorkOrder.findById(workOrder_Id);
    if (!foundWorkOrder) {
      return res.status(404).json({ error: "Work Order not found" });
    }

    // Update style numbers
    if (!foundWorkOrder.stylenumbers) {
      foundWorkOrder.stylenumbers = [];
    }

    const existingStyleIndex = foundWorkOrder.stylenumbers.findIndex(
      sn => sn.number === style_number
    );

    if (existingStyleIndex === -1) {
      foundWorkOrder.stylenumbers.push({
        _id: style_number_id,
        number: style_number
      });
    }

    // Update customer PO number
    if (customer_po_number) {
      if (!foundWorkOrder.customer_po_number) {
        foundWorkOrder.customer_po_number = [];
      }
      
      // Remove duplicates and add new PO number
      foundWorkOrder.customer_po_number = [
        ...new Set([...foundWorkOrder.customer_po_number, customer_po_number])
      ];
    }

    await foundWorkOrder.save();

    res.status(201).json({
      message: "ItemDetail created successfully and WorkOrder updated",
      data: itemDetail,
    });
  } catch (error) {
    console.error("Error creating ItemDetail:", error);
    res.status(500).json({
      message: "Error creating ItemDetail",
      error: error.message,
    });
  }
};

// In your controller file
exports.getAllItemDetailswithAsnandArrangment = async (req, res) => {
  try {
    // Fetch all item details from the database
    const itemDetails = await ItemDetail.find({})
      .sort({ createdAt: -1 }) // Sort by creation date (newest first)
      .lean(); // Convert to plain JavaScript objects

    if (!itemDetails || itemDetails.length === 0) {
      return res.status(404).json({
        message: "No item details found",
        data: []
      });
    }

    // You can add additional processing here if needed
    // For example, grouping by work order or style number

    res.status(200).json({
      message: "All item details retrieved successfully",
      count: itemDetails.length,
      data: itemDetails
    });
  } catch (error) {
    console.error("Error fetching item details:", error);
    res.status(500).json({
      message: "Error fetching item details",
      error: error.message
    });
  }
};


exports.getAllItemDetails = async (_req, res) => {
  try {
    const itemDetails = await ItemDetail.find()
      .populate({
        path: "workOrder_Id",
        populate: { path: "vendor" }, // Populate the vendor inside workOrder_Id
      })
      .populate("client_Id")
      .populate("color_Id");

    res.status(200).json({
      message: "All ItemDetails retrieved successfully",
      data: itemDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving ItemDetails",
      error: error.message,
    });
  }
};

exports.getFilteredItemDetails = async (req, res) => {
  try {
    const {
      workOrder_Id,
      client_Id,
      status,
      style_number,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    if (workOrder_Id) filter.workOrder_Id = workOrder_Id;
    if (client_Id) filter.client_Id = client_Id;
    if (status) filter.status = status;
    if (style_number) filter.style_number = style_number;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const itemDetails = await ItemDetail.find(filter)
      .populate("workOrder_Id client_Id  work_order_quotes.vendor")
      .populate({
        path: "workOrder_Id",
        select: "ETD",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Filtered Item Details fetched successfully",
      data: itemDetails,
    });
  } catch (error) {
    console.error("Error fetching filtered Item Details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUnExportedItemDetailsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const itemDetails = await ItemDetail.find({
      purchaseOrder_Status: "UnExported",
    })
      .populate({
        path: "workOrder_Id",
        match: { vendor: vendorId },
        populate: { path: "vendor" },
      })
      .populate("client_Id")
      .populate("color_Id");

    const filteredItems = itemDetails.filter(
      (item) => item.workOrder_Id !== null
    );

    res.status(200).json({
      message: `ItemDetails for vendor ${vendorId} with UnExported purchaseOrder_Status retrieved successfully`,
      data: filteredItems,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving ItemDetails by vendor",
      error: error.message,
    });
  }
};

exports.getUnExportedItemDetails = async (_req, res) => {
  try {
    const itemDetails = await ItemDetail.find({
      purchaseOrder_Status: "UnExported",
    })
      .populate({
        path: "workOrder_Id",
        populate: { path: "vendor" }, // Populate the vendor inside workOrder_Id
      })
      .populate("client_Id")
      .populate("color_Id");

    res.status(200).json({
      message:
        "All ItemDetails with UnExported purchaseOrder_Status retrieved successfully",
      data: itemDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving ItemDetails",
      error: error.message,
    });
  }
};

// exports.getAllItemDetails = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     let itemDetails;

//     if (req.user.role === "admin") {
//       // Admin sees all item details
//       itemDetails = await ItemDetail.find()
//         .populate({
//           path: "workOrder_Id",
//           populate: { path: "vendor", model: "Vendor" }
//         })
//         .populate("client_Id")
//         .populate("color_Id");
//     } else if (req.user.role === "vendoruser") {
//       // Vendor sees only their own work order data
//       const vendorWorkOrders = await workOrder.find({ vendor: req.user.vendor }).select("_id");

//       if (!vendorWorkOrders.length) {
//         return res.status(404).json({ message: "No work orders found for this vendor." });
//       }

//       const workOrderIds = vendorWorkOrders.map((wo) => wo._id);

//       itemDetails = await ItemDetail.find({ workOrder_Id: { $in: workOrderIds } })
//         .populate({
//           path: "workOrder_Id",
//           populate: { path: "vendor", model: "Vendor" }
//         })
//         .populate("client_Id")
//         .populate("color_Id");

//       if (!itemDetails.length) {
//         return res.status(404).json({ message: "No item details found for this vendor." });
//       }
//     } else {
//       return res.status(403).json({ message: "Unauthorized access." });
//     }

//     res.status(200).json({
//       message: "ItemDetails retrieved successfully",
//       data: itemDetails,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error retrieving ItemDetails",
//       error: error.message,
//     });
//   }
// };

// Get all ItemDetails

exports.getAllItemDetailsByWorkOrderID = async (req, res) => {
  try {
    const { workOrder_Id } = req.params; // Get workOrder_Id from URL parameters

    // Validate if workOrder_Id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(workOrder_Id)) {
      return res.status(400).json({ message: "Invalid Work Order ID format" });
    }

    const itemDetails = await ItemDetail.find({
      workOrder_Id: new mongoose.Types.ObjectId(workOrder_Id),
    })
      .populate("client_Id")
      .populate("color_Id")
      .populate("class_Id")
      .populate("size_break")
       .populate("size_scale");

    if (!itemDetails.length) {
      return res
        .status(404)
        .json({ message: "No ItemDetails found for this Work Order" });
    }

    res.status(200).json({
      message: "All ItemDetails retrieved successfully",
      data: itemDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving ItemDetails",
      error: error.message,
    });
  }
};


exports.getStyleNumbersByWorkOrderID = async (req, res) => {
  try {
    const { workOrder_Id } = req.params;

    // Validate if workOrder_Id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(workOrder_Id)) {
      return res.status(400).json({ message: "Invalid Work Order ID format" });
    }

    // Query distinct style numbers for the given work order
    const styleNumbers = await ItemDetail.aggregate([
      {
        $match: {
          workOrder_Id: new mongoose.Types.ObjectId(workOrder_Id)
        }
      },
      {
        $group: {
          _id: "$stylenumber.number",
          id: { $first: "$stylenumber._id" }
        }
      },
      {
        $project: {
          _id: 0,
          number: "$_id",
          id: 1
        }
      }
    ]);

    if (!styleNumbers.length) {
      return res.status(404).json({ 
        message: `No style numbers found for Work Order ${workOrder_Id}` 
      });
    }

    res.status(200).json({
      message: "Style numbers retrieved successfully",
      data: styleNumbers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving style numbers",
      error: error.message,
    });
  }
};






// Get an ItemDetail by ID
exports.getItemDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const itemDetail = await ItemDetail.findById(id)
      .populate("workOrder_Id")
      .populate("client_Id")
      .populate("color_Id");
    if (!itemDetail) {
      return res.status(404).json({ message: "ItemDetail not found" });
    }
    res.status(200).json({
      message: "ItemDetail retrieved successfully",
      data: itemDetail,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving ItemDetail",
      error: error.message,
    });
  }
};

// Update an ItemDetail by ID
// exports.updateItemDetailById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const previous = await ItemDetail.findById(id);
//     const updatedItemDetail = await ItemDetail.findByIdAndUpdate(id, req.body, {
//       new: true,
//     });
//     if (!updatedItemDetail) {
//       return res.status(404).json({ message: "ItemDetail not found" });
//     }
//     const workOrder = await WorkOrder.findById(previous.workOrder_Id);
//     const indexToUpdate = workOrder.stylenumber.findIndex(number => number === previous.style_number);
//     workOrder.stylenumber[indexToUpdate] = updatedItemDetail.style_number;
//     await workOrder.save();
//     res.status(200).json({
//       message: "ItemDetail updated successfully",
//       data: updatedItemDetail,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error updating ItemDetail",
//       error: error.message,
//     });
//   }
// };


exports.updateItemDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_po_number, workOrder_Id, style_number } = req.body;
    const previous = await ItemDetail.findById(id);
    
    if (!previous) {
      return res.status(404).json({ message: "ItemDetail not found" });
    }

    // Prepare update data
    const updateData = {
      ...req.body,
      stylenumber: {
        _id: previous.stylenumber._id, // Keep the same _id
        number: style_number || previous.stylenumber.number  // Update the number if provided
      }
    };

    const updatedItemDetail = await ItemDetail.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // Find the associated WorkOrder
    const workOrder = await WorkOrder.findById(workOrder_Id || previous.workOrder_Id);
    if (!workOrder) {
      return res.status(404).json({ message: "Associated WorkOrder not found" });
    }

    // Update style number in WorkOrder if changed
    if (style_number && previous.stylenumber.number !== style_number) {
      const styleIndex = workOrder.stylenumbers.findIndex(
        sn => sn._id.toString() === previous.stylenumber._id.toString()
      );
      
      if (styleIndex !== -1) {
        workOrder.stylenumbers[styleIndex].number = style_number;
      }
    }

    // Handle customer_po_number updates
    if (customer_po_number !== undefined) {
      // First get all ItemDetails for this work order to collect all PO numbers
      const allItemDetails = await ItemDetail.find({ workOrder_Id: workOrder._id });
      
      // Collect all unique PO numbers from all items
      const allPoNumbers = allItemDetails
        .map(item => item.customer_po_number)
        .filter(po => po) // Remove null/undefined
        .filter((po, index, self) => self.indexOf(po) === index); // Remove duplicates

      // If the current item is being updated to have a PO number, add it
      if (customer_po_number && !allPoNumbers.includes(customer_po_number)) {
        allPoNumbers.push(customer_po_number);
      }

      // If the current item is being updated to remove its PO number, 
      // it will already be excluded from allPoNumbers

      // Update the WorkOrder with the complete list of PO numbers
      workOrder.customer_po_number = allPoNumbers;
    }

    await workOrder.save();

    res.status(200).json({
      message: "ItemDetail and associated WorkOrder updated successfully",
      data: {
        itemDetail: updatedItemDetail,
        workOrder: {
          _id: workOrder._id,
          customer_po_number: workOrder.customer_po_number,
          stylenumbers: workOrder.stylenumbers
        }
      }
    });

  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({
      message: "Error updating ItemDetail",
      error: error.message
    });
  }
};

// Delete an ItemDetail by ID
exports.deleteItemDetailById = async (req, res) => {
  try {
    const { id } = req.params;

    // First find the item detail to get its workOrder_Id, customer_po_number, and style_number
    const itemDetail = await ItemDetail.findById(id);
    if (!itemDetail) {
      return res.status(404).json({ message: "ItemDetail not found" });
    }

    const { workOrder_Id, customer_po_number, style_number } = itemDetail;

    // Delete the item detail
    await ItemDetail.findByIdAndDelete(id);

    // Delete any design comments with the same workOrder_Id and style_number
    await DesignComments.deleteMany({
      workOrder_Id: workOrder_Id,
      styleNumber: style_number
    });

    // Delete any fit comments with the same workOrder_Id and style_number
    await FitComments.deleteMany({
      workOrder_Id: workOrder_Id,
      styleNumber: style_number
    });

    // Find the corresponding WorkOrder
    const foundWorkOrder = await WorkOrder.findById(workOrder_Id);
    if (foundWorkOrder) {
      // Remove style number from work order
      if (foundWorkOrder.stylenumber && Array.isArray(foundWorkOrder.stylenumber)) {
        foundWorkOrder.stylenumber = foundWorkOrder.stylenumber.filter(
          (number) => number != style_number
        );
      }

      // Remove the customer_po_number if it exists in the array
      if (
        customer_po_number &&
        foundWorkOrder.customer_po_number.includes(customer_po_number)
      ) {
        foundWorkOrder.customer_po_number =
          foundWorkOrder.customer_po_number.filter(
            (po) => po !== customer_po_number
          );
        await foundWorkOrder.save();
      }
    }

    res.status(200).json({ 
      message: "ItemDetail and related comments (Design & Fit) deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting ItemDetail:", error.message);
    res.status(500).json({
      message: "Error deleting ItemDetail",
      error: error.message,
    });
  }
};

// // Create SampleGradedSpecs
// exports.createSampleGradedSpecs = async (req, res) => {
//   try {
//     const {
//       workOrder_Id,
//       item_type_Id,
//       size_range_Id,
//       spec_template_Id,
//       style_nummber,
//       fabric_content,
//       customer_or_brand,
//       size,
//       garment_specs_details,
//     } = req.body;

//     const newSampleGradedSpecs = new SampleGradedSpecs({
//       workOrder_Id,
//       item_type_Id,
//       size_range_Id,
//       spec_template_Id,
//       style_nummber,
//       fabric_content,
//       customer_or_brand,
//       size,
//       garment_specs_details,
//     });
//     const savedSampleGradedSpecs = await newSampleGradedSpecs.save();

//     // Create and save the DesignComments with the IDs
//     const newDesignComments = new DesignComments({
//       workOrder_Id,
//       sampleGradedSpecs_id: savedSampleGradedSpecs._id,
//     });

//     await newDesignComments.save();

//     // Create and save the DesignComments with the IDs
//     const newFitComments = new FitComments({
//       workOrder_Id,
//       sampleGradedSpecs_id: savedSampleGradedSpecs._id,
//     });

//     await newFitComments.save();
//     res.status(201).json({
//       message: "Sample Graded Specs created successfully",
//       data: newSampleGradedSpecs,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error creating Sample Graded Specs",
//       error: error.message,
//     });
//   }
// };

// // Get All SampleGradedSpecs
// exports.getAllSampleGradedSpecs = async (req, res) => {
//   try {
//     const sampleGradedSpecsList = await SampleGradedSpecs.find().populate(
//       "workOrder_Id item_type_Id size_range_Id spec_template_Id"
//     );
//     res.status(200).json({
//       message: "Sample Graded Specs fetched successfully",
//       data: sampleGradedSpecsList,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching Sample Graded Specs",
//       error: error.message,
//     });
//   }
// };

// // Get SampleGradedSpecs By ID
// exports.getSampleGradedSpecsById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const sampleGradedSpecs = await SampleGradedSpecs.findById(id).populate(
//       "workOrder_Id item_type_Id size_range_Id spec_template_Id"
//     );
//     if (!sampleGradedSpecs) {
//       return res.status(404).json({ message: "Sample Graded Specs not found" });
//     }
//     res.status(200).json({
//       message: "Sample Graded Specs fetched successfully",
//       data: sampleGradedSpecs,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching Sample Graded Specs",
//       error: error.message,
//     });
//   }
// };

// // Update SampleGradedSpecs By ID
// exports.updateSampleGradedSpecsById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updatedData = req.body;

//     const updatedSampleGradedSpecs = await SampleGradedSpecs.findByIdAndUpdate(
//       id,
//       updatedData,
//       { new: true }
//     );
//     if (!updatedSampleGradedSpecs) {
//       return res.status(404).json({ message: "Sample Graded Specs not found" });
//     }
//     res.status(200).json({
//       message: "Sample Graded Specs updated successfully",
//       data: updatedSampleGradedSpecs,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error updating Sample Graded Specs",
//       error: error.message,
//     });
//   }
// };

// // Delete SampleGradedSpecs By ID
// exports.deleteSampleGradedSpecsById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deletedSampleGradedSpecs = await SampleGradedSpecs.findByIdAndDelete(
//       id
//     );
//     if (!deletedSampleGradedSpecs) {
//       return res.status(404).json({ message: "Sample Graded Specs not found" });
//     }
//     res.status(200).json({
//       message: "Sample Graded Specs deleted successfully",
//       data: deletedSampleGradedSpecs,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error deleting Sample Graded Specs",
//       error: error.message,
//     });
//   }
// };

// // Create Design Comment
// exports.createDesignComment = async (req, res) => {
//   try {
//     const {
//       sampleGradedSpecs_id,
//       workOrder_Id,
//       sampleStatus_id,
//       sampleRequestingStatus_id,
//     } = req.body;

//     const newDesignComment = new DesignComments({
//       sampleGradedSpecs_id,
//       workOrder_Id,
//       sampleStatus_id,
//       sampleRequestingStatus_id,
//     });

//     const savedDesignComment = await newDesignComment.save();

//     res.status(201).json({
//       message: "Design Comment created successfully",
//       data: savedDesignComment,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error creating Design Comment", error: error.message });
//   }
// };

// // Get All Design Comments
// exports.getAllDesignComments = async (req, res) => {
//   try {
//     const designComments = await DesignComments.find()
//       .populate("sampleGradedSpecs_id")
//       .populate("workOrder_Id")
//       .populate("sampleStatus_id")
//       .populate("sampleRequestingStatus_id");

//     res.status(200).json({
//       message: "Design Comments fetched successfully",
//       data: designComments,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching Design Comments",
//       error: error.message,
//     });
//   }
// };

// // Get Single Design Comment by ID
// exports.getDesignCommentById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const designComment = await DesignComments.findById(id)
//       .populate("sampleGradedSpecs_id")
//       .populate("workOrder_Id")
//       .populate("sampleStatus_id")
//       .populate("sampleRequestingStatus_id");

//     if (!designComment) {
//       return res.status(404).json({ message: "Design Comment not found" });
//     }

//     res.status(200).json({
//       message: "Design Comment fetched successfully",
//       data: designComment,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching Design Comment", error: error.message });
//   }
// };

// // Update Design Comment
// exports.updateDesignComment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updatedData = req.body;

//     const updatedDesignComment = await DesignComments.findByIdAndUpdate(
//       id,
//       updatedData,
//       {
//         new: true,
//       }
//     )
//       .populate("sampleGradedSpecs_id")
//       .populate("workOrder_Id")
//       .populate("sampleStatus_id")
//       .populate("sampleRequestingStatus_id");

//     if (!updatedDesignComment) {
//       return res.status(404).json({ message: "Design Comment not found" });
//     }

//     res.status(200).json({
//       message: "Design Comment updated successfully",
//       data: updatedDesignComment,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error updating Design Comment", error: error.message });
//   }
// };

// // Delete Design Comment
// exports.deleteDesignComment = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deletedDesignComment = await DesignComments.findByIdAndDelete(id);

//     if (!deletedDesignComment) {
//       return res.status(404).json({ message: "Design Comment not found" });
//     }

//     res.status(200).json({
//       message: "Design Comment deleted successfully",
//       data: deletedDesignComment,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error deleting Design Comment", error: error.message });
//   }
// };

// // Create FitComments
// exports.createFitComment = async (req, res) => {
//   try {
//     const {
//       sampleGradedSpecs_id,
//       workOrder_Id,
//       sampleStatus_id,
//       sampleRequestingStatus_id,
//     } = req.body;

//     const newFitComment = new FitComments({
//       sampleGradedSpecs_id,
//       workOrder_Id,
//       sampleStatus_id,
//       sampleRequestingStatus_id,
//     });

//     await newFitComment.save();

//     res.status(201).json({
//       message: "Fit Comment created successfully",
//       data: newFitComment,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error creating Fit Comment", error: error.message });
//   }
// };

// // Get all FitComments
// exports.getAllFitComments = async (req, res) => {
//   try {
//     const fitComments = await FitComments.find().populate([
//       { path: "sampleGradedSpecs_id" },
//       { path: "workOrder_Id" },
//       { path: "sampleStatus_id" },
//       { path: "sampleRequestingStatus_id" },
//     ]);

//     res.status(200).json({
//       message: "Fit Comments fetched successfully",
//       data: fitComments,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching Fit Comments", error: error.message });
//   }
// };

// // Get FitComment by ID
// exports.getFitCommentById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const fitComment = await FitComments.findById(id).populate([
//       { path: "sampleGradedSpecs_id" },
//       { path: "workOrder_Id" },
//       { path: "sampleStatus_id" },
//       { path: "sampleRequestingStatus_id" },
//     ]);

//     if (!fitComment) {
//       return res.status(404).json({ message: "Fit Comment not found" });
//     }

//     res
//       .status(200)
//       .json({ message: "Fit Comment fetched successfully", data: fitComment });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching Fit Comment", error: error.message });
//   }
// };

// // Update FitComment by ID
// exports.updateFitCommentById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const updatedFitComment = await FitComments.findByIdAndUpdate(
//       id,
//       req.body,
//       { new: true }
//     );

//     if (!updatedFitComment) {
//       return res.status(404).json({ message: "Fit Comment not found" });
//     }

//     res.status(200).json({
//       message: "Fit Comment updated successfully",
//       data: updatedFitComment,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error updating Fit Comment", error: error.message });
//   }
// };

// // Delete FitComment by ID
// exports.deleteFitCommentById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deletedFitComment = await FitComments.findByIdAndDelete(id);

//     if (!deletedFitComment) {
//       return res.status(404).json({ message: "Fit Comment not found" });
//     }

//     res.status(200).json({ message: "Fit Comment deleted successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error deleting Fit Comment", error: error.message });
//   }
// };

// exports.sendWorkOrderEmail = async (req, res) => {
//   const { id, email } = req.body;

//   if (!email) {
//     return res.status(400).json({ error: "Recipient email is required" });
//   }

//   try {
//     await sendWorkOrderEmail(id, email);
//     res.status(200).json({ message: "Work order email sent successfully" });
//   } catch (error) {
//     console.error("Error sending work order email:", error.message);
//     res.status(500).json({ error: "Failed to send work order email" });
//   }
// };
// exports.generatePDF = async (req, res) => {
//   try {
//     const { id } = req.params;
//     // Fetch the work order details from the database
//     const workOrderData = await workOrder
//       .findById(id)
//       .populate("vendor")
//       .populate("categories")
//       .populate("itemType")
//       .populate("subCategory")
//       .populate("trim_id")
//       .populate({
//         path: "rivetImages.image",
//         model: "Picture",
//       })
//       .populate("pictures")
//       .populate({
//         path: "buttonImages.image",
//         model: "Picture",
//       })
//       .populate({
//         path: "trimImages.image",
//         model: "Picture",
//       });
//     if (!workOrderData) {
//       return res.status(404).json({ message: "Work order not found" });
//     }
//     // // Create a new PDF document
//     // const doc = new PDFDocument();
//     // // Set the response headers
//     // const fileName = `workorder-${id}.pdf`;
//     // res.setHeader('Content-Type', 'application/pdf');
//     // res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
//     // // Pipe the PDF to the response
//     // doc.pipe(res);
//     // // Add PDF content
//     // doc.fontSize(20).text('Work Order Details', { align: 'center' });
//     // doc.moveDown();
//     // doc.fontSize(14).text(`Vendor: ${workOrderData.vendor.name || 'N/A'}`);
//     // doc.text(`Category: ${workOrderData.category.name || 'N/A'}`);
//     // doc.text(`Item Type: ${workOrderData.itemType.name || 'N/A'}`);
//     // doc.text(`SubCategory: ${workOrderData.subCategory.name || 'N/A'}`);
//     // doc.text(`ETD: ${workOrderData.etd.toDateString()}`);
//     // doc.moveDown();
//     // // Add images section if available
//     // if (workOrderData.pictures && workOrderData.pictures.length > 0) {
//     //     doc.fontSize(16).text('Pictures:', { underline: true });
//     //     workOrderData.pictures.forEach((picture, index) => {
//     //         doc.text(`${index + 1}. ${picture.name || 'Unnamed Image'}`);
//     //     });
//     //     doc.moveDown();
//     // }
//     // doc.text('Generated on: ' + new Date().toLocaleString(), { align: 'right' });
//     // // Finalize the PDF and end the stream
//     // doc.end();

//     const pdfPath = await generateWorkOrderPDF(workOrderData);
//     res
//       .status(200)
//       .json({ message: "Work Order retrieved successfully", pdfPath });
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };
exports.getWorkOrderByVendor = async (req, res) => {
  const { vendorId } = req.params;
  console.log(vendorId);
  try {
    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    const techPacks = await WorkOrder
      .find({ vendor: vendorId })
      .populate("vendor")
      .populate("categories")
      .populate("itemType")
      .populate("subCategories")
      .populate("trim_id")
      .populate("pictures")
      .populate("buttonImages.image")
      .populate("rivetImages.image");

    if (!techPacks || techPacks.length === 0) {
      return res
        .status(404)
        .json({ message: "No tech packs found for this vendor" });
    }

    res.status(200).json(techPacks);
  } catch (error) {
    console.error("Error fetching tech packs by vendor:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// exports.addWorkOrderQuote = async (req, res) => {
//   try {
//     const { workOrder_Id, price, fabric, notes, vendor, status } = req.body;

//     if (!workOrder_Id || !price || !fabric || !vendor) {
//       return res.status(400).json({
//         message: 'WorkOrder ID, price, fabric, and vendor are required',
//       });
//     }

//     const vendorDetails = await Vendor.findById(vendor);
//     if (!vendorDetails) {
//       return res.status(404).json({
//         message: 'Vendor not found',
//       });
//     }

//     const fetchedWorkOrder = await workOrder.findById(workOrder_Id).populate('work_order_quote.vendor');
//     if (!fetchedWorkOrder) {
//       return res.status(404).json({
//         message: 'WorkOrder not found',
//       });
//     }

//     if (!Array.isArray(fetchedWorkOrder.work_order_quote)) {
//       fetchedWorkOrder.work_order_quote = [];
//     }

//     // Create a new quote
//     const newQuote = {
//       price,
//       date: new Date(),
//       fabric,
//       notes: notes || '',
//       vendor,
//       status: status || 'pending',
//     };

//     fetchedWorkOrder.work_order_quote.push(newQuote);

//     await fetchedWorkOrder.save();
//     const contractId = (await SalesContract.countDocuments()) + 1;

//     const salesContract = new SalesContract({
//       contractId,
//       contractDate: new Date(),
//       quoteId: workOrder_Id,
//       vendorId: vendor,
//     });

//     await salesContract.save();
//     res.status(200).json({
//       message: 'Quote and associated sales contract added successfully',
//       data: {
//         workOrder: fetchedWorkOrder,
//         salesContract,
//       },
//     });
//   } catch (err) {
//     console.error('Error adding work order quote:', err);
//     res.status(500).json({
//       message: 'Server error',
//       error: err.message || 'An error occurred while adding the quote',
//     });
//   }
// };
exports.addWorkOrderQuote = async (req, res) => {
  try {
    const { itemDetail_Id, price, fabric, notes, vendor, status } = req.body;

    // Validate input
    if (!itemDetail_Id || !price || !fabric || !vendor) {
      return res.status(400).json({
        message: "ItemDetail ID, price, fabric, and vendor are required.",
      });
    }

    // Validate vendor existence
    const vendorDetails = await Vendor.findById(vendor);
    if (!vendorDetails) {
      return res.status(404).json({
        message: "Vendor not found.",
      });
    }

    // Fetch the ItemDetail record
    const fetchedItemDetail = await ItemDetail.findById(itemDetail_Id).populate(
      "work_order_quotes.vendor"
    );
    if (!fetchedItemDetail) {
      return res.status(404).json({
        message: "ItemDetail not found.",
      });
    }

    // Ensure the work_order_quotes array exists
    if (!Array.isArray(fetchedItemDetail.work_order_quotes)) {
      fetchedItemDetail.work_order_quotes = [];
    }

    // Create a new quote
    const newQuote = {
      price,
      date: new Date(),
      fabric,
      notes: notes || "",
      vendor,
      status: status || "pending",
    };

    // Add the new quote to the itemDetail
    fetchedItemDetail.work_order_quotes.push(newQuote);

    // Save the updated itemDetail
    await fetchedItemDetail.save();

    // Create a sales contract for the new quote
    const contractId = (await SalesContract.countDocuments()) + 1;
    const salesContract = new SalesContract({
      contractId,
      contractDate: new Date(),
      workOrderquoteId: fetchedItemDetail._id, // Reference to ItemDetail (work order quote)
      vendorId: vendor,
      styleNo: fetchedItemDetail.style_number, // Include style number for reference
    });

    // Save the sales contract
    await salesContract.save();

    // Response with success
    res.status(200).json({
      message: "Quote and associated sales contract added successfully.",
      data: {
        itemDetail: fetchedItemDetail,
        salesContract,
      },
    });
  } catch (err) {
    console.error("Error adding work order quote:", err);
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while adding the quote.",
    });
  }
};

// get workorder by workorder id
exports.getWorkOrderQuotes = async (req, res) => {
  try {
    const { workOrder_Id } = req.params;

    if (!workOrder_Id) {
      return res.status(400).json({ message: "TechPack ID is required" });
    }

    const fetchedWorkOrder = await WorkOrder
      .findById(workOrder_Id)
      .populate("work_order_quote.vendor");

    if (!workOrder_Id) {
      return res.status(404).json({ message: "TechPack not found" });
    }

    res.status(200).json({
      message: "TechPack quotes retrieved successfully",
      data: fetchedWorkOrder.work_order_quote,
    });
  } catch (err) {
    console.error("Error fetching tech pack quotes:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || "An error occurred while retrieving the quotes",
    });
  }
};

exports.updateWorkOrderQuote = async (req, res) => {
  try {
    const { workOrder_Id, quoteIndex } = req.params;
    const { price, fabric, notes, vendor, status } = req.body;

    if (!workOrder_Id || !quoteIndex || !price || !fabric || !vendor) {
      return res.status(400).json({
        message:
          "workOrder_Id, quote index, price, fabric, and vendor are required",
      });
    }
    const vendorDetails = await Vendor.findById(vendor);
    if (!vendorDetails) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const fetchedWorkOrder = await WorkOrder.findById(workOrder_Id);

    if (!workOrder_Id) {
      return res.status(404).json({ message: "workOrder_Id not found" });
    }

    if (
      quoteIndex < 0 ||
      quoteIndex >= fetchedWorkOrder.work_order_quote.length
    ) {
      return res.status(400).json({ message: "Invalid quote index" });
    }
    fetchedWorkOrder.work_order_quote[quoteIndex] = {
      price,
      date: new Date(),
      fabric,
      notes: notes || "",
      vendor,
      status,
    };

    await fetchedWorkOrder.save();

    res.status(200).json({
      message: "Quote updated successfully",
      data: fetchedWorkOrder,
    });
  } catch (err) {
    console.error("Error updating tech pack quote:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || "An error occurred while updating the quote",
    });
  }
};

exports.deleteWorkOrderQuote = async (req, res) => {
  try {
    const { workOrder_Id, quoteIndex } = req.params;

    if (!workOrder_Id || !quoteIndex) {
      return res
        .status(400)
        .json({ message: "workorder ID and quote index are required" });
    }
    const fetchedWorkOrder = await WorkOrder.findById(workOrder_Id);

    if (!workOrder_Id) {
      return res.status(404).json({ message: "workorder not found" });
    }
    if (
      quoteIndex < 0 ||
      quoteIndex >= fetchedWorkOrder.work_order_quote.length
    ) {
      return res.status(400).json({ message: "Invalid quote index" });
    }
    fetchedWorkOrder.work_order_quote.splice(quoteIndex, 1);
    await fetchedWorkOrder.save();

    res.status(200).json({
      message: "Quote deleted successfully",
      data: fetchedWorkOrder,
    });
  } catch (err) {
    console.error("Error deleting tech pack quote:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || "An error occurred while deleting the quote",
    });
  }
};

// -----------------------------------------------------------
// exports.getItemDetailsByVendorAndWorkOrder = async (req, res) => {
//   try {
//     const { vendorId } = req.params;

//     if ( !vendorId) {
//       return res.status(400).json({
//         message: 'Vendor ID is required.',
//       });
//     }
//     const workOrders = await workOrder
//       .find({ vendor: vendorId })
//       .populate('vendor')
//       .populate('category')
//       .populate('itemType')
//       .populate('subCategory');

//     if (!workOrders || workOrders.length === 0) {
//       return res.status(404).json({
//         message: 'No work orders found for the given vendor ID.',
//       });
//     }

//     const workOrderIds = workOrders.map((workOrder) => workOrder._id);
//     const itemDetails = await ItemDetail.find({
//       workOrder_Id: { $in: workOrderIds },
//     })
//       .populate('workOrder_Id')
//       .populate('client_Id')
//       .populate('color_Id')
//       .populate('work_order_quotes.vendor');

//     if (!itemDetails || itemDetails.length === 0) {
//       return res.status(404).json({
//         message: 'No item details found for the given work orders.',
//       });
//     }
//     res.status(200).json({
//       message: 'Item details and work orders fetched successfully.',
//       dat  a: {
//         workOrders,
//         itemDetails,
//       },
//     });
//   } catch (err) {
//     console.error('Error fetching item details by vendor and work orders:', err);
//     res.status(500).json({
//       message: 'Server error.',
//       error: err.message || 'An error occurred while fetching the data.',
//     });
//   }
// };

exports.addQuoteToItemDetail = async (req, res) => {
  try {
    const { itemDetailId, price, fabric, notes, vendor, status } = req.body;
    if (!itemDetailId || !price || !fabric || !vendor) {
      return res.status(400).json({
        message: "ItemDetail ID, price, fabric, and vendor are required.",
      });
    }
    const vendorDetails = await Vendor.findById(vendor);
    if (!vendorDetails) {
      return res.status(404).json({
        message: "Vendor not found.",
      });
    }
    const fetchedItemDetail = await ItemDetail.findById(itemDetailId);
    if (!fetchedItemDetail) {
      return res.status(404).json({
        message: "ItemDetail not found.",
      });
    }

    const newQuote = {
      price,
      date: new Date(),
      fabric,
      notes: notes || "",
      vendor,
      status: status || "pending",
    };
    fetchedItemDetail.work_order_quotes.push(newQuote);
    await fetchedItemDetail.save();
    res.status(200).json({
      message: "Quote added successfully.",
      data: {
        itemDetail: fetchedItemDetail,
      },
    });
  } catch (err) {
    console.error("Error adding quote:", err);
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while processing the request.",
    });
  }
};

exports.updateitemDetailQuote = async (req, res) => {
  try {
    const { itemDetail_Id, quoteIndex } = req.params;
    const { price, fabric, notes, vendor, status } = req.body;

    if (
      !itemDetail_Id ||
      quoteIndex === undefined ||
      !price ||
      !fabric ||
      !vendor
    ) {
      return res.status(400).json({
        message:
          "itemDetail_Id, quoteIndex, price, fabric, and vendor are required.",
      });
    }

    const vendorDetails = await Vendor.findById(vendor);
    if (!vendorDetails) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    const fetchedItemDetail = await ItemDetail.findById(itemDetail_Id);

    if (!fetchedItemDetail) {
      return res.status(404).json({ message: "ItemDetail not found." });
    }
    if (
      quoteIndex < 0 ||
      quoteIndex >= fetchedItemDetail.work_order_quotes.length
    ) {
      return res.status(400).json({ message: "Invalid quote index." });
    }

    fetchedItemDetail.work_order_quotes[quoteIndex] = {
      price,
      date: new Date(),
      fabric,
      notes: notes || "",
      vendor,
      status,
    };

    await fetchedItemDetail.save();

    res.status(200).json({
      message: "Quote updated successfully.",
      data: fetchedItemDetail,
    });
  } catch (err) {
    console.error("Error updating work order quote:", err);
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while updating the quote.",
    });
  }
};

exports.deleteitemDetailQuote = async (req, res) => {
  try {
    const { itemDetail_Id, quoteIndex } = req.params;

    if (!itemDetail_Id || quoteIndex === undefined) {
      return res.status(400).json({
        message: "itemDetail_Id and quoteIndex are required.",
      });
    }
    const fetchedItemDetail = await ItemDetail.findById(itemDetail_Id);

    if (!fetchedItemDetail) {
      return res.status(404).json({ message: "ItemDetail not found." });
    }

    if (
      quoteIndex < 0 ||
      quoteIndex >= fetchedItemDetail.work_order_quotes.length
    ) {
      return res.status(400).json({ message: "Invalid quote index." });
    }
    fetchedItemDetail.work_order_quotes.splice(quoteIndex, 1);
    await fetchedItemDetail.save();

    res.status(200).json({
      message: "Quote deleted successfully.",
      data: fetchedItemDetail,
    });
  } catch (err) {
    console.error("Error deleting work order quote:", err);
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while deleting the quote.",
    });
  }
};
// exports.getAllSalesContracts = async (req, res) => {
//   try {
//     const salesContracts = await SalesContract.find()
//       .populate('workOrderquoteId')
//       .populate('vendorId');

//     if (!salesContracts || salesContracts.length === 0) {
//       return res.status(404).json({ message: 'No sales contracts found' });
//     }

//     res.status(200).json(salesContracts);
//   } catch (error) {
//     console.error('Error fetching sales contracts:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// exports.getAllSalesContracts = async (req, res) => {
//   try {
//     const { search, vendorName } = req.query;

//     let filter = {};

//     // Filter by keyword
//     if (search) {
//       filter.$or = [
//         { contractNo: { $regex: search, $options: 'i' } },
//         { styleNo: { $regex: search, $options: 'i' } },
//         { vendorCompanyName: { $regex: search, $options: 'i' } },
//       ];
//     }

//     // Filter by vendor name (from Vendor collection)
//     if (vendorName) {
//       const matchingVendors = await Vendor.find({
//         name: { $regex: vendorName, $options: 'i' }
//       });

//       const vendorIds = matchingVendors.map(v => v._id);

//       if (vendorIds.length > 0) {
//         filter.vendorId = { $in: vendorIds };
//       } else {
//         // No matching vendor, return empty response early
//         return res.status(200).json([]);
//       }
//     }

//     const salesContracts = await SalesContract.find(filter)
//       .populate('vendorId')
//       .populate('workOrderquoteId');

//     if (!salesContracts || salesContracts.length === 0) {
//       return res.status(404).json({ message: 'No sales contracts found' });
//     }

//     res.status(200).json(salesContracts);
//   } catch (error) {
//     console.error('Error fetching sales contracts:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// ---------------------------------

exports.getItemDetailsByVendorAndWorkOrder = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        message: "Valid Vendor ID is required.",
      });
    }

    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

    const workOrders = await WorkOrder
      .find({ vendor: vendorObjectId })
      .populate("vendor")
      .populate("categories")
      .populate("itemType")
      .populate("pictures")
      .populate("subCategories");

    console.log("Fetched Work Orders:", workOrders); // Log work orders

    if (!workOrders || workOrders.length === 0) {
      return res.status(404).json({
        message: "No work orders fou  nd for the given vendor ID.",
      });
    }

    const workOrderIds = workOrders.map((workOrder) => workOrder._id);
    const itemDetails = await ItemDetail.find({
      workOrder_Id: { $in: workOrderIds },
    })
      .populate({
        path: "workOrder_Id",
        populate: {
          path: "pictures",
          model: "Picture",
          select: "imageName imageTitle category imageUrl active",
        },
      })
      .populate("client_Id")
      .populate("color_Id")
      .populate("work_order_quotes.vendor");

    console.log("Fetched Item Details:", itemDetails);

    if (!itemDetails || itemDetails.length === 0) {
      return res.status(404).json({
        message: "No item details found for the given work orders.",
      });
    }

    const itemDetailsByWorkOrder = itemDetails.reduce((acc, itemDetail) => {
      const workOrderId = itemDetail.workOrder_Id._id.toString();
      if (!acc[workOrderId]) {
        acc[workOrderId] = [];
      }
      acc[workOrderId].push(itemDetail);
      return acc;
    }, {});
    const groupedData = workOrders.map((workOrder) => {
      const workOrderId = workOrder._id.toString();
      const relatedItemDetails = itemDetailsByWorkOrder[workOrderId] || [];
      return {
        ...workOrder.toObject(),
        itemDetails: relatedItemDetails,
      };
    });

    res.status(200).json({
      message: "Work orders and item details fetched successfully.",
      data: groupedData,
    });
  } catch (err) {
    console.error(
      "Error fetching item details by vendor and work orders:",
      err
    );
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while fetching the data.",
    });
  }
};

exports.getWorkOrdersByVendor = async (req, res) => {
  try {
    // Getting vendor IDs from the token
    const userVendorIds = req.user.vendor;

    // Check if vendor IDs are provided in the token
    if (!userVendorIds || userVendorIds.length === 0) {
      return res.status(403).json({
        message: "No vendor access rights found for this user",
      });
    }

    // Query to fetch work orders where the vendor field matches any of the vendor IDs in the token
    const workOrders = await WorkOrder
      .find({
        vendor: { $in: userVendorIds },
      })
      .populate("vendor")
      .populate("categories")
      .populate("itemType")
      .populate("subCategories")
      .populate("pictures")
      .populate("buttonImages.image")
      .populate("rivetImages.image")
      .populate("trimImages.image");

    if (!workOrders || workOrders.length === 0) {
      return res.status(404).json({
        message: "No work orders found for the given vendors",
      });
    }

    res.status(200).json(workOrders);
  } catch (error) {
    console.error("Error fetching work orders by vendor:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// exports.getItemDetailsByVendorAndWorkOrder = async (req, res) => {
//   try {
//     let { vendorId } = req.params;

//     // Ensure vendor users can only access their own data
//     if (req.user.role === "vendoruser") {
//       vendorId = req.user.vendor; // Restrict vendor users to their own vendor ID
//     }

//     if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
//       return res.status(400).json({
//         message: "Valid Vendor ID is required.",
//       });
//     }

//     const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

//     const workOrders = await workOrder
//       .find({ vendor: vendorObjectId })
//       .populate("vendor")
//       .populate("categories")
//       .populate("itemType")
//       .populate("pictures")
//       .populate("subCategory");

//     if (!workOrders.length) {
//       return res.status(404).json({
//         message: "No work orders found for the given vendor ID.",
//       });
//     }

//     const workOrderIds = workOrders.map((wo) => wo._id);
//     const itemDetails = await ItemDetail.find({
//       workOrder_Id: { $in: workOrderIds },
//     })
//       .populate({
//         path: "workOrder_Id",
//         populate: {
//           path: "pictures",
//           model: "Picture",
//           select: "imageName imageTitle category imageUrl active",
//         },
//       })
//       .populate("client_Id")
//       .populate("color_Id")
//       .populate("work_order_quotes.vendor");

//     if (!itemDetails.length) {
//       return res.status(404).json({
//         message: "No item details found for the given work orders.",
//       });
//     }

//     // Group item details by work order
//     const itemDetailsByWorkOrder = itemDetails.reduce((acc, itemDetail) => {
//       const workOrderId = itemDetail.workOrder_Id._id.toString();
//       if (!acc[workOrderId]) {
//         acc[workOrderId] = [];
//       }
//       acc[workOrderId].push(itemDetail);
//       return acc;
//     }, {});

//     // Merge work orders with their corresponding item details
//     const groupedData = workOrders.map((workOrder) => {
//       const workOrderId = workOrder._id.toString();
//       const relatedItemDetails = itemDetailsByWorkOrder[workOrderId] || [];
//       return {
//         ...workOrder.toObject(),
//         itemDetails: relatedItemDetails,
//       };
//     });

//     res.status(200).json({
//       message: "Work orders and item details fetched successfully.",
//       data: groupedData,
//     });
//   } catch (err) {
//     console.error("Error fetching item details by vendor and work orders:", err);
//     res.status(500).json({
//       message: "Server error.",
//       error: err.message || "An error occurred while fetching the data.",
//     });
//   }
// };

exports.getQuotesForItemDetail = async (req, res) => {
  try {
    const { itemDetailId } = req.params;
    if (!itemDetailId || !mongoose.Types.ObjectId.isValid(itemDetailId)) {
      return res.status(400).json({
        message: "Valid ItemDetail ID is required.",
      });
    }
    const fetchedItemDetail = await ItemDetail.findById(itemDetailId).populate(
      "work_order_quotes.vendor"
    );

    if (!fetchedItemDetail) {
      return res.status(404).json({
        message: "ItemDetail not found.",
      });
    }
    res.status(200).json({
      message: "ItemDetail quotes fetched successfully.",
      data: fetchedItemDetail.work_order_quotes,
    });
  } catch (err) {
    console.error("Error fetching quotes for item detail:", err);
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while fetching the quotes.",
    });
  }
};

exports.getSalesContractById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid sales contract ID." });
    }
    const salesContract = await SalesContract.findById(id)
      .populate("techquoteId")
      .populate("workOrderquoteId")
      .populate("vendorId")
      .populate("orderId");

    if (!salesContract) {
      return res.status(404).json({ message: "Sales contract not found." });
    }
    res.status(200).json({
      message: "Sales contract fetched successfully.",
      data: salesContract,
    });
  } catch (err) {
    console.error("Error fetching sales contract:", err);
    res.status(500).json({
      message: "An error occurred while fetching the sales contract.",
      error: err.message || "Server error.",
    });
  }
};

exports.getPendingSalesContract = async (_req, res) => {
  try {
    const salesContracts = await SalesContract.find({
      "quoteId.work_order_quotes.status": "pending",
    })
      .populate("quoteId")
      .populate("vendorId");

    const filteredContracts = salesContracts.filter((contract) =>
      contract.quoteId.tech_pack_quote.some(
        (quote) => quote.status === "pending"
      )
    );

    res.status(200).json({
      message: "Sales contracts with pending tech pack retrieved successfully",
      data: filteredContracts,
    });
  } catch (err) {
    console.error(
      "Error fetching sales contracts with pending tech pack:",
      err
    );
    res.status(500).json({
      message: "Server error",
      error:
        err.message || "An error occurred while fetching the sales contracts",
    });
  }
};

// -----------------------------------------------------------------------
exports.getItemDetailsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    const workOrders = await WorkOrder
      .find({ vendor: vendorObjectId })
      .select("_id");

    if (!workOrders.length) {
      return res
        .status(404)
        .json({ message: "No work orders found for this vendor." });
    }

    const workOrderIds = workOrders.map((wo) => wo._id);
    const itemDetails = await ItemDetail.find({
      workOrder_Id: { $in: workOrderIds },
      "work_order_quotes.status": "pending",
    })
      .populate({
        path: "workOrder_Id",
        populate: {
          path: "pictures",
          model: "Picture",
          select: "imageName imageTitle category imageUrl active",
        },
      })
      .populate("client_Id")
      .populate("color_Id")
      .populate({
        path: "work_order_quotes.vendor",
        model: "Vendor",
        select: "name email picture",
      });

    if (!itemDetails.length) {
      return res.status(404).json({
        message: "No pending item details found for this vendor.",
      });
    }

    res.status(200).json({
      message: "Item details fetched successfully.",
      data: itemDetails,
    });
  } catch (err) {
    console.error("Error fetching item details:", err);
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while processing the request.",
    });
  }
};

// ------------------------------------------------------------------------
const generateUniqueContractNo = async () => {
  try {
    const lastContract = await SalesContract.aggregate([
      {
        $match: { contractNo: /^SC-\d+$/ }, // Ensure correct format
      },
      {
        $project: {
          numericId: {
            $toInt: {
              $arrayElemAt: [{ $split: ["$contractNo", "-"] }, 1],
            },
          },
        },
      },
      {
        $sort: { numericId: -1 }, // Sort numerically in descending order
      },
      { $limit: 1 }, // Get the latest one
    ]).exec();

    let newCounter = 0; // Start from 0 if no previous contract exists
    if (lastContract.length > 0) {
      newCounter = lastContract[0].numericId + 1; // Increment correctly
    }
    return `SC-${newCounter}`;
  } catch (error) {
    throw new Error(
      "Error generating unique contract number: " + error.message
    );
  }
};

exports.createSalesContract = async (req, res) => {
  try {
    const {
      workOrderquoteId,
      vendorId,
      orderId,
      styleNo,
      orderDateCreated,
      FOBPort,
      vendorCompanyName,
      bankName,
      swiftCode,
      accountNumber,
      bankAddress,
      vendorBeneficiaryAddress,
    } = req.body;

    if (!vendorId || !workOrderquoteId) {
      return res.status(400).json({
        message: "vendorId, workOrderquoteId,  are required.",
      });
    }

    // Generate unique contractNo
    const contractNo = await generateUniqueContractNo();

    const newSalesContract = new SalesContract({
      contractNo,
      contractDate: new Date(),
      workOrderquoteId,
      vendorId,
      orderId,
      styleNo,
      orderDateCreated,
      FOBPort,
      vendorCompanyName,
      bankName,
      swiftCode,
      accountNumber,
      bankAddress,
      vendorBeneficiaryAddress,
    });

    await newSalesContract.save();
    await ItemDetail.updateMany(
      { _id: { $in: workOrderquoteId } },
      { $set: { "work_order_quotes.0.status": "approved" } }
    );

    // Respond with the newly created sales contract
    res.status(201).json({
      message: "Sales contract created successfully.",
      data: newSalesContract,
    });
  } catch (err) {
    console.error("Error creating sales contract:", err);
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while processing the request.",
    });
  }
};

exports.getSalesContractById = async (req, res) => {
  try {
    const { contractId } = req.params; // contractId is the _id of the sales contract

    if (!contractId) {
      return res.status(400).json({ message: "Contract ID is required." });
    }
    const salesContract = await SalesContract.findById(contractId)
      // // .populate('workOrderquoteId')

      .populate({
        path: "workOrderquoteId",
        match: { status: "approved" },
      })
      .populate("vendorId")
      .populate("orderId");

    if (!salesContract) {
      return res.status(404).json({ message: "Sales contract not found." });
    }

    res.status(200).json({
      message: "Sales contract fetched successfully.",
      data: salesContract,
    });
  } catch (err) {
    console.error("Error fetching sales contract:", err);
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while processing the request.",
    });
  }
};

// exports.getAllSalesContracts = async (req, res) => {
//   try {
//     const salesContracts = await SalesContract.find()
//       .populate('workOrderquoteId')
//       .populate('vendorId')
//       .populate('orderId')
//       .populate({
//         path: ' ',
//         populate: [
//           {
//             path: 'work_order_quotes.vendor',
//           },
//           {
//             path: 'workOrder_Id',
//           },
//         ],
//       });
//     if (!salesContracts || salesContracts.length === 0) {
//       return res.status(404).json({ message: 'No sales contracts found.' });
//     }

//     res.status(200).json({
//       message: 'Sales contracts fetched successfully.',
//       data: salesContracts,
//     });
//   } catch (err) {
//     console.error('Error fetching sales contracts:', err);
//     res.status(500).json({
//       message: 'Server error.',
//       error: err.message || 'An error occurred while processing the request.',
//     });
//   }
// };

// exports.getAllSalesContracts = async (req, res) => {
//   try {
//     const searchQuery = req.query.search || '';
//     const regex = new RegExp(searchQuery, 'i');

//     console.log('Search term:', searchQuery);
//     console.log('Regex:', regex);

//     // Query sales contracts and populate the necessary fields
//     const salesContracts = await SalesContract.find()
//       .populate('workOrderquoteId')
//       .populate('vendorId')
//       .populate('orderId')
//       .populate({
//         path: 'workOrderquoteId',
//         populate: [
//           { path: 'work_order_quotes.vendor', match: { 'name': { $regex: regex } } }, // Search in vendor name
//           { path: 'workOrder_Id' }
//         ]
//       })
//       .lean();

//  // Filter out contracts where no matching contractNo or vendor name was found
//     const filteredContracts = salesContracts.filter(contract => {
//       // Check if contractNo matches or any of the work_order_quotes have a matching vendor name
//       const contractNoMatch = contract.contractNo && contract.contractNo.match(regex);

//       // Check if any of the work_order_quotes have a matching vendor name
//       const vendorMatch = contract.workOrderquoteId.some(workOrder => {
//         return workOrder.work_order_quotes.some(quote => {
//           return quote.vendor && quote.vendor.name && quote.vendor.name.match(regex);
//         });
//       });

//       return contractNoMatch || vendorMatch; // Return true if either contractNo or vendor name matches
//     });

//     // If no contracts are found
//     if (!filteredContracts || filteredContracts.length === 0) {
//       return res.status(404).json({ message: 'No sales contracts found.' });
//     }

//     // Respond with the filtered contracts
//     res.status(200).json({
//       message: 'Sales contracts fetched successfully.',
//       data: filteredContracts,
//     });
//   } catch (err) {
//     console.error('Error fetching sales contracts:', err);
//     res.status(500).json({
//       message: 'Server error.',
//       error: err.message || 'An error occurred while processing the request.',
//     });
//   }
// };
exports.getAllSalesContracts = async (req, res) => {
  try {
    const { vendorName, search } = req.query;

    // Build the base query with population
    let query = SalesContract.find()
      .populate({
        path: "vendorId",
        match: vendorName ? { name: new RegExp(vendorName, "i") } : {},
        select: "name", // Only fetch the name field for vendor
      })
      .populate("workOrderquoteId")
      .populate("orderId")
      .lean();

    // Apply search filter if search term is provided
    if (search) {
      const searchRegex = new RegExp(search, "i");

      // We need to filter after population since some fields are in referenced documents
      let contracts = await query;

      contracts = contracts.filter((contract) => {
        // Skip contracts where vendor didn't match the vendorName filter
        if (vendorName && (!contract.vendorId || !contract.vendorId.name)) {
          return false;
        }

        // Check contract fields
        const contractNoMatch =
          contract.contractNo && contract.contractNo.match(searchRegex);
        const styleNoMatch =
          contract.styleNo && contract.styleNo.match(searchRegex);
        const fobPortMatch =
          contract.FOBPort && contract.FOBPort.match(searchRegex);
        const vendorCompanyMatch =
          contract.vendorCompanyName &&
          contract.vendorCompanyName.match(searchRegex);

        // Check work order fields
        const workOrderMatch =
          contract.workOrderquoteId &&
          contract.workOrderquoteId.some((workOrder) => {
            return (
              workOrder.style_number &&
              workOrder.style_number.match(searchRegex)
            );
          });

        // Check vendor name (already filtered by population match, but included in search)
        const vendorMatch =
          contract.vendorId &&
          contract.vendorId.name &&
          contract.vendorId.name.match(searchRegex);

        return (
          contractNoMatch ||
          styleNoMatch ||
          fobPortMatch ||
          vendorCompanyMatch ||
          workOrderMatch ||
          vendorMatch
        );
      });

      // If no contracts are found
      if (!contracts || contracts.length === 0) {
        return res.status(404).json({
          message: "No sales contracts found matching your criteria.",
        });
      }

      return res.status(200).json({
        message: "Sales contracts fetched successfully.",
        data: contracts,
      });
    }

    // If no search term, just apply vendor filter via population
    const contracts = await query;

    // Filter out contracts where vendor didn't match (due to population match)
    const filteredContracts = contracts.filter(
      (contract) => !vendorName || (contract.vendorId && contract.vendorId.name)
    );

    if (!filteredContracts || filteredContracts.length === 0) {
      return res.status(404).json({
        message: "No sales contracts found for the specified vendor.",
      });
    }

    res.status(200).json({
      message: "Sales contracts fetched successfully.",
      data: filteredContracts,
    });
  } catch (err) {
    console.error("Error fetching sales contracts:", err);
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while processing the request.",
    });
  }
};

exports.updateSalesContract = async (req, res) => {
  try {
    const { contractId } = req.params; // contractId is now the _id
    const updateData = req.body;

    if (!contractId) {
      return res.status(400).json({ message: "Contract ID is required." });
    }
    const updatedContract = await SalesContract.findByIdAndUpdate(
      contractId,
      { $set: updateData },
      { new: true }
    );
    if (!updatedContract) {
      console.log(`No Sales contract found with _id: ${contractId}`);
      return res.status(404).json({ message: "Sales contract not found." });
    }
    res.status(200).json({
      message: "Sales contract updated successfully.",
      data: updatedContract,
    });
  } catch (err) {
    console.error("Error updating sales contract:", err);
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while processing the request.",
    });
  }
};

exports.generatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    // Fetch the work order details from the database
    const workOrderData = await WorkOrder
      .findById(id)
      .populate("vendor")
      .populate("categories")
      .populate("itemType")
      .populate("subCategories")
      .populate("trim_id")
      .populate({
        path: "rivetImages.image",
        model: "Picture",
      })
      .populate("pictures")
      .populate({
        path: "buttonImages.image",
        model: "Picture",
      })
      .populate({
        path: "trimImages.image",
        model: "Picture",
      });

    if (!workOrderData) {
      return res.status(404).json({ message: "Work Order not found" });
    }

    const itemDetails = await ItemDetail.find({ workOrder_Id: id })
      .populate("client_Id")
      .populate("color_Id")
      .populate("class_Id");

    console.log(itemDetails);

    // Handle style details (check if styleDetails exists and has data)
    const styleDetails = await StyleDetail.find({ workOrder_Id: id });
    const styleDetailsID = styleDetails.length > 0 ? styleDetails[0]._id : null;

    // Handle wash details (check if washDetails exists and has data)
    const washDetails = await WashDetail.find({ workOrder_Id: id });
    const washDetailsID = washDetails.length > 0 ? washDetails[0]._id : null;

    const sampleRequests = await SampleRequest.find({ workOrder_Id: id });

    let style_new_details = [];
    if (styleDetailsID) {
      style_new_details = await NewDetail.find({
        workOrder_Id: id,
        style_detail_id: styleDetailsID,
      }).populate("pic");
    }

    let wash_new_details = [];
    if (washDetailsID) {
      wash_new_details = await NewDetail.find({
        workOrder_Id: id,
        wash_detail_id: washDetailsID,
      }).populate("pic");
    }

    const responseData = {
      work_order_details: workOrderData || null,
      item_details: itemDetails || [],
      style_details: styleDetails || [],
      style_new_details: style_new_details || [],
      wash_details: washDetails || [],
      wash_new_details: wash_new_details || [],
      sample_request: sampleRequests || [],
    };

    res.status(200).json({ data: responseData });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// -------------------------------------------------
// exports.getWorkOrderFullDetails = async (req, res) => {
//   try {
//     const { workOrderId } = req.body;

//     const WorkOrder = await workOrder.findById(workOrderId).lean();
//     if (!WorkOrder) {
//       return res.status(404).json({ message: "Work Order not found" });
//     }
//     const sampleRequests = await SampleRequest.find({ workOrder_Id: workOrderId });
//     const washDetails = await WashDetail.find({ workOrder_Id: workOrderId }).lean();
//     const styleDetails = await StyleDetail.find({ workOrder_Id: workOrderId }).lean();

//     for (let washDetail of washDetails) {
//       washDetail.newDetails = await NewDetail.find({ wash_detail_id: washDetail._id });
//     }

//     for (let styleDetail of styleDetails) {
//       styleDetail.newDetails = await NewDetail.find({ style_detail_id: styleDetail._id });
//     }

//     res.status(200).json({
//       message: "Work Order full details fetched successfully",
//       WorkOrder,
//       washDetails,
//       styleDetails,
//       sampleRequests,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching Work Order details",
//       error: error.message,
//     });
//   }
// };


// exports.getWorkOrderFullDetails = async (req, res) => {
//   try {
//     const { workOrderId } = req.body;

//     // Fetch Work Order and populate references
//     const WorkOrder = await WorkOrder
//       .findById(workOrderId)
//       .populate("vendor")
//       .populate("categories")
//       .populate("itemType")
//       .populate("subCategory")
//       .populate("trim_id")
//       .populate("trimImages")
//       .populate("buttonImages")
//       .populate("rivetImages")
//       .lean();

//     if (!WorkOrder) {
//       return res.status(404).json({ message: "Work Order not found" });
//     }

//     // Fetch Sample Requests
//     const sampleRequests = await SampleRequest.find({
//       workOrder_Id: workOrderId,
//     }).lean();

//     // Fetch Wash Details and populate newDetails
//     const washDetails = await WashDetail.find({
//       workOrder_Id: workOrderId,
//     }).lean();

//     for (let washDetail of washDetails) {
//       washDetail.newDetails = await NewDetail.find({
//         wash_detail_id: washDetail._id,
//       })
//         .populate("pic") // Populating picture details
//         .lean();
//     }

//     // Fetch Style Details and populate newDetails
//     const styleDetails = await StyleDetail.find({
//       workOrder_Id: workOrderId,
//     }).lean();

//     for (let styleDetail of styleDetails) {
//       styleDetail.newDetails = await NewDetail.find({
//         style_detail_id: styleDetail._id,
//       })
//         .populate("pic") // Populating picture details
//         .lean();
//     }
//     // Fetch Item Details and populate relevant references
//     const itemDetails = await ItemDetail.find({ workOrder_Id: workOrderId })
//       .populate("client_Id")
//       .populate("class_Id")
//       .populate("color_Id")
//       .populate("size_break")
//       .populate("work_order_quotes.vendor") // Populating vendor in work_order_quotes
//       .lean();

//     const sampleSpecs = await SampleGradedSpecs.find({
//       workOrder_Id: workOrderId,
//     })
//       .populate("techpack_Id")
//       .populate("item_type_Id")
//       .populate("spec_template_Id")
//       .lean();

//     const copiedSampleGradedSpecs = await CopiedSampleGradedSpecs.find({
//       workOrder_Id: workOrderId,
//     })
//       .populate("originalSampleGradedId")
//       .populate("techpack_Id")
//       .populate("item_type_Id")
//       .populate("spec_template_Id")
//       .populate("copiedPOMs.specTemplateId")
//       .populate("realPOMs.specTemplateId")
//       .lean();

//     // Return data in the **same format** as your current response
//     res.status(200).json({
//       message: "Work Order full details fetched successfully",
//       WorkOrder,
//       washDetails,
//       styleDetails,
//       sampleRequests,
//       itemDetails,
//       sampleSpecs,
//       copiedSampleGradedSpecs,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching Work Order details",
//       error: error.message,
//     });
//   }
// };





exports.getWorkOrderFullDetails = async (req, res) => {
  try {
    const { workOrderId } = req.body;

    // Fetch Work Order and populate references
    const workOrder = await WorkOrder
      .findById(workOrderId)
      .populate("vendor")
      .populate("categories") // Changed from category to categories
      .populate("itemType")
      .populate("subCategories") // Changed from subCategory to subCategories
      .populate("trim_id")
      .populate("trimImages")
      .populate("buttonImages")
      .populate("rivetImages")
      .lean();

    if (!workOrder) {
      return res.status(404).json({ message: "Work Order not found" });
    }

    // Fetch Sample Requests
    const sampleRequests = await SampleRequest.find({
      workOrder_Id: workOrderId,
    }).lean();

    // Fetch Wash Details and populate newDetails
    const washDetails = await WashDetail.find({
      workOrder_Id: workOrderId,
    }).lean();

    for (let washDetail of washDetails) {
      washDetail.newDetails = await NewDetail.find({
        wash_detail_id: washDetail._id,
      })
        .populate("pic")
        .lean();
    }

    // Fetch Style Details and populate newDetails
    const styleDetails = await StyleDetail.find({
      workOrder_Id: workOrderId,
    }).lean();

    for (let styleDetail of styleDetails) {
      styleDetail.newDetails = await NewDetail.find({
        style_detail_id: styleDetail._id,
      })
        .populate("pic")
        .lean();
    }

    // Fetch Item Details and populate relevant references
    const itemDetails = await ItemDetail.find({ workOrder_Id: workOrderId })
      .populate("client_Id")
      .populate("class_Id")
      .populate("color_Id")
      .populate("size_break")
      .populate("work_order_quotes.vendor")
      .lean();

    const sampleSpecs = await SampleGradedSpecs.find({
      workOrder_Id: workOrderId,
    })
      .populate("techpack_Id")
      .populate("item_type_Id")
      .populate("spec_template_Id")
      .lean();

    const copiedSampleGradedSpecs = await CopiedSampleGradedSpecs.find({
      workOrder_Id: workOrderId,
    })
      .populate("originalSampleGradedId")
      .populate("techpack_Id")
      .populate("item_type_Id")
      .populate("spec_template_Id")
      .populate("copiedPOMs.specTemplateId")
      .populate("realPOMs.specTemplateId")
      .lean();

    // Format the response to maintain backward compatibility if needed
    const responseData = {
      message: "Work Order full details fetched successfully",
      WorkOrder: {
        ...workOrder,
        // For backward compatibility, you might want to include these
        category: workOrder.categories?.[0], // First category as single value
        subCategory: workOrder.subCategories?.[0] // First subCategory as single value
      },
      washDetails,
      styleDetails,
      sampleRequests,
      itemDetails,
      sampleSpecs,
      copiedSampleGradedSpecs,
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Work Order details",
      error: error.message,
    });
  }
};

exports.sendWorkOrderEmailController = async (req, res) => {
  try {
    const { workOrder_Id, emails } = req.body;

    if (!workOrder_Id) {
      return res.status(400).json({ error: "Work Order ID is required" });
    }
    let emailArray = emails;
    if (typeof emails === "string") {
      try {
        emailArray = JSON.parse(emails);
      } catch (_error) {
        return res.status(400).json({ error: "Invalid email format" });
      }
    }

    if (!emailArray || !Array.isArray(emailArray) || emailArray.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one recipient email is required" });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one PDF file is required" });
    }

    // Extract attachments from uploaded files
    const attachments = req.files.map((file) => ({
      filename: file.originalname,
      path: file.path,
    }));

    // Send email
    await sendWorkOrderEmail(workOrder_Id, emailArray, attachments);

    res.status(200).json({ message: "Work order email sent successfully" });
  } catch (error) {
    console.error("Error sending work order email:", error.message);
    res.status(500).json({ error: "Failed to send work order email" });
  }
};
