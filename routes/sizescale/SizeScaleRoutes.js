const express = require("express");
const router = express.Router();
const sizeScaleController = require("../../controllers/sizescale/SizeScaleController");

router.get("/", sizeScaleController.getAllSizeScales);
router.post("/", sizeScaleController.createSizeScale);
router.delete("/:id", sizeScaleController.deleteSizeScale);
router.put("/:id", sizeScaleController.updateSizeScale);

module.exports = router;
