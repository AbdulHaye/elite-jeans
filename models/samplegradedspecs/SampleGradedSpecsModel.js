const mongoose = require("mongoose");

const SampleGradedSpecsSchema = new mongoose.Schema(
  {
    techpack_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TechPack",
    },
    workOrder_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkOrder",
    },
    item_type_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemType",
    },
    size_range: {
      type: String,
    },
    spec_template_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecsTemplate",
    },
    style_number: {
      type: String,
    },
    fabric_content: {
      type: String,
    },
    customer_or_brand: {
      type: String,
    },
    size: {
      type: String,
    },
    garment_specs_details: {
      type: String,
    },
    poms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CopiedSpecTemPoms",
      },
    ],
    DesignDate: { type: Date },
    IntialDate: { type: Date },
    FirstPPdate: { type: Date },
    createddate: { type: Date },
    Rev1date: { type: Date },
    SecondPPdate: { type: Date },
    Rev2date: { type: Date },
    ThirdPPdate: { type: Date },
    Finaldate: { type: Date },
    Shipdate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SampleGradedSpecs", SampleGradedSpecsSchema);
