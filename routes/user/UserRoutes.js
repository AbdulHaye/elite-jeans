const express = require("express");
const {
  register,
  login,
  getAllUsers,
  updateUser,
  deleteUser,
  setUserStatus,
} = require("../../controllers/user/UserController");
const { protect, isAdmin } = require("../../middleware/authMiddleware");
const router = express.Router();

// Public Routes
router.post("/register", register); // User registration (No token required)
router.post("/login", login); // User login (No token required)

// Protected Routes (authentication required)
router.get("/all", protect, isAdmin, getAllUsers); // Get all users, only authenticated users can access
router.put("/update/:id", protect, isAdmin, updateUser); // Only admin can update users
router.delete("/delete/:id", protect, isAdmin, deleteUser); // Only admin can delete users

//  Admin can activate/deactivate user
router.patch("/:id/status", protect, isAdmin, setUserStatus);

// Test Token Route
router.get("/test-token", protect, (req, res) => {
  res.json({ message: "Token is valid", user: req.user }); // Respond with the authenticated user
});

module.exports = router;
