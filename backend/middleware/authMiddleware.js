const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  try {
    // Read token from secure httpOnly cookie
    let token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token cryptographic signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the secure userId to the request
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
