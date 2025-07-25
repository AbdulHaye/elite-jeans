const mongoose = require("mongoose");

const DigitalPatternSchema = new mongoose.Schema({
  workOrder_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "workOrder",
  },
  styleNumber: {
    type: String,
    required: true,
  },
  file: {
    type: String, // S3 URL
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DigitalPattern", DigitalPatternSchema);
