// controllers/designCommentsController.js
const DesignComments = require("../../models/designcomment/DesignCommentModel");
const FitComments = require("../../models/fitcomment/FitCommentModel");
const DesignCommentLog = require("../../models/designLogs/DesignCommentLog");
const { uploadToS3 } = require("../../utils/s3Client");
const mongoose = require("mongoose");

exports.getAllDesignComments = async (_req, res) => {
  try {
    const designComments = await DesignComments.find().populate(
      "workOrder_Id sampleStatus_id sampleRequestingStatus_id"
    );
    res.status(200).json(designComments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDesignComment = async (req, res) => {
  try {
    const {
      workOrder_Id,
      sampleStatus_id,
      sampleRequestingStatus_id,
      styleNumber,
    } = req.body;

    // Basic validation
    if (
      !workOrder_Id ||
      !sampleStatus_id ||
      !sampleRequestingStatus_id ||
      !styleNumber
    ) {
      return res.status(400).json({
        message:
          "Missing required fields: workOrder_Id, sampleStatus_id, sampleRequestingStatus_id, and styleNumber are all required.",
      });
    }

    // Check if IDs are valid MongoDB ObjectIDs
    if (
      !mongoose.Types.ObjectId.isValid(workOrder_Id) ||
      !mongoose.Types.ObjectId.isValid(sampleStatus_id) ||
      !mongoose.Types.ObjectId.isValid(sampleRequestingStatus_id)
    ) {
      return res.status(400).json({
        message: "Invalid ID format for one or more fields",
        details: {
          workOrder_Id: mongoose.Types.ObjectId.isValid(workOrder_Id)
            ? "valid"
            : "invalid",
          sampleStatus_id: mongoose.Types.ObjectId.isValid(sampleStatus_id)
            ? "valid"
            : "invalid",
          sampleRequestingStatus_id: mongoose.Types.ObjectId.isValid(
            sampleRequestingStatus_id
          )
            ? "valid"
            : "invalid",
        },
      });
    }

    // Check for existing comment
    const existingComment = await DesignComments.findOne({
      workOrder_Id,
      styleNumber,
    });

    if (existingComment) {
      return res.status(409).json({
        message:
          "Design comment already exists for this workOrder_Id and styleNumber combination.",
        existingId: existingComment._id,
      });
    }

    // Create new design comment
    const designComment = new DesignComments({
      workOrder_Id,
      styleNumber,
      sampleStatus_id,
      sampleRequestingStatus_id,
      PP1: null,
      PP2: null,
      PP3: null,
      Shipping: null,
      Other: null,
    });

    await designComment.save();

    res.status(201).json({
      message: "Design comment created successfully",
      data: designComment,
    });
  } catch (error) {
    console.error("Error creating design comment:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.getDesignCommentsByWorkOrderAndStyle = async (req, res) => {
  try {
    const { workOrderId, styleNumber } = req.params;

    console.log(
      `Searching for workOrderId: ${workOrderId}, styleNumber: ${styleNumber}`
    ); // Debug log

    const designComment = await DesignComments.findOne({
      workOrder_Id: workOrderId,
      styleNumber: styleNumber,
    })
      .populate("sampleStatus_id")
      .populate("sampleRequestingStatus_id")
      .lean(); // Convert to plain JS object

    console.log("Found document:", designComment); // Debug log

    if (!designComment) {
      return res.status(404).json({
        message: "Design comment not found.",
        searchedCriteria: {
          workOrderId,
          styleNumber,
        },
      });
    }

    res.status(200).json(designComment);
  } catch (error) {
    console.error("Error fetching design comment:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getDesignCommentById = async (req, res) => {
  try {
    const designComment = await DesignComments.findById(req.params.id).populate(
      "workOrder_Id sampleStatus_id sampleRequestingStatus_id"
    );
    if (!designComment) {
      return res.status(404).json({ message: "DesignComment not found" });
    }
    res.status(200).json(designComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDesignComment = async (req, res) => {
  try {
    const { workOrderId, styleNumber } = req.params;
    const {
      stage,
      approval_status,
      comment_completed_by,
      comments,
      sampleStatus_id,
      sampleRequestingStatus_id,
    } = req.body;

    // Validate required fields
    if (!workOrderId || !styleNumber) {
      return res.status(400).json({
        message: "Missing required fields: workOrderId and styleNumber are required.",
      });
    }

    let designComment = await DesignComments.findOne({
      workOrder_Id: workOrderId,
      styleNumber: styleNumber,
    });

    if (!designComment) {
      return res.status(404).json({ message: "Design comment not found." });
    }

    // Handle sample status and requesting status updates
    if (sampleStatus_id || sampleRequestingStatus_id) {
      if (sampleStatus_id) {
        designComment.sampleStatus_id = sampleStatus_id;
      }
      if (sampleRequestingStatus_id) {
        designComment.sampleRequestingStatus_id = sampleRequestingStatus_id;
      }
      
      await designComment.save();
      return res.status(200).json({
        message: "Sample status updated successfully",
        data: designComment,
      });
    }

    // Handle stage updates (original functionality)
    if (stage) {
      if (!["PP1", "PP2", "PP3", "Shipping", "Other"].includes(stage)) {
        return res.status(400).json({
          message: "Invalid stage. Must be one of: PP1, PP2, PP3, Shipping, Other.",
        });
      }

      if (
        !["Approved", "Approved with Corrections", "Rejected"].includes(
          approval_status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid status. Must be one of: Approved, Approved with Corrections, Rejected.",
        });
      }

      let pictureUrls = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const uploadedUrl = await uploadToS3(file);
          pictureUrls.push(uploadedUrl);
        }
      }

      // Create log entry only for stage updates
      await DesignCommentLog.create({
        workOrder_Id: workOrderId,
        styleNumber: styleNumber,
        stage: stage,
        comment_completed_by: comment_completed_by,
        status: approval_status,
        comments: comments,
        images_url: pictureUrls,
      });

      const stageUpdate = {
        date: new Date(),
        approval_status: approval_status,
        comments: comments,
        comment_completed_by: comment_completed_by,
        images_url: pictureUrls.length > 0 ? pictureUrls : null,
      };

      designComment[stage] = stageUpdate;
      await designComment.save();

      return res.status(200).json({
        message: "Design comment updated successfully",
        data: designComment,
      });
    }

    return res.status(400).json({
      message: "No valid update fields provided.",
    });
  } catch (error) {
    console.error("Error updating design comment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteDesignComment = async (req, res) => {
  try {
    const deletedDesignComment = await DesignComments.findByIdAndDelete(
      req.params.id
    );
    if (!deletedDesignComment) {
      return res.status(404).json({ message: "DesignComment not found" });
    }
    res.status(200).json({ message: "DesignComment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCombinedLogsByStyleNumber = async (req, res) => {
  try {
    const { styleNumber } = req.params;

    // Validate styleNumber is provided
    if (!styleNumber) {
      return res.status(400).json({
        success: false,
        message: "Style number is required",
      });
    }

    // Fetch both design comments and fit comments logs in parallel
    const [designLogs, fitLogs] = await Promise.all([
      DesignCommentLog.find({ styleNumber }).sort({ logDate: -1 }),
      FitComments.findOne({ styleNumber }).lean(),
    ]);

    // Process design comments logs
    const formattedDesignLogs = designLogs.map((log) => ({
      logId: log._id,
      logDate: log.logDate,
      type: "design",
      sampleStage: log.stage,
      status: log.status,
      comments: log.comments,
      images: log.images_url,
      commentCompletedBy: log.comment_completed_by,
    }));

    // Process fit comments logs
    const formattedFitLogs = [];
    const fitStages = ["PP1", "PP2", "PP3", "Shipping", "Other"];

    if (fitLogs) {
      fitStages.forEach((stage) => {
        if (fitLogs[stage]) {
          const stageData = fitLogs[stage];

          // Create log entry for each view type with images
          const viewTypes = [
            "front_view",
            "back_view",
            "side_view",
            "additional_pictures",
          ];
          viewTypes.forEach((viewType) => {
            if (
              stageData.images[viewType] &&
              stageData.images[viewType].length > 0
            ) {
              formattedFitLogs.push({
                logId: fitLogs._id,
                logDate: stageData.date,
                type: "fit",
                sampleStage: stage,
                status: stageData.approval_status,
                comments: stageData.comments,
                images: stageData.images[viewType],
                viewType: viewType.replace("_", " "),
                commentCompletedBy: stageData.comment_completed_by,
              });
            }
          });

          // Add an entry even if no images (but has comments/status)
          if (stageData.comments || stageData.approval_status) {
            formattedFitLogs.push({
              logId: fitLogs._id,
              logDate: stageData.date,
              type: "fit",
              sampleStage: stage,
              status: stageData.approval_status,
              comments: stageData.comments,
              images: [], // No specific images, will be handled by viewType
              viewType: "general",
              commentCompletedBy: stageData.comment_completed_by,
            });
          }
        }
      });
    }

    // Combine and sort all logs by date (newest first)
    const allLogs = [...formattedDesignLogs, ...formattedFitLogs].sort(
      (a, b) => {
        return new Date(b.logDate) - new Date(a.logDate);
      }
    );

    if (allLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No logs found for this style number",
      });
    }

    res.status(200).json({
      success: true,
      styleNumber,
      logs: allLogs,
    });
  } catch (error) {
    console.error("Error fetching combined logs:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
