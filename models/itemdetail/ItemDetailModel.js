// // const mongoose = require("mongoose");

// // const ItemDetailSchema = new mongoose.Schema(
// //   {
// //     workOrder_Id: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "workOrder",
// //       required: true,
// //     },

// //     style_number: {
// //       type: String,
// //     },

// //     client_Id: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "Client",
// //     },
// //     class_Id: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "Class",
// //     },
// //     color_Id: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "Color",
// //     },
// //     shippingStatus: {
// //       type: String,
// //     },
// //     quantity: {
// //       type: Number,
// //     },
// //     size_scale: {
// //       type: String,
// //     },
// //     size_break: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "SizeBreak",
// //     },
// //     number_of_master_polybags_per_master_carton: {
// //       type: Number,
// //     },
// //     number_of_pieces_per_master_carton: {
// //       type: Number,
// //     },
// //     cbm_per_unit: {
// //       type: Number,
// //     },
// //     total_cbm: {
// //       type: Number,
// //     },
// //     individual_poly_bag: {
// //       type: Boolean,
// //       default: false,
// //     },
// //     price_tickets: {
// //       type: Boolean,
// //       default: false,
// //     },
// //     hanger: {
// //       type: Boolean,
// //       default: false,
// //     },

// //     comments: {
// //       type: String,
// //     },

// //     status: {
// //       type: String,
// //     },

// //     internal_comments: {
// //       type: String,
// //     },
// //     customer_po_number: {
// //       type: String,
// //     },
// //     package_by_size: [
// //       {
// //         size: { type: String },
// //         quantity: { type: Number },
// //       },
// //     ],
// //     work_order_quotes: [
// //       {
// //         price: { type: String },
// //         vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
// //         date: { type: Date },
// //         fabric: { type: String },
// //         notes: { type: String },
// //         status: {
// //           type: String,
// //           enum: ["pending", "approved", "rejected"],
// //           default: "pending",
// //         },
// //       },
// //     ],
// //     // purchaseOrder_Status:{
// //     //     type:String,
// //     //     enum:["Exported","UnExported"],
// //     //     required:true,
// //     // },
// //   },
// //   { timestamps: true }
// // );

// // module.exports = mongoose.model("ItemDetail", ItemDetailSchema);

// const mongoose = require("mongoose");

// const ItemDetailSchema = new mongoose.Schema(
//   {
//     workOrder_Id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "workOrder",
//       required: true,
//     },
//     style_number: {
//       type: String,
//       required: true,
//     },
//     client_Id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Client",
//     },
//     class_Id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Class",
//     },
//     color_Id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Color",
//     },
//     quantity: {
//       type: Number,
//       default: 0,
//     },
//     size_scale: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "SizeScale",
//     },
//     size_break: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "SizeBreak",
//     },
//     number_of_master_polybags_per_master_carton: {
//       type: Number,
//       default: 0,
//     },
//     number_of_pieces_per_master_carton: {
//       type: Number,
//       default: 0,
//     },
//     cbm_per_master_carton: {
//       type: Number,
//       default: 0,
//     },
//     number_of_cartons: {
//       type: Number,
//       default: 0,
//     },
//     total_cbm: {
//       type: Number,
//       default: 0,
//     },
//     comments: {
//       type: String,
//       default: "",
//     },
//     internal_comments: {
//       type: String,
//       default: "",
//     },
//     customer_po_number: {
//       type: String,
//       default: "",
//     },
//     individual_poly_bag: {
//       type: Boolean,
//       default: false,
//     },
//     price_tickets: {
//       type: Boolean,
//       default: false,
//     },
//     hanger: {
//       type: Boolean,
//       default: false,
//     },
//     status: {
//       type: String,
//       default: "open",
//       enum: ["open", "in-progress", "completed", "cancelled"],
//     },
//     package_by_size: [
//       {
//         size: { type: String },
//         quantity: { type: Number },
//         pieces_per_polybag: { type: Number },
//         master_polybags_per_carton: { type: Number },
//         pieces_per_carton: { type: Number },
//         cartons: { type: Number },
//       },
//     ],
//     work_order_quotes: [
//       {
//         price: { type: String },
//         vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
//         date: { type: Date },
//         fabric: { type: String },
//         notes: { type: String },
//         status: {
//           type: String,
//           enum: ["pending", "approved", "rejected"],
//           default: "pending",
//         },
//       },
//     ],
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("ItemDetail", ItemDetailSchema);

const mongoose = require("mongoose");

const ItemDetailSchema = new mongoose.Schema(
  {
    workOrder_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: true,
    },
    stylenumber: {
      _id: {
        type: String,
        required: true,
      },
      number: {
        type: String,
        required: true,
      },
    },
    client_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    class_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    color_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
    },
    quantity: {
      type: Number,
      default: 0,
    },
    available_quantity: {
      type: Number,
      default: null, // This will be empty/null when created
    },
    size_scale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SizeScale",
    },
    size_break: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SizeBreak",
    },
    number_of_master_polybags_per_master_carton: {
      type: Number,
      default: 0,
    },
    number_of_pieces_per_master_carton: {
      type: Number,
      default: 0,
    },
    cbm_per_master_carton: {
      type: Number,
      default: 0,
    },
    number_of_cartons: {
      type: Number,
      default: 0,
    },
    total_cbm: {
      type: Number,
      default: 0,
    },
    comments: {
      type: String,
      default: "",
    },
    internal_comments: {
      type: String,
      default: "",
    },
    customer_po_number: {
      type: String,
      default: "",
    },
    individual_poly_bag: {
      type: Boolean,
      default: false,
    },
    price_tickets: {
      type: Boolean,
      default: false,
    },
    hanger: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "open",
      enum: ["open", "in-progress", "completed", "cancelled"],
    },
    package_by_size: [
      {
        id: { type: Number }, // Added ID field
        size: { type: String },
        quantity: { type: Number },
        pieces_per_polybag: { type: Number },
        master_polybags_per_carton: { type: Number },
        pieces_per_carton: { type: Number },
        cartons: { type: Number }, // Fixed typo from cartons to cartons
      },
    ],
    work_order_quotes: [
      {
        price: { type: String },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("ItemDetail", ItemDetailSchema);
