const mongoose = require("mongoose");

const asnSchema = new mongoose.Schema({
  asnNumber: {
    type: String,
    unique: true,
    required: true,
  },
 createdDate: { type: Date, default: Date.now },
  loadingDate: {
    type: Date,
    required: true,
  },
  vesselETD: {
    type: Date,
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  portShippingForm: {
    type: String,
    required: true,
  },
  comments: {
    type: String,
    required: false,
  },
  selectedItemDetails: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemDetail",
      required: true,
    },
  ],
  status: {
    type: String,
  },
});

const ASN = mongoose.model("ASN", asnSchema);

module.exports = ASN;
