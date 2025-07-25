exports.allowModules = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure req.user exists and has roles
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        message: "Access denied. No user roles found.",
      });
    }

    // Normalize roles - ensure they're in array format
    const userRoles = Array.isArray(req.user.role)
      ? req.user.role
      : [req.user.role].filter(Boolean);

    // Check if user has any of the allowed roles
    const hasAccess = allowedRoles.some(
      (role) => userRoles.includes(role) || userRoles.includes("admin") // Always allow admin
    );

    if (!hasAccess) {
      return res.status(403).json({
        message:
          "Access denied. You do not have permission to access this module.",
        requiredRoles: allowedRoles,
        yourRoles: userRoles,
      });
    }

    next();
  };
};
