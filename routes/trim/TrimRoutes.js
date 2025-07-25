const express = require("express");
const multer = require("multer");
const { protect } = require("../../middleware/authMiddleware");
const readOnlyMiddleware = require("../../middleware/readOnlyMiddleware");
const {
  createTrim,
  getTrims,
  getTrimById,
  updateTrim,
  deleteTrim,
  Names,
  filterNames,
  getTrimByName,
  searchTrims,
  getAllTrimNames,
} = require("../../controllers/trim/TrimController");
const { allowModules } = require("../../middleware/moduleAccess");

const router = express.Router();
const upload = multer();

router.post("/", upload.single("previewImage"), createTrim);
// router.get("/", getTrims);
router.get(
  "/",
  protect,
  allowModules(["general", "admin", "read_only"]),
  getTrims
);
router.get("/getnames", Names);
router.get("/search", searchTrims);
router.get("/names", filterNames);
router.get("/:id", getTrimById);
router.put(
  "/:id",
  protect,
  readOnlyMiddleware,
  upload.single("previewImage"),
  updateTrim
);
router.delete("/:id", deleteTrim);
router.get("/trims/names", getAllTrimNames);
router.get("/trims/name/:name", getTrimByName);

module.exports = router;
