const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.header('x-auth-token');
  const jwtSecret = process.env.JWT_SECRET || 'CAREER_NAVIGATOR_V1_PRODUCTION_SECRET';

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error("JWT Verification failed:", err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
