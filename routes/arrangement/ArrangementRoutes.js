const express = require("express");
const router = express.Router();
const arrangementController = require("../../controllers/arrangement/ArrangementController");
const { protect } = require("../../middleware/authMiddleware");
const { allowModules } = require("../../middleware/moduleAccess");
const readOnlyMiddleware = require("../../middleware/readOnlyMiddleware");

router.post(
  "/",
  protect,
  readOnlyMiddleware,
  arrangementController.createArrangement
);
router.get(
  "/getFilteredArrangements/:vendorId",
  arrangementController.getFilteredArrangements
);
router.get(
  "/getArrangementsByAsn/:asnId",
  arrangementController.getArrangementsByAsn
);
router.get(
  "/",
  protect,
  allowModules(["shipping", "admin"]),
  arrangementController.getAllArrangements
);
router.get("/:id", arrangementController.getArrangementById);
router.put(
  "/:id",
  protect,
  readOnlyMiddleware,
  arrangementController.updateArrangement
);
router.delete(
  "/:id",
  protect,
  readOnlyMiddleware,
  arrangementController.deleteArrangement
);
router.get(
  "/vendor/:vendorId",
  arrangementController.getArrangementsByVendorId
);

module.exports = router;
