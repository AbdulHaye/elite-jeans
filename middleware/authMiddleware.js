const jwt = require("jsonwebtoken");
const User = require("../models/user/UserModel");

const dotenv = require("dotenv");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Protect middleware to verify token and authenticate the user
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized. No token provided." });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized. Invalid token format." });
    }
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Unauthorized. Invalid token." });
    }
    // Find user in the database
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    // Add user data to the request object
    req.user = {
      id: user._id,
      role: Array.isArray(user.role) ? user.role : [user.role].filter(Boolean), // Ensure array
      vendor: Array.isArray(user.vendor)
        ? user.vendor
        : user.vendor
          ? [user.vendor]
          : [],
      type: user.type,
    };
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res
      .status(401)
      .json({ message: "Unauthorized. Token verification failed." });
  }
};

// Middleware to check if the user is an admin
exports.isAdmin = (req, res, next) => {
  if (
    req.user &&
    Array.isArray(req.user.role) &&
    req.user.role.includes("admin")
  ) {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admins only." });
};
