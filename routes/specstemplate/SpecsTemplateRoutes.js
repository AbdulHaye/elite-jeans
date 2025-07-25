const express = require("express");
const router = express.Router();
const specsTemplateController = require("../../controllers/specstemplate/SpecsTemplateController");

const { protect } = require("../../middleware/authMiddleware");
const { allowModules } = require("../../middleware/moduleAccess");
const readOnlyMiddleware = require("../../middleware/readOnlyMiddleware");

router.post(
  "/",
  protect,
  readOnlyMiddleware,
  specsTemplateController.createSpecsTemplate
);
router.get(
  "",
  protect,
  allowModules(["general", "admin"]),
  specsTemplateController.getAllSpecsTemplates
);
router.get("/:id", specsTemplateController.getSpecsTemplateById);
router.put(
  "/:id",
  protect,
  readOnlyMiddleware,
  specsTemplateController.updateSpecsTemplate
);
router.delete(
  "/:id",
  protect,
  readOnlyMiddleware,
  specsTemplateController.deleteSpecsTemplate
);

module.exports = router;
