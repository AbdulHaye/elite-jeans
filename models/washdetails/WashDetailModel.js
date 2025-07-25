const mongoose = require("mongoose");

const washDetailSchema = new mongoose.Schema({
  wash: { type: String },

  dryProcess: { type: String },

  color: { type: String },

  comments: { type: String },
   category_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category' // Make sure this matches your Category model name
  },
  washPicture: { type: String },
  dynamicAttributes: { type: Map, of: String, default: {} },
  techpack_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TechPack' // Make sure this matches your TechPack model name
  },
workOrder_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder' // Make sure this matches your WorkOrder model name
  },
});

const WashDetail = mongoose.model("WashDetail", washDetailSchema);

module.exports = WashDetail;
