const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Not authorized, no token', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, email }
    next();
  } catch (err) {
    return next(new AppError('Not authorized, token invalid', 401, 'UNAUTHORIZED'));
  }
};

module.exports = { protect };
