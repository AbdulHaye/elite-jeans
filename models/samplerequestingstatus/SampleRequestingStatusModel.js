const mongoose = require("mongoose");

const sampleRequestingStatusSchema = new mongoose.Schema(
  {
    sampleRequestingStatus: {
      name: {
        type: String,
        required: true,
        unique: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SampleRequestingStatus",
  sampleRequestingStatusSchema
);
