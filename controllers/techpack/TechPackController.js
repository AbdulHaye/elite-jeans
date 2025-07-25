const WorkOrder = require("../../models/workorder/WorkOrderModel");
const TechPack = require("../../models/techpack/TechPackModel");
const Vendor = require("../../models/vendor/VendorModel");
const NewDetail = require("../../models/newdetail/NewDetailModel");
const SalesContract = require("../../models/salescontract/SalesContractModel");
const { validationResult } = require("express-validator");
const SampleRequest = require("../../models/samplerequest/SampleRequestModel");
const SampleGradedSpecs = require("../../models/samplegradedspecs/SampleGradedSpecsModel");
const CopiedSampleGradedSpecs = require("../../models/copiedsamplegradedspecs/CopiedSampleGradedSpecsModel");
const ItemDetail = require("../../models/itemdetail/ItemDetailModel");
const WashDetail = require("../../models/washdetails/WashDetailModel");
const StyleDetail = require("../../models/styledetail/StyleDetailModel");

const generateUniqueWorkOrderId = async () => {
  try {
    const lastWorkOrder = await WorkOrder
      .findOne({})
      .sort({ workOrderId: -1 })
      .exec();

    let newCounter = 1;
    if (lastWorkOrder && lastWorkOrder.workOrderId) {
      const lastId = lastWorkOrder.workOrderId.split("-")[1];
      newCounter = parseInt(lastId, 10) + 1;
    }

    return `WO-${newCounter}`;
  } catch (error) {
    throw new Error("Error generating unique work order ID: " + error.message);
  }
};

const generateUniqueTechPackId = async () => {
  try {
    // Find the tech pack with the highest numeric ID
    const lastTechPack = await TechPack.findOne({
      techPackId: { $exists: true },
    })
      .sort({ techPackId: -1 }) // Sort descending to get the highest ID
      .select("techPackId") // Only fetch the techPackId field
      .lean(); // Return plain JS object for better performance

    let newCounter = 1; // Default starting number

    if (lastTechPack?.techPackId) {
      // Extract the numeric part from the ID (assuming format TP-123)
      const matches = lastTechPack.techPackId.match(/TP-(\d+)$/);

      if (matches?.[1]) {
        // Parse the number and increment by 1
        newCounter = parseInt(matches[1], 10) + 1;
      }
    }

    // Generate and verify the ID doesn't exist (race condition protection)
    let newId = `TP-${newCounter}`;
    const exists = await TechPack.exists({ techPackId: newId });

    if (exists) {
      // If by some chance it exists, find the next available
      const allIds = await TechPack.find({
        techPackId: { $regex: /^TP-\d+$/ },
      })
        .sort({ techPackId: 1 })
        .select("techPackId")
        .lean();

      let highestNumber = 0;
      allIds.forEach((doc) => {
        const num = parseInt(doc.techPackId.replace("TP-", ""), 10);
        if (num > highestNumber) highestNumber = num;
      });
      newId = `TP-${highestNumber + 1}`;
    }

    return newId;
  } catch (error) {
    console.error("Error generating tech pack ID:", error);
    // Fallback to UUID if regular generation fails
    return `TP-${Date.now()}`;
  }
};

exports.getFullDetailsByTechPack = async (req, res) => {
  try {
    const { techpack_Id } = req.body;

    if (!techpack_Id) {
      return res.status(400).json({ message: "techpackId is required" });
    }

    const techPack = await TechPack.findById(techpack_Id)
      .populate("vendor")
      .populate("categories")
      .populate("itemType")
      .populate("subCategory")
      .populate("labelTrim")
      .populate("pictures")
      .populate("buttonImages.image")
      .populate("rivetImages.image")
      .lean();

    if (!techPack) {
      return res
        .status(404)
        .json({ message: "No TechPack found for this techpackId" });
    }

    const sampleRequests = await SampleRequest.find({
      techpack_Id: techpack_Id,
    }).lean();

    // Fetch Wash Details and populate newDetails
    const washDetails = await WashDetail.find({
      techpack_Id: techpack_Id,
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
      techpack_Id: techpack_Id,
    }).lean();
    for (let styleDetail of styleDetails) {
      styleDetail.newDetails = await NewDetail.find({
        style_detail_id: styleDetail._id,
      })
        .populate("pic")
        .lean();
    }

    // Fetch Item Details and populate relevant references
    const itemDetails = await ItemDetail.find({ techpack_Id: techpack_Id })
      .populate("client_Id")
      .populate("class_Id")
      .populate("color_Id")
      .populate("size_break")
      .populate("work_order_quotes.vendor")
      .lean();

    // Fetch Sample Specs
    const sampleSpecs = await SampleGradedSpecs.find({
      techpack_Id: techpack_Id,
    })
      .populate("techpack_Id")
      .populate("item_type_Id")
      .populate("spec_template_Id")
      .lean();

    // Fetch Copied Sample Graded Specs
    const copiedSampleGradedSpecs = await CopiedSampleGradedSpecs.find({
      techpack_Id: techpack_Id,
    })
      .populate("originalSampleGradedId")
      .populate("techpack_Id")
      .populate("item_type_Id")
      .populate("spec_template_Id")
      .populate("copiedPOMs.specTemplateId")
      .populate("realPOMs.specTemplateId")
      .lean();

    // Return data
    res.status(200).json({
      message: "Work Order details fetched successfully based on techpackId",
      techPack,
      washDetails,
      styleDetails,
      sampleRequests,
      itemDetails,
      sampleSpecs,
      copiedSampleGradedSpecs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Work Order details by techpackId",
      error: error.message,
    });
  }
};

