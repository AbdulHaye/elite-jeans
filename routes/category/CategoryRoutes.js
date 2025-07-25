const express = require("express");
const router = express.Router();
const categoryController = require("../../controllers/category/CategoryController");

router.get("/", categoryController.getAllCategories);
router.post("/", categoryController.createCategory);
router.delete("/:id", categoryController.deleteCategory);
router.put("/:id", categoryController.updateCategory);

module.exports = router;
