const mongoose = require("mongoose");

const VendorPOSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    comments: {
      type: String,
      trim: true,
    },

    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ItemDetail",
        required: true,
      },
    ],

    dueDate: {
      type: Date,
      required: true,
    },
    processingStatus: {
      type: String,
    },
    purchaseOrderDate: {
      type: Date,
    },
    purchaseOrderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    purchaseOrderStatus: {
      type: String,
      enum: ["Open", "Closed", "Cancelled"],
      default: "Open",
    },
    currencyCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },
    templateName: {
      type: String,
    },
    account: {
      type: String,
    },
    itemPrice: {
      type: Number,
      min: 0,
    },
    warehouseName: {
      type: String,
    },
    total: {
      type: Number,
    },
    adjustment: {
      type: Number,
      default: 0,
    },
    adjustmentDescription: {
      type: String,
      trim: true,
    },
    paymentTerms: {
      type: String,
    },
    attention: {
      type: String,
    },
    deliveryDate: {
      type: Date,
    },
    deliveryInstructions: {
      type: String,
    },
    items: [
      {
        itemName: { type: String },
        quantity: { type: Number, min: 1 },
        itemDesc: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorPO", VendorPOSchema);
