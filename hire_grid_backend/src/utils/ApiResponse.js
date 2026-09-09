class ApiResponse {
  static success(res, data = {}, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      ...data,
    });
  }

  static error(res, message = "An error occurred", statusCode = 500, errors = null) {
    const payload = {
      success: false,
      error: message,
    };
    if (errors) {
      payload.errors = errors;
    }
    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
