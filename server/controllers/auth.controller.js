const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/activityLogger');
const { sendEmail } = require('../utils/emailService');
const passwordResetTemplate = require('../utils/emailTemplates/passwordReset');

const signToken = (payload, secret, expiry) =>
  jwt.sign(payload, secret, { expiresIn: expiry });

const sendTokens = (user, res) => {
  const accessToken = signToken(
    { userId: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    process.env.JWT_EXPIRY || '30m'
  );
  const refreshToken = signToken(
    { userId: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    process.env.REFRESH_TOKEN_EXPIRY || '7d'
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return accessToken;
};

// POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, company, phone } = req.body;
    console.log('Signup attempt:', { email, role });

    const exists = await User.findOne({ email });
    if (exists) return next(new AppError('Email already registered', 409, 'CONFLICT'));

    const user = await User.create({ name, email, password, role, company, phone });

    const accessToken = sendTokens(user, res);

    await logActivity({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'created',
      recordType: 'user',
      recordId: user._id,
      recordReference: user.email,
      details: 'New user registered',
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      console.log('Login failed for:', email);
      await logActivity({
        action: 'login_failed',
        details: `Failed login attempt for ${email}`,
        ipAddress: req.ip,
      });
      return next(new AppError('Invalid email or password', 401, 'UNAUTHORIZED'));
    }

    if (!user.isActive) {
      return next(new AppError('Account is deactivated. Contact admin.', 403, 'FORBIDDEN'));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const accessToken = sendTokens(user, res);

    await logActivity({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'login',
      recordType: 'user',
      recordId: user._id,
      recordReference: user.email,
      details: 'User logged in',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken');
    await logActivity({
      userId: req.user?.userId,
      action: 'logout',
      details: 'User logged out',
      ipAddress: req.ip,
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return next(new AppError('No refresh token', 401, 'UNAUTHORIZED'));

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) return next(new AppError('User not found', 401, 'UNAUTHORIZED'));

    const accessToken = signToken(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      process.env.JWT_EXPIRY || '30m'
    );

    res.json({ success: true, accessToken });
  } catch (err) {
    next(new AppError('Invalid refresh token', 401, 'UNAUTHORIZED'));
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendEmail(user.email, 'Reset Your VendorBridge Password', passwordResetTemplate({ name: user.name, resetUrl }));

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Token is invalid or has expired', 400, 'VALIDATION_ERROR'));

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, logout, refreshToken, forgotPassword, resetPassword };