exports.CreatetechPackInWorkOrder = async (req, res) => {
  try {
    const { techPackId } = req.params;

    // Validate techPackId format
    if (!mongoose.Types.ObjectId.isValid(techPackId)) {
      return res.status(400).json({ message: "Invalid techPackId format" });
    }

    // Check if a WorkOrder already exists for this TechPack
    const existingWorkOrder = await WorkOrder.findOne({
      techpack_Id: techPackId,
    });

    if (existingWorkOrder) {
      return res.status(400).json({
        message: "WorkOrder already created for this TechPack.",
      });
    }

    // Fetch the TechPack with all necessary populated fields
    const existingTechPack = await TechPack.findById(techPackId)
      .populate([
        'vendor',
        'categories',
        'itemType',
        'subCategory',
        'labelTrim',
        'pictures',
        'buttonImages.image',
        'rivetImages.image'
      ])
      .exec();

    if (!existingTechPack) {
      return res.status(404).json({
        message: "TechPack not found with the provided techPackId.",
      });
    }

    // Validate required fields are present
    if (!existingTechPack.itemType) {
      return res.status(400).json({
        message: "Cannot create WorkOrder: TechPack is missing required itemType",
      });
    }

    // Generate a unique WorkOrder ID
    const generatedWorkOrderId = await generateUniqueWorkOrderId();
    const etd = new Date();

    // Create new WorkOrder with all required fields
    const newWorkOrder = new WorkOrder({
      workOrderId: generatedWorkOrderId,
      techpack_Id: techPackId,
      vendor: existingTechPack.vendor,
      categories: existingTechPack.categories,
      itemType: existingTechPack.itemType._id || existingTechPack.itemType, // Handle both populated and unpopulated cases
      subCategories: existingTechPack.subCategory ? [existingTechPack.subCategory] : [],
      etd,
      pictures: existingTechPack.pictures,
      buttonImages: existingTechPack.buttonImages,
      rivetImages: existingTechPack.rivetImages,
      trimImages: existingTechPack.trimImages || [],
      // Set default values for other required fields if needed
      shippingStatus: [],
      customer_po_number: [],
      sampleStatus: [],
      stylenumbers: []
    });

    await newWorkOrder.save();

    res.status(201).json({
      message: "WorkOrder created successfully from TechPack",
      data: newWorkOrder,
    });
  } catch (error) {
    console.error("Error creating WorkOrder from TechPack:", error.message);
    res.status(500).json({
      message: "Error creating WorkOrder from TechPack",
      error: error.message,
    });
  }
};

exports.getWorkOrdersByTechPack = async (req, res) => {
  try {
    const { techPackId } = req.params;

    // Validate techPackId
    if (!mongoose.Types.ObjectId.isValid(techPackId)) {
      return res.status(400).json({ message: "Invalid techPackId format" });
    }

    // Find WorkOrders that reference the given TechPack ID
    const workOrders = await WorkOrder
      .find({ techPackId })
      .populate("vendor category itemType subCategory");

    if (!workOrders.length) {
      return res
        .status(404)
        .json({ message: "No WorkOrders found for this TechPack." });
    }

    res.status(200).json({
      message: "WorkOrders fetched successfully",
      data: workOrders,
    });
  } catch (error) {
    console.error("Error fetching WorkOrders:", error.message);
    res.status(500).json({
      message: "Error fetching WorkOrders",
      error: error.message,
    });
  }
};

exports.createTechPack = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      styleId,
      vendor,
      categories,
      itemType,
      subCategory,
      setType,
      labelTrim,
      pictures,
      buttonImages,
      rivetImages,
    } = req.body;

    // Validate required fields
    if (!styleId || !vendor || !categories || !itemType || !subCategory) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate set type constraints
    if (setType === '2pc' && categories.length !== 2) {
      return res.status(400).json({ message: "2pc set requires exactly 2 categories" });
    }
    
    if (setType === '3pc' && categories.length !== 3) {
      return res.status(400).json({ message: "3pc set requires exactly 3 categories" });
    }

    // Generate ID with retry logic
    let techPackId;
    let retries = 3;

    while (retries > 0) {
      try {
        techPackId = await generateUniqueTechPackId();
        const exists = await TechPack.exists({ techPackId });
        if (!exists) break;
        retries--;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
      }
    }

    const newTechPack = new TechPack({
      techPackId,
      styleId,
      vendor,
      categories,
      itemType,
      subCategory,
      setType,
      labelTrim,
      pictures,
      buttonImages: buttonImages?.map((img) => ({
        ...img,
        color: img.color || "defaultColor",
        size: img.size || "defaultSize",
        quantity: img.quantity || 1,
        comment: img.comment || "",
      })) || [],
      rivetImages: rivetImages?.map((img) => ({
        ...img,
        color: img.color || "defaultColor",
        size: img.size || "defaultSize",
        quantity: img.quantity || 1,
        comment: img.comment || "",
      })) || [],
    });

    await newTechPack.save();

    res.status(201).json({
      message: "TechPack created successfully",
      data: newTechPack,
    });
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate TechPack ID detected",
        suggestion: "Please try again or contact support",
        generatedId: err.keyValue?.techPackId,
      });
    }

    res.status(500).json({
      message: "Server Error",
      error: "An error occurred while creating the TechPack",
    });
  }
};






// exports.getAllTechPacks = async (req, res) => {
//   try {
//     const techPacks = await TechPack.find()
//       .populate([
//         { path: 'vendor', select: 'name' },
//         { path: 'category', select: 'name' },
//         { path: 'itemType', select: 'name' },
//         { path: 'subCategory', select: 'name' },
//         { path: 'labelTrim', model: 'TrimModel', select: 'name description previewImage' },
//         { path: 'pictures', model: 'Picture', select: 'category imageUrl' },

