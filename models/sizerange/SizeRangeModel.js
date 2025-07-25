const mongoose = require("mongoose");

const rangeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sizes: { type: Map, of: String },
});

const SizeRange = mongoose.model("SizeRange", rangeSchema);

module.exports = SizeRange;
