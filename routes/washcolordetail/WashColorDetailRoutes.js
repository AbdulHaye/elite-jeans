const express = require("express");
const router = express.Router();
const washColorNewDetailController = require("../../controllers/washcolordetail/WashColorDetailController");

router.post("/", washColorNewDetailController.createWashColorNewDetail);
router.get("/", washColorNewDetailController.getAllWashColorNewDetails);
router.get("/:id", washColorNewDetailController.getWashColorNewDetailById);
router.put("/:id", washColorNewDetailController.updateWashColorNewDetail);
router.delete("/:id", washColorNewDetailController.deleteWashColorNewDetail);

module.exports = router;
