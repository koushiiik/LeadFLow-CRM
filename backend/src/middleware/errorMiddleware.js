const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found`,
    errors: [`Cannot ${req.method} ${req.originalUrl}`],
  });
};

const errorHandler = (err, req, res, next) => {
  // MongoDB Cast Error (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID format',
      errors: [`The provided ID '${err.value}' is not a valid MongoDB ObjectId`],
    });
  }

  // MongoDB Duplicate Key Error (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
      errors: [`Duplicate value for field: ${field}`],
    });
  }

  // Validation Error from Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Validation error',
      errors: messages,
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
      errors: ['Invalid token signature'],
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authorization token has expired',
      errors: ['Token expired'],
    });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Never return stack traces or sensitive configuration in API errors
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred',
    errors: [err.message || 'Internal server error'],
  });
};

module.exports = { notFoundHandler, errorHandler };
