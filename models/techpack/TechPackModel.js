const mongoose = require("mongoose");

const techPackSchema = new mongoose.Schema({
  techPackId: {
    type: String,
    required: true,
    unique: true,
  },

  styleId: {
    type: String,
    // required: true,
  },

  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },

  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  ],

  itemType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ItemType",
    required: true,
  },

    subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: true,
  },

  
  setType: {
    type: String,
    enum: [null, "2pc", "3pc"],
    default: null,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },

  labelTrim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrimModel",
  },

  pictures: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Picture", // Reference to the picture model
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

  tech_pack_quote: [
    {
      price: { type: String },
      vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
      },
      date: { type: Date },
      fabric: { type: String },
      notes: { type: String },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },
  ],
});

module.exports = mongoose.model("TechPack", techPackSchema);
