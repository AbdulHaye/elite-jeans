const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../../middleware/authMiddleware");
const readOnlyMiddleware = require("../../middleware/readOnlyMiddleware");
const {
  createWorkOrder,
  getAllWorkOrder,
  getFilteredWorkOrders,
  getWorkOrderById,
  editWorkOrder,
  createSampleRequest,
  getAllSampleRequests,
  getAllSampleRequestsByWorkOrderID,
  getSampleRequestById,
  editSampleRequest,
  deleteSampleRequest,
  createWashDetail,
  getAllWashDetails,
  getWashDetailById,
  editWashDetail,
  getFilterItemDetails,
  deleteWashDetail,
  getWashDetailWorkorderID,
  createStyleDetail,
  getAllStyleDetails,
  getAllStyleDetailsByWorkOrderID,
  getStyleDetailById,
  editStyleDetail,
  deleteStyleDetail,
  createNewDetail,
  getAllNewDetails,
  getAllNewDetailsByWorkOrderID,
  getNewDetailById,
  updateNewDetailById,
  deleteNewDetailById,
  createColor,
  getAllColors,
  getColorById,
  updateColorById,
  deleteColorById,
  createItemDetail,
  getAllItemDetails,
  getAllItemDetailsByWorkOrderID,
  getItemDetailById,
  getUnExportedItemDetailsByVendor,
  updateItemDetailById,
  deleteItemDetailById,
  // createSampleGradedSpecs,
  // getAllSampleGradedSpecs,
  // getSampleGradedSpecsById,
  // updateSampleGradedSpecsById,
  // deleteSampleGradedSpecsById,
  // createDesignComment,
  // getAllDesignComments,
  // getDesignCommentById,
  // updateDesignComment,
  // deleteDesignComment,
  // createFitComment,
  // getAllFitComments,
  // getFitCommentById,
  // updateFitCommentById,
  // deleteFitCommentById,
  // sendWorkOrderEmail,
  // generatePDF
  getWorkOrderByVendor,
  addWorkOrderQuote,
  getWorkOrderQuotes,
  updateWorkOrderQuote,
  getUnExportedItemDetails,
  deleteWorkOrderQuote,
  getItemDetailsByVendorAndWorkOrder,
  addQuoteToItemDetail,
  deleteitemDetailQuote,
  updateitemDetailQuote,
  // getAllSalesContracts,
  getQuotesForItemDetail,
  getItemDetailsByVendor,
  createSalesContract,
  updateSalesContract,
  getSalesContractById,
  getAllSalesContracts,
  getFilteredItemDetails,
  createRepeatWorkOrder,
  getSearchWorkOrder,
  createWorkOrderInTechPack,
  generatePDF,
  getWorkOrderFullDetails,
  sendWorkOrderEmailController,
  getWorkOrdersByVendor,
  deleteWorkOrder,
  getStyleNumbersByWorkOrderID,
  getAllItemDetailswithAsnandArrangment,
} = require("../../controllers/workorder/WorkOrderController");
const { allowModules } = require("../../middleware/moduleAccess");

const upload = multer({ dest: "uploads/" }); // Store PDFs temporarily in 'uploads/' directory
router.post(
  "/send-workorder-email",
  upload.array("pdfs", 5),
  sendWorkOrderEmailController
);
// Work Order Routes
router.post(
  "/create",
  protect,
  readOnlyMiddleware,
  allowModules(["general", "admin"]),
  createWorkOrder
);
router.delete(
  "/:id",
  protect,
  readOnlyMiddleware,
  allowModules(["admin"]),
  deleteWorkOrder
);

