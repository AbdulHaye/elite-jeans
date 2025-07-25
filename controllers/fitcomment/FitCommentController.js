const FitComments = require("../../models/fitcomment/FitCommentModel");
const { uploadToS3 } = require("../../utils/s3Client");
const mongoose = require('mongoose');

exports.getAllFitComments = async (_req, res) => {
  try {
    const fitComments = await FitComments.find().populate(
      "workOrder_Id sampleStatus_id sampleRequestingStatus_id"
    );
    res.status(200).json(fitComments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createFitComment = async (req, res) => {
  try {
    const { workOrder_Id, sampleStatus_id, sampleRequestingStatus_id, styleNumber } = req.body;

    // Basic validation
    if (!workOrder_Id || !styleNumber) {
      return res.status(400).json({
        message: "Missing required fields: workOrder_Id and styleNumber are required.",
      });
    }

    // Check if IDs are valid MongoDB ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(workOrder_Id) || 
        (sampleStatus_id && !mongoose.Types.ObjectId.isValid(sampleStatus_id)) ||
        (sampleRequestingStatus_id && !mongoose.Types.ObjectId.isValid(sampleRequestingStatus_id))) {
      return res.status(400).json({
        message: "Invalid ID format for one or more fields",
      });
    }

    // Check for existing comment
    const existingComment = await FitComments.findOne({ 
      workOrder_Id, 
      styleNumber 
    });

    if (existingComment) {
      return res.status(409).json({
        message: "Fit comment already exists for this workOrder_Id and styleNumber combination.",
        existingId: existingComment._id
      });
    }

    // Create new fit comment
    const fitComment = new FitComments({
      workOrder_Id,
      styleNumber,
      sampleStatus_id: sampleStatus_id || null,
      sampleRequestingStatus_id: sampleRequestingStatus_id || null,
      PP1: null,
      PP2: null,
      PP3: null,
      Shipping: null,
      Other: null,
    });

    await fitComment.save();

    res.status(201).json({
      message: "Fit comment created successfully",
      data: fitComment,
    });

  } catch (error) {
    console.error("Error creating fit comment:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getFitCommentsByWorkOrderAndStyle = async (req, res) => {
  try {
    const { workOrderId, styleNumber } = req.params;
    
    const fitComment = await FitComments.findOne({
      workOrder_Id: workOrderId,
      styleNumber: styleNumber
    })
    .populate('sampleStatus_id')
    .populate('sampleRequestingStatus_id')
    .lean();

    if (!fitComment) {
      return res.status(404).json({ 
        message: "Fit comment not found.",
        searchedCriteria: {
          workOrderId,
          styleNumber
        }
      });
    }

    res.status(200).json(fitComment);
  } catch (error) {
    console.error("Error fetching fit comment:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

exports.getFitCommentById = async (req, res) => {
  try {
    const fitComment = await FitComments.findById(req.params.id).populate(
      "workOrder_Id sampleStatus_id sampleRequestingStatus_id"
    );
    if (!fitComment) {
      return res.status(404).json({ message: "FitComment not found" });
    }
    res.status(200).json(fitComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFitComment = async (req, res) => {
  try {
    const { workOrderId, styleNumber } = req.params;
    const {
      sampleRequestingStatus_id,
      sampleStatus_id,
      stage,
      comment_completed_by,
      approval_status,
      comments,
    } = req.body;

    if (!workOrderId || !styleNumber) {
      return res.status(400).json({
        message: "Missing required fields: workOrderId and styleNumber are required.",
      });
    }

    // Upload images to S3
    const uploadedImages = {
      front_view: [],
      back_view: [],
      side_view: [],
      additional_pictures: []
    };

    if (req.files) {
      for (const [viewType, files] of Object.entries(req.files)) {
        uploadedImages[viewType] = await Promise.all(
          files.map(file => uploadToS3(file))
        );
      }
    }

    let fitComment = await FitComments.findOne({ 
      workOrder_Id: workOrderId,
      styleNumber: styleNumber
    });

    if (!fitComment) {
      return res.status(404).json({ message: "Fit comment not found." });
    }

    // Update status fields if provided
    if (sampleRequestingStatus_id) {
      fitComment.sampleRequestingStatus_id = sampleRequestingStatus_id;
    }
    if (sampleStatus_id) {
      fitComment.sampleStatus_id = sampleStatus_id;
    }

    // Update stage data if provided
    if (stage) {
      if (!["PP1", "PP2", "PP3", "Shipping", "Other"].includes(stage)) {
        return res.status(400).json({
          message: "Invalid stage. Must be one of: PP1, PP2, PP3, Shipping, Other.",
        });
      }

      // Initialize stage if it doesn't exist
      if (!fitComment[stage]) {
        fitComment[stage] = {
          date: new Date(),
          comment_completed_by: null,
          approval_status: null,
          comments: null,
          images: {
            front_view: [],
            back_view: [],
            side_view: [],
            additional_pictures: []
          }
        };
      }

      // Update fields if provided
      if (comment_completed_by) {
        fitComment[stage].comment_completed_by = comment_completed_by;
      }
      if (approval_status) {
        fitComment[stage].approval_status = approval_status;
      }
      if (comments) {
        fitComment[stage].comments = comments;
      }

      // Update images for each view type if files were uploaded
      for (const [viewType, urls] of Object.entries(uploadedImages)) {
        if (urls.length > 0) {
          fitComment[stage].images[viewType] = urls;
        }
      }

      fitComment[stage].date = new Date();
    }

    await fitComment.save();

    res.status(200).json({
      message: "Fit comment updated successfully",
      data: fitComment,
    });
  } catch (error) {
    console.error("Error updating fit comment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteFitComment = async (req, res) => {
  try {
    const deletedFitComment = await FitComments.findByIdAndDelete(
      req.params.id
    );
    if (!deletedFitComment) {
      return res.status(404).json({ message: "FitComment not found" });
    }
    res.status(200).json({ message: "FitComment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




exports.getLogsByStyleNumber = async (req, res) => {
  try {
    const { styleNumber } = req.params;
    

    const logs = await FitComments.aggregate([
      { $match: { styleNumber } },
      { $sort: { createdAt: -1 } },
      { 
        $project: {
          styleNumber: 1,
          PP1: 1,
          PP2: 1,
          PP3: 1,
          Shipping: 1,
          Other: 1,
          sampleStatus_id: 1,
          sampleRequestingStatus_id: 1
        }
      }
    ]);

    if (!logs || logs.length === 0) {
      return res.status(404).json({ 
        message: "No fit comments found for this style number.",
        styleNumber
      });
    }
    // Only query by styleNumber, don't include workOrder_Id in the query
    const fitComments = await FitComments.find({ styleNumber })
      .populate('sampleStatus_id')
      .populate('sampleRequestingStatus_id')
      .sort({ createdAt: -1 });

    if (!fitComments || fitComments.length === 0) {
      return res.status(404).json({ 
        message: "No fit comments found for this style number.",
        styleNumber
      });
    }

  
   

    res.status(200).json({
      styleNumber,
      logs
    });

  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};