const mongoose = require("mongoose");

const SalesContractSchema = new mongoose.Schema(
  {
    contractNo: {
      type: String,
      required: true,
    },
    contractDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    workOrderquoteId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ItemDetail",
      },
    ],
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "workOrder",
    },
    styleNo: {
      type: String,
    },
    orderDateCreated: {
      type: Date,
    },
    FOBPort: {
      type: String,
    },
    vendorCompanyName: {
      type: String,
    },

    bankName: {
      type: String,
    },
    swiftCode: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    bankAddress: {
      type: String,
    },
    vendorBeneficiaryAddress: {
      type: String,
    },
    status: {
      type: String,
      default: "approved",
    },
  },
  {
    timestamps: true,
  }
);

const SalesContract = mongoose.model("SalesContract", SalesContractSchema);

module.exports = SalesContract;
