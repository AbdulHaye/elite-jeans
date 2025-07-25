const express = require("express");
const multer = require("multer");
const { protect } = require("../../middleware/authMiddleware");
const readOnlyMiddleware = require("../../middleware/readOnlyMiddleware");
const {
  uploadImage,
  getCategories,
  getImagesByCategory,
  deleteImage,
  activateImage,
  deactivateImage,
  updateImage,
  getImages,
  getAllPictures,
} = require("../../controllers/picture/PictureController");
const { allowModules } = require("../../middleware/moduleAccess");
const router = express.Router();
const upload = multer();

router.post("/", upload.single("imageUrl"), uploadImage);
router.get(
  "/",
  protect,
  allowModules(["general", "admin", "read_only"]),
  getAllPictures
);
router.get("/cat_name", getCategories);
router.get("/:category", getImagesByCategory);
router.get("/images", getImages);
router.delete("/:id", protect, readOnlyMiddleware, deleteImage);
router.patch("/activate/:id", protect, readOnlyMiddleware, activateImage);
router.patch("/deactivate/:id", protect, readOnlyMiddleware, deactivateImage);
router.put("/update/:id", protect, readOnlyMiddleware, updateImage);

module.exports = router;
