const { ApiError } = require("../utils/ApiError");

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Authentication required." });
    }

    const userRole = req.user.role || (req.user.isAdmin ? "admin" : "student");

    if (allowedRoles.length && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to access this resource." });
    }

    next();
  };
};

module.exports = authorize;
module.exports.authorize = authorize;
