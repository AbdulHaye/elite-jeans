// middlewares/logDesignCommentChanges.js
const DesignCommentLog = require("../models/designLogs/DesignCommentLog");

async function logDesignCommentChange(originalDoc, updatedDoc, action, userId) {
  try {
    // Determine what changed
    const changes = {};
    const previousState = {};
    const newState = {};

    // Compare all fields
    for (const field in updatedDoc.toObject()) {
      if (JSON.stringify(originalDoc[field]) !== JSON.stringify(updatedDoc[field])) {
        changes[field] = {
          from: originalDoc[field],
          to: updatedDoc[field]
        };
        previousState[field] = originalDoc[field];
        newState[field] = updatedDoc[field];
      }
    }

    // Only log if there are actual changes
    if (Object.keys(changes).length > 0) {
      await DesignCommentLog.create({
        designCommentId: originalDoc._id,
        workOrder_Id: originalDoc.workOrder_Id,
        styleNumber: originalDoc.styleNumber,
        changedBy: userId,
        action,
        changes,
        previousState,
        newState
      });
    }
  } catch (error) {
    console.error("Error logging design comment change:", error);
  }
}

module.exports = logDesignCommentChange;