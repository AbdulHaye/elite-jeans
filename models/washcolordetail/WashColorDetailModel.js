const mongoose = require("mongoose");

const SIZE_ENUM = ["Small", "Medium", "Large"];

const WashColorNewDetailSchema = new mongoose.Schema({
  wash_detail_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WashDetail",
  },
  detail_category: {
    type: String,
    required: true,
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

module.exports = mongoose.model("WashColorNewDetail", WashColorNewDetailSchema);
