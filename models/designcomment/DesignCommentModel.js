const mongoose = require("mongoose");

const StageSchema = new mongoose.Schema(
  {
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
      type: String,
    },
    images_url: {
      type: [String],
    },
  },
  { _id: false }
);

const DesignCommentsSchema = new mongoose.Schema(
  {
    workOrder_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: true,
    },
    styleNumber: {  // Added this missing field
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
    PP1: StageSchema,
    PP2: StageSchema,
    PP3: StageSchema,
    Shipping: StageSchema,
    Other: StageSchema,
  },
  { timestamps: true }
);

// Add compound index for faster queries
DesignCommentsSchema.index({ workOrder_Id: 1, styleNumber: 1 }, { unique: true });

module.exports = mongoose.model("DesignComments", DesignCommentsSchema);