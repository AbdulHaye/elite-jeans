const express = require("express");
const router = express.Router();

const sampleGradedSpecsController = require("../../controllers/samplegradedspecs/SampleGradedSpecsController");
const readOnlyMiddleware = require("../../middleware/readOnlyMiddleware");
const { protect } = require("../../middleware/authMiddleware");

router.post(
  "/",
  protect,
  readOnlyMiddleware,
  sampleGradedSpecsController.createSampleGradedSpecs
);
router.post(
  "/copy",
  protect,
  readOnlyMiddleware,
  sampleGradedSpecsController.copySampleGradedSpecsFromPreviousSamplespec
); 
router.get(
  "/poms-headers/:sampleGradedSpecsId",
  protect,
  sampleGradedSpecsController.getPomsHeaderscopysize
);


// Get all with style_number
// In your router file
// router.get(
//   "/samples-with-graded-specs",
//   protect,
//   readOnlyMiddleware,
//   sampleGradedSpecsController.getSamplesWithGradedSpecs
// );

//workorder graded spec data 
router.get(
  "/samples-with-graded-specs",
  protect,
  readOnlyMiddleware,
  sampleGradedSpecsController.getSamplesWithGradedSpecs
);
// techpack graded spec data
router.get(
  "/samples-with-graded-specs/techpack",
  protect,
  readOnlyMiddleware,
  sampleGradedSpecsController.getTechpackSamplesWithGradedSpecs
);

router.post(
  "/copy/techpack",
  protect,
  readOnlyMiddleware,
  sampleGradedSpecsController.copySampleGradedSpecsFromPreviousTechpack
);
router.get(
  "/allsamplespecs",
  protect,
  readOnlyMiddleware,
  sampleGradedSpecsController.getAllSampleGradedSpecss
);
// router.post(
//   "/copy",
//   protect,
//   readOnlyMiddleware,
//   sampleGradedSpecsController.copySampleGradedSpecs
// );
router.post(  
  "/create-techpack-based",
  protect,
  readOnlyMiddleware,
  sampleGradedSpecsController.createTechpackBasedSampleSpec
);
router.get("/", sampleGradedSpecsController.getAllSampleGradedSpecs);
router.get(
  "/specs/:workOrder_Id?",
  sampleGradedSpecsController.getAllSampleGradedSpecsByWorkOrderId
);
router.get(
  "/specs/techpack/:techpack_Id",
  sampleGradedSpecsController.getAllSampleGradedSpecsByWorkOrderId
);
router.get(
  "/specs/type/techpack-based",
  sampleGradedSpecsController.getAllTechpackBasedSampleGradedSpecs
);
router.get("/:id", sampleGradedSpecsController.getSampleGradedSpecsById);
router.put(
  "/:id",
  protect,
  readOnlyMiddleware,
  sampleGradedSpecsController.updateSampleGradedSpecsById
);
router.delete(
  "/:id",
  protect,
  readOnlyMiddleware,
  sampleGradedSpecsController.deleteSampleGradedSpecsById
);


// router.get('/specs/:workOrderId', sampleGradedSpecsController.getSpecsByWorkOrder);



module.exports = router;
