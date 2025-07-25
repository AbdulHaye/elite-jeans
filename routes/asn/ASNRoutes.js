const express = require("express");
const router = express.Router();

const {
  createASN,
  getAllASNs,
  getASNById,
  getItemDetailsByVendorForShipping,
  getNextASNAndArrangementNumber,
  updateASN,
} = require("../../controllers/asn/ASNController");

router.post("/create", createASN);
router.get("/asn-next-number", getNextASNAndArrangementNumber);
router.get("/get", getAllASNs);
router.get("/get/:id", getASNById);
router.get("/vendor/:vendorId", getItemDetailsByVendorForShipping);
router.put("/update/:id", updateASN); 
module.exports = router;