//         {
//           path: 'buttonImages',
//           populate: { path: 'image', model: 'Picture', select: 'url color size imageUrl' },
//           select: 'color size quantity comment'
//         },

//         {
//           path: 'rivetImages',
//           populate: { path: 'image', model: 'Picture', select: 'url color size imageUrl' },
//           select: 'color size quantity comment'
//         }
//       ]);

//     if (!techPacks || techPacks.length === 0) {
//       return res.status(404).json({
//         message: 'No tech packs found',
//         data: [],
//       });
//     }

//     res.status(200).json({
//       message: 'TechPacks retrieved successfully',
//       data: techPacks,
//     });
//   } catch (err) {
//     console.error('Error fetching tech packs:', err);
//     res.status(500).json({
//       message: 'Server Error',
//       error: err.message || 'An error occurred while retrieving TechPacks',
//     });
//   }
// };

exports.getAllTechPacks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const totalTechPacks = await TechPack.countDocuments();

    const techPacks = await TechPack.find()
      .populate([
        { path: "vendor", select: "name" },
        { path: "category", select: "name" },
        { path: "itemType", select: "name" },
        { path: "subCategory", select: "name" },
        {
          path: "labelTrim",
          model: "TrimModel",
          select: "name description previewImage",
        },
        {
          path: "pictures",
          model: "Picture",
          select: "category imageUrl",
        },
        {
          path: "buttonImages",
          populate: {
            path: "image",
            model: "Picture",
            select: "url color size imageUrl",
          },
          select: "color size quantity comment",
        },
        {
          path: "rivetImages",
          populate: {
            path: "image",
            model: "Picture",
            select: "url color size imageUrl",
          },
          select: "color size quantity comment",
        },
      ])
      .skip(skip)
      .limit(limit);

    if (!techPacks || techPacks.length === 0) {
      return res.status(404).json({
        message: "No tech packs found",
        data: [],
      });
    }

    const totalPages = Math.ceil(totalTechPacks / limit);

    res.status(200).json({
      message: "TechPacks retrieved successfully",
      data: techPacks,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: totalTechPacks,
      },
    });
  } catch (err) {
    console.error("Error fetching tech packs:", err);
    res.status(500).json({
      message: "Server Error",
      error: err.message || "An error occurred while retrieving TechPacks",
    });
  }
};

exports.getTechPackById = async (req, res) => {
  try {
    console.log("Fetching TechPack with ID:", req.params.id);
    const { id } = req.params;
    const techPack = await TechPack.findById(id)
      .populate("pictures")
      .populate({
        path: "buttonImages.image",
        model: "Picture",
      })
      .populate("vendor")
      .populate("categories") // Changed from "category" to "categories"
      .populate("itemType")
      .populate("subCategory")
      .populate("labelTrim")
      .populate({
        path: "rivetImages.image",
        model: "Picture",
      });
    
    if (!techPack) {
      return res.status(404).json({
        message: "TechPack not found",
        data: null,
      });
    }

    res.status(200).json({
      message: "TechPack retrieved successfully",
      data: techPack,
    });
  } catch (err) {
    console.error("Error fetching tech pack by ID:", err);
    res.status(500).json({
      message: "Server Error",
      error: err.message || "An error occurred while retrieving the TechPack",
    });
  }
};

exports.updateTechPack = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const techPack = await TechPack.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "TechPack updated successfully",
      data: techPack,
    });
  } catch (err) {
    console.error("Error updating tech pack by ID:", err);
    res.status(500).json({
      message: "Server Error",
      error: err.message || "An error occurred while updating the TechPack",
    });
  }
};

const mongoose = require("mongoose");

exports.deleteTechPack = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ID format",
      });
    }

    const deletedTechPack = await TechPack.findByIdAndDelete(id);

    if (!deletedTechPack) {
      return res.status(404).json({
        message: "TechPack not found",
      });
    }

    return res.status(200).json({
      message: "TechPack deleted successfully",
      data: deletedTechPack,
    });
  } catch (err) {
    console.error("Error deleting tech pack by ID:", err);
    return res.status(500).json({
      message: "Server Error",
      error: err.message || "An error occurred while deleting the TechPack",
    });
  }
};

