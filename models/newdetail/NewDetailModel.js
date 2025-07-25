const mongoose = require("mongoose");

const SIZE_ENUM = ["Small", "Medium", "Large"];

const NewDetailSchema = new mongoose.Schema({
  style_detail_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StyleDetail",
  },
  workOrder_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "workOrder",
  },
  wash_detail_id: {
    type: mongoose.Schema.Types.ObjectId,

    ref: "WashDetail",
  },
  techpack_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TechPack",
  },
  detail_category: {
    type: String,
  },
  comment: {
    type: String,
    required: false,
  },
  pic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Picture",
    required: true,
  },
  size: {
    type: String,
    enum: SIZE_ENUM,
    default: "Small",
  },
});

module.exports = mongoose.model("NewDetail", NewDetailSchema);
