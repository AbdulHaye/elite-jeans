const express = require("express");
const router = express.Router();
const {
  updateGlobalDates,
  addGlobalDates,
} = require("../controllers/controller3");

router.post("/", addGlobalDates);
router.put("/global-dates/update", updateGlobalDates);
module.exports = router;
