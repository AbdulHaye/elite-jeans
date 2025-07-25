const User = require("../../models/user/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { username, password, repeatPassword, type, notification, vendor } =
      req.body;
    // Validate required fields
    if (!username || !password || !repeatPassword || !type) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled." });
    }
    // Ensure passwords match
    if (password !== repeatPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }
    let role = [];
    if (type === "user") {
      role = req.body.role || [];
      if (role.length === 0) {
        return res
          .status(400)
          .json({ message: "Role must be provided for user type." });
      }
    } else if (type === "admin") {
      role = ["admin"];
    } else if (type === "vendor") {
      role = ["vendor"];
    } else if (type === "read_only") {
      role = ["read_only"];
    }
    // Create a new user
    const newUser = new User({
      username,
      password,
      type,
      role,
      notification,
      vendor: type === "vendor" ? vendor : null,
      status: "active",
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    let { username, password } = req.body;
    username = username.trim();
    password = password.trim();
    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact admin.",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role, vendor: user.vendor || null },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        username: user.username,
        role: user.role,
        type: user.type,
        ...(user.type === "vendor" && { vendor: user.vendor }),
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllUsers = async (_req, res) => {
  try {
    // Check if user is authenticated and has admin role
    // if (!req.user || !req.user.role || !req.user.role.includes("admin")) {
    //   return res.status(403).json({ message: "Access denied. Admins only." });
    // }
    const users = await User.find({}, "-password").populate("vendor");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, password, repeatPassword, notification, vendor } =
      req.body;
    // Check if user is authenticated and has admin role
    if (!req.user || !req.user.role || !req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (username !== undefined) user.username = username;
    if (role !== undefined) user.role = role;
    if (notification !== undefined) user.notification = notification;
    if (vendor !== undefined) user.vendor = vendor;
    if (password !== undefined || repeatPassword !== undefined) {
      if (!password || !repeatPassword) {
        return res.status(400).json({
          message: "Both password and repeatPassword are required.",
        });
      }
      if (password !== repeatPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
      }
      user.password = password;
    }
    await user.save();
    res.status(200).json({ message: "User updated successfully." });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if user is authenticated and has admin role
    if (!req.user || !req.user.role || !req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.setUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    // Check if user is authenticated and has admin role
    if (!req.user || !req.user.role || !req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    if (!["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be 'active' or 'inactive'." });
    }
    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ message: `User status updated to ${status}.` });
  } catch (error) {
    console.error("Error updating user status:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
