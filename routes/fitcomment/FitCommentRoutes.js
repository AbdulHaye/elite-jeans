const express = require("express");
const multer = require("multer");
const fitCommentsController = require("../../controllers/fitcomment/FitCommentController");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Allow multiple images for each view type
const uploadFields = upload.fields([
  { name: "front_view", maxCount: 15 },
  { name: "back_view", maxCount: 15 },
  { name: "side_view", maxCount: 15 },
  { name: "additional_pictures", maxCount: 15 }
]);

router.post(
  "/fitComments",
  upload.none(),
  fitCommentsController.createFitComment
);
router.get("/fitComments", fitCommentsController.getAllFitComments);
router.get(
  "/fitComments/:workOrderId/:styleNumber",
  fitCommentsController.getFitCommentsByWorkOrderAndStyle
);
router.get(
  "/fitComments/:id",
  fitCommentsController.getFitCommentById
);
router.put(
  "/fitComments/:workOrderId/:styleNumber",
  uploadFields,
  fitCommentsController.updateFitComment
);
router.delete(
  "/fitComments/:id",
  fitCommentsController.deleteFitComment
);




router.get(
  "/fitComments/logs/:styleNumber",
  fitCommentsController.getLogsByStyleNumber
);

module.exports = router;