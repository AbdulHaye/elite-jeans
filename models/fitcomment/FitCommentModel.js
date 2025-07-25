const mongoose = require("mongoose");

// Schema for storing stage details with multiple image arrays
const stageSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  comment_completed_by: {
    type: String,
  },
  approval_status: {
    type: String,
    enum: ["Approved", "Approved with Corrections", "Rejected"],
  },
  comments: { 
    type: String 
  },
  images: {
    front_view: [{ type: String }],
    back_view: [{ type: String }],
    side_view: [{ type: String }],
    additional_pictures: [{ type: String }]
  }
}, { _id: false });

// Main schema for Fit Comments
const fitCommentSchema = new mongoose.Schema(
  {
    workOrder_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: true,
    },
    styleNumber: {
      type: String,
      required: true,
      index: true
    },
    sampleStatus_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SampleStatus",
    },
    sampleRequestingStatus_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SampleRequestingStatus",
    },
    PP1: stageSchema,
    PP2: stageSchema,
    PP3: stageSchema,
    Shipping: stageSchema,
    Other: stageSchema,
  },
  { timestamps: true }
);

// Add compound index for faster queries
fitCommentSchema.index({ workOrder_Id: 1, styleNumber: 1 }, { unique: true });

module.exports = mongoose.model("FitComments", fitCommentSchema);