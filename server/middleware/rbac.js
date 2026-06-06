const { AppError } = require('./errorHandler');

// Middleware factory — pass allowed roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

// Role constants for cleaner usage
const ROLES = {
  ADMIN: 'admin',
  OFFICER: 'procurement_officer',
  MANAGER: 'manager',
  VENDOR: 'vendor',
};

module.exports = { authorize, ROLES };
