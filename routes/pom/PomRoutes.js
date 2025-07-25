const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authMiddleware");

const {
  createPointOfMeasure,
  getAllPointsOfMeasure,
  getPointOfMeasureById,
  updatePointOfMeasure,
  deletePointOfMeasure,
  filterPointOfMeasures,
  getPaginatedPointsOfMeasure,
} = require("../../controllers/pom/PomController");
const { allowModules } = require("../../middleware/moduleAccess");

router.get("/filter", filterPointOfMeasures);
router.post("/", createPointOfMeasure);
router.get(
  "/",
  protect,
  allowModules(["general", "admin", "editSpecsTemplates"]),
  getAllPointsOfMeasure
);
router.get("/:id", getPointOfMeasureById);
router.put("/:id", updatePointOfMeasure);
router.delete("/:id", deletePointOfMeasure);
router.get(
  "/paginated/list",
  protect,
  allowModules(["general", "admin"]),
  getPaginatedPointsOfMeasure
);

module.exports = router;
