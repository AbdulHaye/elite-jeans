const mongoose = require("mongoose");

const workOrderSchema = new mongoose.Schema({
  techpack_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TechPack",
  },
  workOrderId: { type: String },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  }],
itemType: {
       type: mongoose.Schema.Types.Mixed, 
        ref: 'ItemType',
        required: true,
    },

  shippingStatus: [
    {
      type: String,
    },
  ],
stylenumbers: [{
    _id: String,
    number: String
  }],
  customer_po_number: [
    {
      type: String,
    },
  ],
  sampleStatus: [
    {
      type: String,
    },
  ],
  subCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: true
  }],
  trim_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrimModel",
    },
  ],
  etd: { type: Date, required: true },
  pictures: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Picture",
    },
  ],
  buttonImages: [
    {
      image: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Picture",
      },
      color: { type: String, required: true },
      size: { type: String, required: true },
      quantity: { type: Number, required: true },
      comment: { type: String, required: false },
    },
  ],
  rivetImages: [
    {
      image: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Picture",
      },
      color: { type: String, required: true },
      size: { type: String, required: true },
      quantity: { type: Number, required: true },
      comment: { type: String, required: false },
    },
  ],
  trimImages: [
    {
      image: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Picture",
      },
      color: { type: String, required: true },
      size: { type: String, required: true },
      quantity: { type: Number, required: true },
      comment: { type: String, required: false },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const WorkOrder = mongoose.model("WorkOrder", workOrderSchema);

module.exports = WorkOrder;