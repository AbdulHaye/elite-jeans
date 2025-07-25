const mongoose = require("mongoose");

const STATUS_ENUM = ["Pending", "Approved", "Rejected"];

const actionSchema = new mongoose.Schema({
  Log_Status: {
    type: String,
    enum: STATUS_ENUM,
  },
  Log_Date: {
    type: Date,
    default: Date.now,
  },
  Comments: {
    type: String,
  },
});

const sampleRequestSchema = new mongoose.Schema({
  techpack_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TechPack",
  },
  workOrder_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "workOrder",
  },
  styleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Style',
    required: true
  },
  styleNumber: {
    type: String,
    required: true
  },
  size: {
    type: String,
  },
  quantity: {
    type: Number,
  },
  sampleType: {
    type: String,
  },
  dueDate: {
    type: Date,
  },
  comments: {
    type: String,
  },
  status: {
    type: String,
    enum: STATUS_ENUM,
    default: "Pending",
  },
  actions: [actionSchema],
});

// Middleware to update the status based on the latest Log_Status
sampleRequestSchema.pre("save", function (next) {
  if (this.actions && this.actions.length > 0) {
    const latestAction = this.actions[this.actions.length - 1];
    if (latestAction.Log_Status) {
      this.status = latestAction.Log_Status;
    }
  }
  next();
});

module.exports = mongoose.model("SampleRequest", sampleRequestSchema);
