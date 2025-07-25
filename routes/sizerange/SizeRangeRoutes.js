const express = require("express");
const {
  createRange,
  getAllRanges,
  getRangeById,
  updateRangeById,
  deleteRangeById,
  getAllNamesAndIds,
} = require("../../controllers/sizerange/SizeRangeController");
const router = express.Router();

router.get("/allget", getAllNamesAndIds);
router.post("/", createRange);
router.get("/", getAllRanges);
router.get("/:id", getRangeById);
router.put("/:id", updateRangeById);
router.delete("/:id", deleteRangeById);

module.exports = router;

// router.put("/:id", updateSizeRange);

// router.delete("/:id", deleteSizeRange);

// router.get("/:id", getSizeRangeById);

// router.get("/all/name", getSpecificName);

// router.get("/", getAllSizeRanges);

// -------------
