const express = require("express");
const router = express.Router();
const styleNewDetailController = require("../../controllers/stylenewdetail/StyleNewDetailController");

router.post("/", styleNewDetailController.createStyleNewDetail);
router.get("/", styleNewDetailController.getAllStyleNewDetails);
router.get("/:id", styleNewDetailController.getStyleNewDetailById);
router.put("/:id", styleNewDetailController.updateStyleNewDetail);
router.delete("/:id", styleNewDetailController.deleteStyleNewDetail);

module.exports = router;
