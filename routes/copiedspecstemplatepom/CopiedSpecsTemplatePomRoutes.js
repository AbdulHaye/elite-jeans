const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/authMiddleware");
const { allowModules } = require("../../middleware/moduleAccess");
const readOnlyMiddleware = require("../../middleware/readOnlyMiddleware");

const copiedPomsController = require("../../controllers/copiedspecstemplatepom/CopiedSpecsTemplatePomController");

router.delete(
  "/api/delete/:deletedid",
  protect,
  readOnlyMiddleware,
  copiedPomsController.deleteCopiedPOMRecord
);
router.delete(
  "/api/delete-multiple",
  protect,
  readOnlyMiddleware,
  copiedPomsController.deleteMultiplePOMRecords
);
router.put(
  "/api/update/:pomId",
  protect,
  readOnlyMiddleware,
  allowModules(["general", "admin"]),
  copiedPomsController.updateCopiedPOMRecord
);
router.get("/api/copied/POM/:id", copiedPomsController.getCopiedPOMById);
router.get(
  "/api/copied/:specTemplateId",
  copiedPomsController.getCopiedPOMsBySpecTemplateId
);
router.get(
  "/api/copied-poms/:sampleGradedSpecsId/:specTemplateId",
  copiedPomsController.getCopiedPOMsBySampleAndTemplate
);
router.put(
  "/api/update-multiple",
  protect,
  readOnlyMiddleware,
  copiedPomsController.updateMultipleCopiedPOMs
);
router.post(
  "/api/copied-poms/:sampleGradedSpecsId/:specTemplateId",
  protect,
  readOnlyMiddleware,
  copiedPomsController.createCopiedPOM
);

router.post(
  "/api/copied-poms-multiple/:sampleGradedSpecsId/:specTemplateId",
  protect,
  readOnlyMiddleware,
  copiedPomsController.addPOMsToCopiedPOMs
);

module.exports = router;
