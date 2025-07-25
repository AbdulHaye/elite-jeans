const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
  uploadPattern,
  getAllPatterns,
  getPatternById,
  deletePattern,
  updateDigitalPattern,
  getPatternsByWorkOrderId,
} = require("../../controllers/digitalpattern/DigitalPatternController");

router.post("/upload", upload.single("file"), uploadPattern);
router.get("/", getAllPatterns);
router.get("/:id", getPatternById);
router.put("/update/:id", upload.single("file"), updateDigitalPattern);
router.delete("/:id", deletePattern);
router.get("/by-workorder/:workOrder_Id", getPatternsByWorkOrderId);

module.exports = router;
