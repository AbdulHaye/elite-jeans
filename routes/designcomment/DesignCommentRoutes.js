const express = require("express");
const multer = require("multer");
const designCommentsController = require("../../controllers/designcomment/DesignCommentController");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Allow multiple images under "images_url" field
// routes/designComments.js
router.post(
  "/designComments",
  upload.array("images_url", 20),
  designCommentsController.createDesignComment
);
router.get("/designComments", designCommentsController.getAllDesignComments);
router.get(
  "/designComments/:workOrderId/:styleNumber",
  designCommentsController.getDesignCommentsByWorkOrderAndStyle
);
router.get('/CombinedLogslog/style/:styleNumber', designCommentsController.getCombinedLogsByStyleNumber);


router.get(
  "/designComments/:id",
  designCommentsController.getDesignCommentById
);
router.put(
  "/designComments/:workOrderId/:styleNumber",
  upload.array("images_url", 20),
  designCommentsController.updateDesignComment
);
router.delete(
  "/designComments/:id",
  designCommentsController.deleteDesignComment
);
module.exports = router;