router.get(
  "/filter",
  protect,
  allowModules(["general", "admin"]),
  getFilteredWorkOrders
);
router.get(
  "/search",
  protect,
  allowModules(["general", "admin", "read_only"]),
  getSearchWorkOrder
);
// router.get('/getUnexportedWorkOrders',getUnexportedWorkOrders);
router.post("/getWorkOrderFullDetails", getWorkOrderFullDetails);
// router.get("/", getAllWorkOrder);
router.get(
  "/",
  protect,
  allowModules(["general", "admin", "vendor", "read_only"]),
  getAllWorkOrder
);
router.get("/generatePDF/:id", generatePDF);
router.get("/:id", protect, readOnlyMiddleware, getWorkOrderById);
router.put(
  "/:id",
  protect,
  readOnlyMiddleware,
  allowModules(["general", "admin"]),
  editWorkOrder
);
router.post(
  "/add-teachpack/:workOrderId",
  protect,
  readOnlyMiddleware,
  createWorkOrderInTechPack
);
router.post(
  "/repeat-workorder/:workOrderId",
  protect,
  readOnlyMiddleware,
  createRepeatWorkOrder
);
// Sample Request Routes
router.post(
  "/create-sample-request",
  protect,
  readOnlyMiddleware,
  createSampleRequest
);
router.get("/sample-requests", getAllSampleRequests); // Get All
router.get("/sample-requests/:id", getSampleRequestById); // Get by ID
router.put(
  "/create-sample-request/:id",
  protect,
  readOnlyMiddleware,
  editSampleRequest
);
router.delete(
  "/create-sample-request/:id",
  protect,
  readOnlyMiddleware,
  deleteSampleRequest
);
router.post(
  "/sample-requests-by-work-orders",
  protect,
  readOnlyMiddleware,
  getAllSampleRequestsByWorkOrderID
);
// WashDetail Routes
router.post(
  "/wash-detail/create",
  protect,
  readOnlyMiddleware,
  createWashDetail
);
router.get("/wash-detail", getAllWashDetails);
router.get("/wash-detail/:id", getWashDetailById);
router.put("/wash-detail/:id", protect, readOnlyMiddleware, editWashDetail);
router.delete(
  "/wash-detail/:id",
  protect,
  readOnlyMiddleware,
  deleteWashDetail
);
router.post(
  "/wash-detail/getByWorkOrder",
  protect,
  readOnlyMiddleware,
  getWashDetailWorkorderID
);
// StyledDetail Routes
router.post(
  "/styled-detail/create",
  protect,
  readOnlyMiddleware,
  createStyleDetail
);
router.get("/styled-detail", getAllStyleDetails);
router.get("/styled-detail/:id", getStyleDetailById);
router.put("/styled-detail/:id", protect, readOnlyMiddleware, editStyleDetail);
router.delete(
  "/styled-detail/:id",
  protect,
  readOnlyMiddleware,
  deleteStyleDetail
);
router.post(
  "/styled-detail-by-work-orders",
  protect,
  readOnlyMiddleware,
  getAllStyleDetailsByWorkOrderID
);
// NewDetail Routes
router.post("/new-detail/create", protect, readOnlyMiddleware, createNewDetail);
router.post("/new-detail", protect, readOnlyMiddleware, getAllNewDetails);
router.get("/new-detail/:id", getNewDetailById);
router.put("/new-detail/:id", protect, readOnlyMiddleware, updateNewDetailById);
router.delete(
  "/new-detail/:id",
  protect,
  readOnlyMiddleware,
  deleteNewDetailById
);
router.post(
  "/new-detail-by-work-orders",
  protect,
  readOnlyMiddleware,
  getAllNewDetailsByWorkOrderID
);
// Color Routes
router.post("/color/create", protect, readOnlyMiddleware, createColor);
router.get("/color", getAllColors);
router.get("/color/:id", getColorById);
router.put("/color/:id", protect, readOnlyMiddleware, updateColorById);
router.delete("/color/:id", protect, readOnlyMiddleware, deleteColorById);
// ItemDetail Routes
router.post(
  "/item-detail/create",
  protect,
  readOnlyMiddleware,
  allowModules(["general", "admin"]),
  createItemDetail
);
router.get(
  "/itemdetail/filters",
  protect,
  allowModules(["general", "admin", "read_only", "vendor"]),
  getFilterItemDetails
);
// In your router file (e.g., itemDetailRoutes.js)
router.get(
  "/itemdetail/asn/arrangement",
  protect,
  readOnlyMiddleware,
  allowModules(["general", "admin"]),
  getAllItemDetailswithAsnandArrangment
);

