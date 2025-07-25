const express = require("express");
const router = express.Router();
const copiedSampleGradedSpecsController = require("../../controllers/copiedsamplegradedspecs/CopiedSampleGradedSpecsController");
const { protect } = require("../../middleware/authMiddleware");
const { allowModules } = require("../../middleware/moduleAccess");

// Route to create a copied sample graded spec
router.post(
  "/create",
  protect,
  allowModules(["general", "admin"]),
  copiedSampleGradedSpecsController.createCopiedSampleGradedSpecs
);
router.post(
  "/override",
  protect,
  allowModules(["general", "admin"]),
  copiedSampleGradedSpecsController.overrideCopiedSampleGradedSpecs
);

router.get(
  "/get/:id",
  protect,
  allowModules(["general", "admin"]),
  copiedSampleGradedSpecsController.getCopiedSampleGradedSpecsById
);

router.get(
  "/copied-sample-graded-specs/workorder/:workOrderId",
  protect,
  allowModules(["general", "admin"]),
  copiedSampleGradedSpecsController.getCopiedSampleGradedSpecsByWorkOrderId
);
router.get(
  "/copied-sample-graded-specs/techpack/:techPackId",
  protect,
  allowModules(["general", "admin"]),
  copiedSampleGradedSpecsController.getCopiedSampleGradedSpecsByTechPackId
);
router.put(
  "/copiedSampleGradedSpecs/:id",
  protect,
  allowModules(["general", "admin"]),
  copiedSampleGradedSpecsController.updateCopiedSampleGradedSpecs
);

router.put(
  "/:id/realpomsupdateCopiedSampleGradedSpecs",
  protect,
  allowModules(["general", "admin"]),
  copiedSampleGradedSpecsController.updatePOM
);

router.post(
  "/:id/deleteCopiedPom",
  protect,
  allowModules(["general", "admin"]),
  copiedSampleGradedSpecsController.deleteCopiedPom
);

router.post(
  "/:id/add-size",
  protect,
  allowModules(["general", "admin"]),
  copiedSampleGradedSpecsController.addSizeToCopiedSample
);

router.delete(
  "/:id/delete-size/:size",
  protect,
  allowModules(["general", "admin"]),
  copiedSampleGradedSpecsController.deleteSizeFromCopiedSample
);

router.delete(
  "/copied-sample-graded-specs/:id",
  protect,
  allowModules(["general", "admin"]),
  copiedSampleGradedSpecsController.deleteCopiedSampleGradedSpecs
);

module.exports = router;
