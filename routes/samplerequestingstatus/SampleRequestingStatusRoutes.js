const express = require("express");
const router = express.Router();
const sampleRequestingStatusController = require("../../controllers/samplerequestingstatus/SampleRequestingStatusController"); // Adjust path if needed

router.post(
  "/sampleRequestingStatus",
  sampleRequestingStatusController.createSampleRequestingStatus
);
router.get(
  "/sampleRequestingStatus",
  sampleRequestingStatusController.getAllSampleRequestingStatuses
);
router.get(
  "/sampleRequestingStatus/:id",
  sampleRequestingStatusController.getSampleRequestingStatusById
);
router.put(
  "/sampleRequestingStatus/:id",
  sampleRequestingStatusController.updateSampleRequestingStatus
);
router.delete(
  "/sampleRequestingStatus/:id",
  sampleRequestingStatusController.deleteSampleRequestingStatus
);

module.exports = router;
