const jwt = require("jsonwebtoken");
const config = require("../config");
const { ApiError } = require("../utils/ApiError");

const authenticate = (req, res, next) => {
  const JWT_SECRET = config.jwt.secret;
  if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is not set.");
    return res.status(500).json({ error: "Server authentication configuration error." });
  }

  let token;

  // Check Authorization header for Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Access denied. Invalid token." });
  }
};

module.exports = authenticate;
module.exports.authenticate = authenticate;
