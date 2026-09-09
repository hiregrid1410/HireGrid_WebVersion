const config = require("../config");
const { ApiError } = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!statusCode) {
    statusCode = 500;
  }

  // Preserve error response format expected by client
  // Client checks for res.data.error || res.data.message
  const response = {
    error: message || "Internal Server Error",
    ...(config.env === "development" && { stack: err.stack })
  };

  if (statusCode === 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;
