// models/LabelTrim.js
const mongoose = require('mongoose');

const labelTrimSchema = new mongoose.Schema({
  name: String,
  // add other fields as needed
});

module.exports = mongoose.model('LabelTrim', labelTrimSchema);