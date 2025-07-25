module.exports = (req, res, next) => {
  const userType = req.user?.type;
  if (userType === "read_only" && req.method !== "GET") {
    return res
      .status(403)
      .json({ message: "Read-only users cannot perform this action." });
  }
  next();
};
