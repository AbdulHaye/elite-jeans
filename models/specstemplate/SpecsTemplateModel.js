const mongoose = require("mongoose");

const specsTemplateSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
    },
    spec_type: {
      type: String,
    },
    Size_Range: {
      type: String,
    },
    Point_of_Measure: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SpecTemPoms",
      },
    ],
  },
  { timestamps: true }
);

const SpecsTemplate = mongoose.model("SpecsTemplate", specsTemplateSchema);
module.exports = SpecsTemplate;