// router.get("/item-detail/getAll", getAllItemDetails);//change URL address
router.get("/item-detail/Filter", getFilteredItemDetails);
router.get("/item-detail/UnExported", getUnExportedItemDetails);
router.get(
  "/item-detail/UnExported/:vendorId",
  getUnExportedItemDetailsByVendor
);
// router.get("/item-detail/getAll", protect, getAllItemDetails);
router.get("/item-detail/getAll", getAllItemDetails);
router.get(
  "/item-detail/workorders/:workOrder_Id",
  getAllItemDetailsByWorkOrderID
);

router.get(
  "/item-detail/workorders/:workOrder_Id/style-numbers",
  getStyleNumbersByWorkOrderID
);


router.get("/item-detail/:id", getItemDetailById);
router.put(
  "/item-detail/:id",
  protect,
  readOnlyMiddleware,
  updateItemDetailById
);
router.delete(
  "/item-detail/:id",
  protect,
  readOnlyMiddleware,
  deleteItemDetailById
);
//SampleGradedSpecs Routes
// router.post("/sample-graded-specs/create", createSampleGradedSpecs);
// router.get("/sample-graded-specs", getAllSampleGradedSpecs);
// router.get("/sample-graded-specs/:id", getSampleGradedSpecsById);
// router.put("/sample-graded-specs/:id", updateSampleGradedSpecsById);
// router.delete("/sample-graded-specs/:id", deleteSampleGradedSpecsById);
// // DesignComments Routes
// router.post("/design-comments/create", createDesignComment);
// router.get("/design-comments", getAllDesignComments);
// router.get("/design-comments/:id", getDesignCommentById);
// router.put("/design-comments/:id", updateDesignComment);
// router.delete("/design-comments/:id", deleteDesignComment);
// // FitComments Routes
// router.post("/fit-comments/create", createFitComment);
// router.get("/fit-comments", getAllFitComments);
// router.get("/fit-comments/:id", getFitComment);
// router.put("/fit-comments/:id", updateFitCommentById);
// router.delete("/fit-comments/:id", deleteFitCommentById);
// // Send Work Order Email
// router.post("/send-work-order-email/:id", sendWorkOrderEmail);
// // Route to generate and download a PDF
// router.get('/:id/download-pdf', generatePDF);
router.get("/Vendor/id/:vendorId", getWorkOrderByVendor);
router.post("/quote", protect, readOnlyMiddleware, addWorkOrderQuote);
router.get("/quote/:workOrder_Id", protect, getWorkOrderQuotes);
router.put(
  "/quote/:workOrder_Id/:quoteIndex",
  protect,
  readOnlyMiddleware,
  updateWorkOrderQuote
);
router.delete(
  "/quote/:workOrder_Id/:quoteIndex",
  protect,
  readOnlyMiddleware,
  deleteWorkOrderQuote
);
router.get(
  "/item-detail/Byvendor/:vendorId",
  getItemDetailsByVendorAndWorkOrder
);
router.get("/vendor/own/workorders", protect, getWorkOrdersByVendor);
router.post(
  "/quotes-with-contract/itemDetailId",
  protect,
  readOnlyMiddleware,
  addQuoteToItemDetail
);
router.get("/quotes/:itemDetailId", getQuotesForItemDetail);
router.put(
  "/item-details/:itemDetail_Id/quotes/:quoteIndex",
  protect,
  readOnlyMiddleware,
  updateitemDetailQuote
);
router.delete(
  "/item-details/:itemDetail_Id/quotes/:quoteIndex",
  protect,
  readOnlyMiddleware,
  deleteitemDetailQuote
);
// router.get('/item-details/sales-contracts', getAllSalesContracts);
router.get("/item-details/vendor/:vendorId", getItemDetailsByVendor);
router.post(
  "/salesContract/create",
  protect,
  readOnlyMiddleware,
  createSalesContract
);
router.put(
  "/salesContract/update/:contractId",
  protect,
  readOnlyMiddleware,
  updateSalesContract
);
router.get("/salesContract/:contractId", getSalesContractById);
router.get("/salesContract/get/all", getAllSalesContracts);
module.exports = router;
