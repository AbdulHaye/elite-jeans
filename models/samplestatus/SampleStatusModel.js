const mongoose = require("mongoose");

const sampleStatusSchema = new mongoose.Schema(
  {
    sampleStatus: {
      name: {
        type: String,
        required: true,
        unique: true,
      },
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

module.exports = mongoose.model("SampleStatus", sampleStatusSchema);
