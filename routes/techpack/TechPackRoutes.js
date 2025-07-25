const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authMiddleware");
const readOnlyMiddleware = require("../../middleware/readOnlyMiddleware");
const {
  createTechPack,
  deleteTechPack,
  updateTechPack,
  getTechPackById,
  getAllTechPacks,
  getTechPacksByVendor,
  addTechPackQuote,
  getTechPackQuotes,
  updateTechPackQuote,
  deleteTechPackQuote,
  getSalesContracts,
  updateTechPackQuoteByIndex,
  CreatetechPackInWorkOrder,
  getWorkOrdersByTechPack,
  getFilteredTechPacks,
  getAllTechPackIds,
  createRepeatTechPack,
  generateTechPackPDF,
  getFullDetailsByTechPack,
  getVendorTechPacks,
} = require("../../controllers/techpack/TechPackController");
const { allowModules } = require("../../middleware/moduleAccess");
router.post("/getpdfFullDetails", getFullDetailsByTechPack);
router.post("/", protect, readOnlyMiddleware, createTechPack);
// router.get("/", getAllTechPacks);
router.get(
  "/",
  protect,
  allowModules(["general", "admin", "read_only"]),
  getAllTechPacks
);
router.get("/:id", getTechPackById);
router.get(
  "/generatePdf/:techpackId",
  allowModules(["general", "admin"]),
  generateTechPackPDF
);
router.put("/:id", protect, readOnlyMiddleware, updateTechPack);
router.delete("/:id", protect, readOnlyMiddleware, deleteTechPack);
router.get("/filtered/sp/f", getFilteredTechPacks);
router.get("/techpack/ids", getAllTechPackIds);
router.post(
  "/repeat/:techPackId",
  protect,
  readOnlyMiddleware,
  createRepeatTechPack
);
router.get("/vendor/:vendorId", getTechPacksByVendor);
router.post(
  "/quote",
  protect,
  readOnlyMiddleware,
  allowModules(["general", "admin"]),
  addTechPackQuote
);
router.get("/quote/:techPackId", getTechPackQuotes);
router.put(
  "/quote/:techPackId/:quoteIndex",
  protect,
  readOnlyMiddleware,
  updateTechPackQuote
);
router.delete(
  "/quote/:techPackId/:quoteIndex",
  protect,
  readOnlyMiddleware,
  deleteTechPackQuote
);
router.post(
  "/create-from-techpack/:techPackId",
  protect,
  readOnlyMiddleware,
  CreatetechPackInWorkOrder
);
router.get("/workorders/:techPackId", getWorkOrdersByTechPack);
router.get("/sales-contracts/sales", getSalesContracts);
router.put(
  "/salescontract/:contractId/quote/index/:index/status",
  protect,
  readOnlyMiddleware,
  updateTechPackQuoteByIndex
);
router.get("/vendor/own/techpacks", protect, getVendorTechPacks);
module.exports = router;
