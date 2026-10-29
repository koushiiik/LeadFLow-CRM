const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing or invalid format',
      errors: ['Bearer token is required to access this resource'],
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'leadflow_crm_super_secret_jwt_key_evaluation_2026');
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
        errors: ['User not found'],
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
      errors: [err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token signature'],
    });
  }
};

module.exports = { protect };
