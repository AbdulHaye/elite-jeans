const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/authMiddleware");
const readOnlyMiddleware = require("../../middleware/readOnlyMiddleware");

const specsTemplatePomController = require("../../controllers/specstemplatepom/SpecsTemplatePomController");

router.get(
  "/byGarmentAndSize",
  specsTemplatePomController.getTemplatesByGarmentAndSize
);
router.post(
  "/addPOMs",
  protect,
  readOnlyMiddleware,
  specsTemplatePomController.addSelectedPOMs
);
router.delete(
  "/deleted/:deletedid",
  protect,
  readOnlyMiddleware,
  specsTemplatePomController.deletePOMRecord
);
router.delete(
  "/deletemultiple/delete",
  protect,
  readOnlyMiddleware,
  specsTemplatePomController.deleteMultiplePOMRecords
);
router.put(
  "/edit/:pomId",
  protect,
  readOnlyMiddleware,
  specsTemplatePomController.updatePOMRecord
);
router.get(
  "/poms/Byid/:specTemplateId",
  specsTemplatePomController.getPOMsBySpecTemplateId
);
// TODO: Register endpoint for removing size
router.post(
  "/poms/Byid/:specTemplateId/add-size",
  specsTemplatePomController.addSizeToPOMs
);
router.post(
  "/poms/Byid/:specTemplateId/delete-size",
  specsTemplatePomController.deleteSizeFromPOMs
);
router.get(
  "/getPOMsByTemplate/:id",
  specsTemplatePomController.getPOMsByTemplate
);

module.exports = router;
