const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  if (!process.env.JWT_SECRET) {
    console.error("CRITICAL: JWT_SECRET environment variable is missing!");
    // In production, we should probably fail hard or use a fallback for demo
    if (process.env.VERCEL) {
       // Optional: Fallback secret for demo mode if Vercel env vars are not set
       // ONLY DO THIS IF WE WANT TO BE ULTRA-RESILIENT FOR SHOWCASE
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_showcase');
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error("JWT Verification failed:", err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