exports.getTechPacksByVendor = async (req, res) => {
  const { vendorId } = req.params;

  try {
    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    const techPacks = await TechPack.find({ vendor: vendorId })
      .populate("vendor")
      .populate("categories")
      .populate("itemType")
      .populate("subCategory")
      .populate("labelTrim")
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
exports.addTechPackQuote = async (req, res) => {
  try {
    const { techPackId, price, fabric, notes, vendor, status } = req.body;

    // Validate required fields
    if (!techPackId || !price || !fabric || !vendor) {
      return res.status(400).json({
        message: "TechPack ID, price, fabric, and vendor are required",
      });
    }

    // Validate vendor
    const vendorDetails = await Vendor.findById(vendor);
    if (!vendorDetails) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    // Fetch and validate TechPack
    const techPack = await TechPack.findById(techPackId).populate(
      "tech_pack_quote.vendor"
    );
    if (!techPack) {
      return res.status(404).json({
        message: "TechPack not found",
      });
    }

    // Create a new quote
    const newQuote = {
      price,
      date: new Date(),
      fabric,
      notes: notes || "",
      vendor,
      status: status || "pending", // Default status is 'pending'
    };

    // Push the new quote into the `tech_pack_quote` array
    techPack.tech_pack_quote.push(newQuote);

    // Save the updated TechPack
    await techPack.save();

    // Success response
    res.status(200).json({
      message: "Quote added to TechPack successfully",
      data: techPack,
    });
  } catch (err) {
    console.error("Error adding tech pack quote:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || "An error occurred while adding the quote",
    });
  }
};

//  New API for vendors to view their own techpacks
exports.getVendorTechPacks = async (req, res) => {
  try {
    // Check if user is vendor
    if (!req.user || req.user.type !== "vendor") {
      return res.status(403).json({
        message: "Access denied. Only vendors can access this route.",
      });
    }
    // Fetch vendor IDs from token
    const vendorIds = req.user.vendor;
    if (!vendorIds || vendorIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No vendors assigned to your account." });
    }
    // Find techpacks that belong to any of the vendor IDs
    const techPacks = await TechPack.find({ vendor: { $in: vendorIds } })
      .populate("vendor")
      .populate("categories")
      .populate("itemType")
      .populate("subCategory")
      .populate("labelTrim")
      .populate("pictures")
      .populate("buttonImages.image")
      .populate("rivetImages.image");
    if (!techPacks || techPacks.length === 0) {
      return res
        .status(404)
        .json({ message: "No tech packs found for your vendors." });
    }
    res.status(200).json(techPacks);
  } catch (error) {
    console.error("Error fetching vendor tech packs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// exports.addTechPackQuote = async (req, res) => {
//   try {
//     const { techPackId, price, fabric, notes, vendor, status} = req.body;

//     if (!techPackId || !price || !fabric || !vendor) {
//       return res.status(400).json({ message: 'TechPack ID, price, fabric, and vendor are required' });
//     }

//     const vendorDetails = await Vendor.findById(vendor);
//     if (!vendorDetails) {
//       return res.status(404).json({ message: 'Vendor not found' });
//     }

//     const techPack = await TechPack.findById(techPackId).populate('tech_pack_quote.vendor');
//     if (!techPack) {
//       return res.status(404).json({ message: 'TechPack not found' });
//     }

//     const newQuote = {
//       price,
//       date: new Date(),
//       fabric,
//       notes: notes || '',
//       vendor,
//       status
//     };
//     techPack.tech_pack_quote.push(newQuote);
//     await techPack.save();

//     const contractId = await SalesContract.countDocuments() + 1;

//     const salesContract = new SalesContract({
//       contractId,
//       contractDate: new Date(),
//       quoteId: techPack._id,
//       vendorId: vendor,
//     });

//     await salesContract.save();

//       res.status(200).json({
//       message: 'Quote and associated sales contract added successfully',
//       data: {
//          techPack,
//         salesContract,
//       },
//     });
//   } catch (err) {
//     console.error('Error adding tech pack quote:', err);
//     res.status(500).json({
//       message: 'Server error',
//       error: err.message || 'An error occurred while adding the quote',
//     });
//   }
// };

exports.getTechPackQuotes = async (req, res) => {
  try {
    const { techPackId } = req.params;

    if (!techPackId) {
      return res.status(400).json({ message: "TechPack ID is required" });
    }

    const techPack = await TechPack.findById(techPackId).populate(
      "tech_pack_quote.vendor"
    );

    if (!techPack) {
      return res.status(404).json({ message: "TechPack not found" });
    }

    res.status(200).json({
      message: "TechPack quotes retrieved successfully",
      data: techPack.tech_pack_quote,
    });
  } catch (err) {
    console.error("Error fetching tech pack quotes:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || "An error occurred while retrieving the quotes",
    });
  }
};

exports.updateTechPackQuote = async (req, res) => {
  try {
    const { techPackId, quoteIndex } = req.params;
    const { price, fabric, notes, vendor, status } = req.body;

    if (!techPackId || !quoteIndex || !price || !fabric || !vendor) {
      return res.status(400).json({
        message:
          "TechPack ID, quote index, price, fabric, and vendor are required",
      });
    }
    const vendorDetails = await Vendor.findById(vendor);
    if (!vendorDetails) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const techPack = await TechPack.findById(techPackId);

    if (!techPack) {
      return res.status(404).json({ message: "TechPack not found" });
    }

    if (quoteIndex < 0 || quoteIndex >= techPack.tech_pack_quote.length) {
      return res.status(400).json({ message: "Invalid quote index" });
    }
    techPack.tech_pack_quote[quoteIndex] = {
      price,
      date: new Date(),
      fabric,
      notes: notes || "",
      vendor,
      status,
    };

    await techPack.save();

    res.status(200).json({
      message: "Quote updated successfully",
      data: techPack,
    });
  } catch (err) {
    console.error("Error updating tech pack quote:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || "An error occurred while updating the quote",
    });
  }
};

exports.deleteTechPackQuote = async (req, res) => {
  try {
    const { techPackId, quoteIndex } = req.params;

    if (!techPackId || !quoteIndex) {
      return res
        .status(400)
        .json({ message: "TechPack ID and quote index are required" });
    }
    const techPack = await TechPack.findById(techPackId);

    if (!techPack) {
      return res.status(404).json({ message: "TechPack not found" });
    }
    if (quoteIndex < 0 || quoteIndex >= techPack.tech_pack_quote.length) {
      return res.status(400).json({ message: "Invalid quote index" });
    }
    techPack.tech_pack_quote.splice(quoteIndex, 1);
    await techPack.save();

    res.status(200).json({
      message: "Quote deleted successfully",
      data: techPack,
    });
  } catch (err) {
    console.error("Error deleting tech pack quote:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || "An error occurred while deleting the quote",
    });
  }
};
// exports.getAllQuotes = async (req, res) => {
//   try {
//     const techPacks = await TechPack.find().populate('tech_pack_quote.vendor');

//     if (!techPacks || techPacks.length === 0) {
//       return res.status(404).json({ message: 'No tech packs found' });
//     }

//     res.status(200).json({
//       message: 'Tech packs and quotes retrieved successfully',
//       data: techPacks,
//     });
//   } catch (err) {
//     console.error('Error retrieving tech packs and quotes:', err);
//     res.status(500).json({
//       message: 'Server Error',
//       error: err.message || 'An error occurred while retrieving the quotes',
//     });
//   }
// };

exports.getSalesContracts = async (_req, res) => {
  try {
    const salesContracts = await SalesContract.find()
      .populate("quoteId")
      .populate("vendorId");

    res.status(200).json({
      message: "Sales contracts retrieved successfully",
      data: salesContracts,
    });
  } catch (err) {
    console.error("Error fetching sales contracts:", err);
    res.status(500).json({
      message: "Server error",
      error:
        err.message || "An error occurred while fetching the sales contracts",
    });
  }
};

exports.getTechPackInSalesContract = async (_req, res) => {
  try {
    const salesContracts = await SalesContract.find({
      "quoteId.tech_pack_quote.status": "pending",
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

exports.updateTechPackQuoteByIndex = async (req, res) => {
  const { contractId, index } = req.params;

  try {
    const salesContract =
      await SalesContract.findById(contractId).populate("quoteId");

    if (!salesContract) {
      return res.status(404).json({
        message: "Sales contract not found",
      });
    }
    const techPackQuotes = salesContract.quoteId.tech_pack_quote;
    if (!techPackQuotes || techPackQuotes.length <= index || index < 0) {
      return res.status(404).json({
        message: "Tech pack quote not found at the given index",
      });
    }

    if (techPackQuotes[index].status === "pending") {
      techPackQuotes[index].status = "approved";
    } else {
      return res.status(400).json({
        message: "The selected quote is not in a pending state",
      });
    }

    await salesContract.save();

    res.status(200).json({
      message: "Tech pack quote status updated successfully",
      data: salesContract,
    });
  } catch (err) {
    console.error("Error updating tech pack quote by index:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || "An error occurred while updating the status",
    });
  }
};
// --------------------------------------------------------------------

// exports.getFilteredTechPacks = async (req, res) => {
//   try {
//     const {
//       techPackId,
//       vendor,
//       category,
//       itemType,
//       subCategory,
//       styleId,
//       lastUpdatedFrom,
//       lastUpdatedTo
//     } = req.query;

//     const filter = {};
//     if (techPackId) filter.techPackId=techPackId;
//     if (vendor) filter.vendor = vendor;
//     if (category) filter.category = category;
//     if (itemType) filter.itemType = itemType;
//     if (subCategory) filter.subCategory = subCategory;
//     if (styleId) filter.styleId = styleId;

//     if (lastUpdatedFrom || lastUpdatedTo) {
//       filter.lastUpdated = {};
//       if (lastUpdatedFrom) filter.lastUpdated.$gte = new Date(lastUpdatedFrom);
//       if (lastUpdatedTo) filter.lastUpdated.$lte = new Date(lastUpdatedTo);
//     }
//     const techPacks = await TechPack.find(filter)
//       .populate("vendor category itemType subCategory labelTrim pictures buttonImages.image rivetImages.image")
//       .sort({ lastUpdated: -1 });

//     res.status(200).json({
//       message: "Filtered TechPacks fetched successfully",
//       data: techPacks
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching TechPacks", error: error.message });
//   }
// };

const Category = require("../../models/category/CategoryModel"); // Ensure you import Category model
const ItemType = require("../../models/itemtype/ItemTypeModel");
const SubCategory = require("../../models/subcategory/SubCategoryModel");
const CopiedSpecTemPoms = require("../../models/copiedspecstemplatepom/CopiedSpecsTemplatePomModel");

exports.getFilteredTechPacks = async (req, res) => {
  try {
    const {
      techPackId,
      vendor,
      categories,  // Changed from category to categories
      itemType,
      subCategory,
      styleId,
      lastUpdatedFrom,
      lastUpdatedTo,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // Apply filters based on query parameters
    if (vendor && mongoose.Types.ObjectId.isValid(vendor))
      filter.vendor = vendor;
    if (categories && mongoose.Types.ObjectId.isValid(categories))  // Changed
      filter.categories = categories;  // Changed
    if (itemType && mongoose.Types.ObjectId.isValid(itemType))
      filter.itemType = itemType;
    if (subCategory && mongoose.Types.ObjectId.isValid(subCategory))
      filter.subCategory = subCategory;
    if (techPackId) filter.techPackId = techPackId;
    if (styleId) filter.styleId = styleId;

    // Filter based on the 'lastUpdated' range (if provided)
    if (lastUpdatedFrom || lastUpdatedTo) {
      filter.lastUpdated = {};
      if (lastUpdatedFrom) filter.lastUpdated.$gte = new Date(lastUpdatedFrom);
      if (lastUpdatedTo) filter.lastUpdated.$lte = new Date(lastUpdatedTo);
    }

    // If a search term is provided, apply a regex search for multiple fields
    if (search) {
      const regex = new RegExp(search, "i");

      // Search in various fields and get matching IDs
      const matchingCategories = await Category.find({
        name: regex,
      }).select("_id");
      const matchingVendors = await Vendor.find({ name: regex }).select("_id");
      const matchingItemTypes = await ItemType.find({
        name: regex,
      }).select("_id");
      const matchingSubCategories = await SubCategory.find({
        name: regex,
      }).select("_id");

      const categoryIds = matchingCategories.map((cat) => cat._id);
      const vendorIds = matchingVendors.map((vendor) => vendor._id);
      const itemTypeIds = matchingItemTypes.map((type) => type._id);
      const subCategoryIds = matchingSubCategories.map((sub) => sub._id);

      // Add filter conditions for all fields
      filter.$or = [
        { techPackId: regex },
        { styleId: regex },
        { categories: { $in: categoryIds } },  // Changed
        { vendor: { $in: vendorIds } },
        { itemType: { $in: itemTypeIds } },
        { subCategory: { $in: subCategoryIds } },
      ];

      // Apply fuzzy matching for 'lastUpdated' field (date)
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (datePattern.test(search)) {
        const searchDate = new Date(search);
        const randomOffset = Math.floor(Math.random() * 15) - 7;
        const fuzzyDate = new Date(searchDate);
        fuzzyDate.setDate(searchDate.getDate() + randomOffset);

        const fuzzyStart = new Date(fuzzyDate);
        fuzzyStart.setDate(fuzzyDate.getDate() - 1);
        const fuzzyEnd = new Date(fuzzyDate);
        fuzzyEnd.setDate(fuzzyDate.getDate() + 1);

        filter.$or.push({
          lastUpdated: {
            $gte: fuzzyStart,
            $lte: fuzzyEnd,
          },
        });
      }
    }

    // Pagination setup
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await TechPack.countDocuments(filter);

    // Fetch filtered tech packs from the database
    const techPacks = await TechPack.find(filter)
      .populate([
        "vendor",
        { path: "categories", model: "Category" },  // Changed to populate categories array
        "itemType",
        "subCategory",
        "labelTrim",
        "pictures",
        { path: "buttonImages.image", model: "Picture" },
        { path: "rivetImages.image", model: "Picture" }
      ])
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (!techPacks || techPacks.length === 0) {
      return res.status(200).json({
        message: "No data found",
        data: [],
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      });
    }

    res.status(200).json({
      message: "Filtered TechPacks fetched successfully",
      data: techPacks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching TechPacks",
      error: error.message,
    });
  }
};

exports.getAllTechPackIds = async (req, res) => {
  try {
    // Fetch only techPackId fields from all documents
    const techPackIds = await TechPack.find({}, { techPackId: 1, _id: 0 });

    // Extract just the ID strings from the results
    const ids = techPackIds.map(item => item.techPackId);

    res.status(200).json({
      message: "All TechPack IDs fetched successfully",
      data: ids
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching TechPack IDs",
      error: error.message
    });
  }
};
//correct for wash detail not style detail image

// exports.createRepeatTechPack = async (req, res) => {
//   try {
//     const { techPackId } = req.params;
//     console.log("Cloning tech pack:", techPackId);

//     // 1. Fetch and clone the main TechPack
//     const existingTechPack = await TechPack.findById(techPackId)
//       .populate("vendor category itemType subCategory labelTrim")
//       .populate({
//         path: "pictures",
//         model: "Picture",
//       })
//       .populate({
//         path: "buttonImages.image",
//         model: "Picture",
//       })
//       .populate({
//         path: "rivetImages.image",
//         model: "Picture",
//       });

//     if (!existingTechPack) {
//       return res.status(404).json({ message: "TechPack not found" });
//     }

//     // Generate a new TechPack ID
//     let attempts = 0;
//     const maxAttempts = 3;
//     let clonedTechPack;

//     while (attempts < maxAttempts) {
//       attempts++;
//       try {
//         const recentTechPacks = await TechPack.find({})
//           .sort({ $natural: -1 })
//           .limit(50)
//           .lean();

//         let maxId = 0;
//         for (const pack of recentTechPacks) {
//           const match = pack.techPackId?.match(/TP-(\d+)/);
//           if (match) {
//             const num = parseInt(match[1], 10);
//             if (num > maxId) maxId = num;
//           }
//         }

//         const newTechPackId = `TP-${maxId + 1}`;

//         // Create the cloned TechPack
//         clonedTechPack = new TechPack({
//           ...existingTechPack.toObject(),
//           _id: undefined,
//           techPackId: newTechPackId,
//           lastUpdated: Date.now(),
//           createdAt: Date.now(),
//           updatedAt: Date.now(),
//         });

//         await clonedTechPack.save();
//         break;
//       } catch (error) {
//         if (attempts >= maxAttempts) {
//           throw error;
//         }
//         await new Promise((resolve) => setTimeout(resolve, 100));
//       }
//     }

//     // 2. Clone Sample Requests
//     const sampleRequests = await SampleRequest.find({ techpack_Id: techPackId });
//     if (sampleRequests.length > 0) {
//       const sampleRequestPromises = sampleRequests.map(sampleRequest => {
//         const newSampleRequest = new SampleRequest({
//           ...sampleRequest.toObject(),
//           _id: undefined,
//           techpack_Id: clonedTechPack._id,
//           workOrder_Id: undefined // Clear WorkOrder reference if it exists
//         });
//         return newSampleRequest.save();
//       });
//       await Promise.all(sampleRequestPromises);
//     }

//     // 3. Clone Style Details and maintain mapping of old to new IDs
//     const styleDetails = await StyleDetail.find({ techpack_Id: techPackId });
//     const styleDetailMap = new Map(); // oldId -> newId
//     if (styleDetails.length > 0) {
//       const styleDetailPromises = styleDetails.map(async styleDetail => {
//         // Handle file upload if there's a sample picture
//         let samplePictureUrl = null;
//         if (styleDetail.samplePicture) {
//           // This assumes you have a way to duplicate the file in S3 or reuse the same URL
//           // If you need to actually duplicate the file, you'll need to download and re-upload
//           samplePictureUrl = styleDetail.samplePicture;
//         }

//         const newStyleDetail = new StyleDetail({
//           ...styleDetail.toObject(),
//           _id: undefined,
//           techpack_Id: clonedTechPack._id,
//           workOrder_Id: undefined, // Clear WorkOrder reference
//           samplePicture: samplePictureUrl,
//           createdAt: Date.now(),
//           updatedAt: Date.now()
//         });
        
//         const savedStyleDetail = await newStyleDetail.save();
//         styleDetailMap.set(styleDetail._id.toString(), savedStyleDetail._id);
//         return savedStyleDetail;
//       });
//       await Promise.all(styleDetailPromises);
//     }

//     // 4. Clone Wash Details and maintain mapping of old to new IDs
//     const washDetails = await WashDetail.find({ techpack_Id: techPackId });
//     const washDetailMap = new Map(); // oldId -> newId
//     if (washDetails.length > 0) {
//       const washDetailPromises = washDetails.map(async washDetail => {
//         // Handle wash picture if it exists
//         let washPictureUrl = null;
//         if (washDetail.washPicture) {
//           // Reuse the same URL or duplicate the file as needed
//           washPictureUrl = washDetail.washPicture;
//         }

//         const newWashDetail = new WashDetail({
//           ...washDetail.toObject(),
//           _id: undefined,
//           techpack_Id: clonedTechPack._id,
//           workOrder_Id: undefined, // Clear WorkOrder reference
//           washPicture: washPictureUrl,
//           createdAt: Date.now(),
//           updatedAt: Date.now()
//         });
        
//         const savedWashDetail = await newWashDetail.save();
//         washDetailMap.set(washDetail._id.toString(), savedWashDetail._id);
//         return savedWashDetail;
//       });
//       await Promise.all(washDetailPromises);
//     }

//     // 5. Clone New Details (must be done after style and wash details)
//     const newDetails = await NewDetail.find({ techpack_Id: techPackId }).populate("pic");
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
//           techpack_Id: clonedTechPack._id,
//           workOrder_Id: undefined, // Clear WorkOrder reference
//           style_detail_id: newStyleDetailId,
//           wash_detail_id: newWashDetailId,
//           createdAt: Date.now(),
//           updatedAt: Date.now()
//         }).save();
//       });
//       await Promise.all(newDetailPromises);
//     }

//     res.status(201).json({
//       message: "TechPack and all related data cloned successfully",
//       data: {
//         techPack: clonedTechPack,
//         sampleRequests: sampleRequests.length,
//         styleDetails: styleDetails.length,
//         washDetails: washDetails.length,
//         newDetails: newDetails.length
//       },
//     });
//   } catch (error) {
//     console.error("Error cloning TechPack:", error);
//     res.status(500).json({
//       message: "Error cloning TechPack and related data",
//       error: error.message,
//       stack: error.stack
//     });
//   }
// };


exports.createRepeatTechPack = async (req, res) => {
  try {
    const { techPackId } = req.params;
    console.log("Cloning tech pack:", techPackId);

    // 1. Fetch and clone the main TechPack
    const existingTechPack = await TechPack.findById(techPackId)
      .populate("vendor category itemType subCategory labelTrim")
      .populate({
        path: "pictures",
        model: "Picture",
      })
      .populate({
        path: "buttonImages.image",
        model: "Picture",
      })
      .populate({
        path: "rivetImages.image",
        model: "Picture",
      });

    if (!existingTechPack) {
      return res.status(404).json({ message: "TechPack not found" });
    }

    // Generate a new TechPack ID
    let attempts = 0;
    const maxAttempts = 3;
    let clonedTechPack;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const recentTechPacks = await TechPack.find({})
          .sort({ $natural: -1 })
          .limit(50)
          .lean();

        let maxId = 0;
        for (const pack of recentTechPacks) {
          const match = pack.techPackId?.match(/TP-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxId) maxId = num;
          }
        }

        const newTechPackId = `TP-${maxId + 1}`;

        // Create the cloned TechPack
        clonedTechPack = new TechPack({
          ...existingTechPack.toObject(),
          _id: undefined,
          techPackId: newTechPackId,
          lastUpdated: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        await clonedTechPack.save();
        break;
      } catch (error) {
        if (attempts >= maxAttempts) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // 2. Clone Sample Requests
    const sampleRequests = await SampleRequest.find({ techpack_Id: techPackId });
    if (sampleRequests.length > 0) {
      const sampleRequestPromises = sampleRequests.map(sampleRequest => {
        const newSampleRequest = new SampleRequest({
          ...sampleRequest.toObject(),
          _id: undefined,
          techpack_Id: clonedTechPack._id,
          workOrder_Id: undefined
        });
        return newSampleRequest.save();
      });
      await Promise.all(sampleRequestPromises);
    }

    // 3. Clone Style Details and maintain mapping of old to new IDs
    const styleDetails = await StyleDetail.find({ techpack_Id: techPackId });
    const styleDetailMap = new Map(); // oldId -> newId
    if (styleDetails.length > 0) {
      const styleDetailPromises = styleDetails.map(async styleDetail => {
        // Clone sample picture if it exists
        let samplePictureUrl = null;
        if (styleDetail.samplePicture) {
          // If you need to actually duplicate the file in storage:
          // samplePictureUrl = await duplicateFileInStorage(styleDetail.samplePicture);
          // Otherwise, just reuse the same URL:
          samplePictureUrl = styleDetail.samplePicture;
        }

        const newStyleDetail = new StyleDetail({
          ...styleDetail.toObject(),
          _id: undefined,
          techpack_Id: clonedTechPack._id,
          workOrder_Id: undefined,
          samplePicture: samplePictureUrl,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        
        const savedStyleDetail = await newStyleDetail.save();
        styleDetailMap.set(styleDetail._id.toString(), savedStyleDetail._id);
        return savedStyleDetail;
      });
      await Promise.all(styleDetailPromises);
    }

    // 4. Clone Wash Details and maintain mapping of old to new IDs
    const washDetails = await WashDetail.find({ techpack_Id: techPackId });
    const washDetailMap = new Map(); // oldId -> newId
    if (washDetails.length > 0) {
      const washDetailPromises = washDetails.map(async washDetail => {
        // Clone wash picture if it exists
        let washPictureUrl = null;
        if (washDetail.washPicture) {
          // Same as above - duplicate or reuse the file
          washPictureUrl = washDetail.washPicture;
        }

        // Map the old style_detail_id to the new one if it exists
        const newStyleDetailId = washDetail.style_detail_id 
          ? styleDetailMap.get(washDetail.style_detail_id.toString()) 
          : undefined;

        const newWashDetail = new WashDetail({
          ...washDetail.toObject(),
          _id: undefined,
          techpack_Id: clonedTechPack._id,
          workOrder_Id: undefined,
          washPicture: washPictureUrl,
          style_detail_id: newStyleDetailId,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        
        const savedWashDetail = await newWashDetail.save();
        washDetailMap.set(washDetail._id.toString(), savedWashDetail._id);
        return savedWashDetail;
      });
      await Promise.all(washDetailPromises);
    }

    // 5. Clone New Details (must be done after style and wash details)
    const newDetails = await NewDetail.find({ techpack_Id: techPackId }).populate("pic");
    if (newDetails.length > 0) {
      const newDetailPromises = newDetails.map(async newDetail => {
        // Map the old style_detail_id to the new one if it exists
        const newStyleDetailId = newDetail.style_detail_id 
          ? styleDetailMap.get(newDetail.style_detail_id.toString()) 
          : undefined;
        
        // Map the old wash_detail_id to the new one if it exists
        const newWashDetailId = newDetail.wash_detail_id 
          ? washDetailMap.get(newDetail.wash_detail_id.toString()) 
          : undefined;

        // Clone the picture reference if it exists
        let clonedPic = null;
        if (newDetail.pic) {
          // If pic is a reference to another document that needs cloning:
          // clonedPic = await clonePictureDocument(newDetail.pic);
          // Otherwise, just reuse the same reference:
          clonedPic = newDetail.pic;
        }

        const newNewDetail = new NewDetail({
          ...newDetail.toObject(),
          _id: undefined,
          techpack_Id: clonedTechPack._id,
          workOrder_Id: undefined,
          style_detail_id: newStyleDetailId,
          wash_detail_id: newWashDetailId,
          pic: clonedPic,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        
        return await newNewDetail.save();
      });
      await Promise.all(newDetailPromises);
    }

 // 6. Clone Sample Graded Specs and their POMs
    const sampleGradedSpecsList = await SampleGradedSpecs.find({
      techpack_Id: techPackId
    })
    .populate("spec_template_Id");

    if (sampleGradedSpecsList.length > 0) {
      for (const originalSpec of sampleGradedSpecsList) {
        // Create new SampleGradedSpecs
        const newSpec = new SampleGradedSpecs({
          ...originalSpec.toObject(),
          _id: undefined,
          techpack_Id: clonedTechPack._id,
          workOrder_Id: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        const savedSpec = await newSpec.save();

        // Get all POMs for the original spec
        const originalPoms = await CopiedSpecTemPoms.find({
          sampleGradedSpecsId: originalSpec._id
        }).populate("specTemplateId");

        // Clone each POM
        for (const originalPom of originalPoms) {
          const { specTemplateId } = originalPom;
          
          // Create the POM data structure
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
            techpack_Id: clonedTechPack._id
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


    res.status(201).json({
      message: "TechPack and all related data cloned successfully",
      data: {
        techPack: clonedTechPack,
        sampleRequests: sampleRequests.length,
        styleDetails: styleDetails.length,
        washDetails: washDetails.length,
        newDetails: newDetails.length
      },
    });
  } catch (error) {
    console.error("Error cloning TechPack:", error);
    res.status(500).json({
      message: "Error cloning TechPack and related data",
      error: error.message,
      stack: error.stack
    });
  }
};

exports.generateTechPackPDF = async (req, res) => {
  try {
    const { techpackId } = req.params;

    // Fetch TechPack Data
    const techPackData = await TechPack.findById(techpackId);
    if (!techPackData) {
      return res.status(404).json({ message: "TechPack not found" });
    }

    // Fetch Related Data
    const sampleRequests = await SampleRequest.find({ techpackId });
    const washDetails = await WashDetail.find({ techpackId });
    const styleDetails = await StyleDetail.find({ techpackId });

    // Create Response Object
    const responseData = {
      techpack_details: techPackData || null,
      sample_requests: sampleRequests || [],
      wash_details: washDetails || [],
      style_details: styleDetails || [],
    };

    res.status(200).json({ data: responseData });
  } catch (error) {
    console.error("Error fetching TechPack data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
