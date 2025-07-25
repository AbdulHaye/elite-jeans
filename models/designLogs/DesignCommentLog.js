// models/DesignCommentLog.js
const mongoose = require('mongoose');

const DesignCommentLogSchema = new mongoose.Schema({
  styleNumber: {
    type: String,
    required: true,
    index: true
  },
  comment_completed_by: {
    type: String,
    required: true,
  },
  stage: {
    type: String,
    enum: ['PP1', 'PP2', 'PP3', 'Shipping', 'Other'],
    required: true
  },
  status: {
    type: String,
    enum: ['Approved', 'Approved with Corrections', 'Rejected'],
    required: true
  },
  comments: String,
  images_url: [String],
  logDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('DesignCommentLog', DesignCommentLogSchema);