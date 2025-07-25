const mongoose = require("mongoose");

const arrangementSchema = new mongoose.Schema({
  arrangementNumber: {
    type: String,
    unique: true,
  },

  shipDate: {
    type: Date,
    required: true,
  },

  arrivalDate: {
    type: Date,
    required: true,
  },

  destination: {
    type: String,
    enum: ["New York", "Los Angeles", "China"],
    required: true,
  },

  shippingStatus: {
    type: String,
    enum: ["Arranged/Not Yet Shipped", "In Transit", "Received"],
  },
  selectedASN: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ASN",
    },
  ],
  bookingNumber: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Arrangement = mongoose.model("Arrangement", arrangementSchema);
module.exports = Arrangement;
