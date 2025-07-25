const express = require("express");
const router = express.Router();
const sampleStatusController = require("../../controllers/samplestatus/SampleStatusController"); // Adjust path if needed

router.post("/sampleStatus", sampleStatusController.createSampleStatus);
router.get("/sampleStatus", sampleStatusController.getAllSampleStatuses);
router.get("/sampleStatus/:id", sampleStatusController.getSampleStatusById);
router.put("/sampleStatus/:id", sampleStatusController.updateSampleStatus);
router.delete("/sampleStatus/:id", sampleStatusController.deleteSampleStatus);

module.exports = router;
