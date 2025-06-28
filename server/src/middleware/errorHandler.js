export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      success: false,
      message: `Validation Error: ${message}`,
      statusCode: 400
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      success: false,
      message: `${field} already exists`,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired',
      statusCode: 401
    };
  }

  // SQLite errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    error = {
      success: false,
      message: 'Resource already exists',
      statusCode: 400
    };
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    error = {
      success: false,
      message: 'Invalid reference to related resource',
      statusCode: 400
    };
  }

  res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};