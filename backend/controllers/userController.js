// =============================================
// controllers/userController.js — User Logic
// =============================================
// Contains the actual business logic for auth.
// Routes just call these functions.

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate token and set cookie
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    // In production (Vercel → Render): cross-site HTTPS requires secure+sameSite:none
    // In development (localhost HTTP): secure must be false or browser rejects the cookie
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

// ── POST /api/users/register ───────────────────────────────
// Creates a new user account.
// Returns the userId so the frontend can store it right away.
const registerUser = async (req, res) => {
  // Destructure the request body
  const { name, email, password } = req.body;
  console.log("registering user", req.body);
  try {
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Check if email is already taken
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create user — password hashing is handled in the model's pre-save hook
    const user = await User.create({ name, email, password });
    console.log("generating token for user", user);
    // Generate token and set it as an HTTP-Only cookie
    generateTokenAndSetCookie(res, user._id);
    console.log("token generated and set as cookie");
    // Respond with the info the frontend needs
    res.status(201).json({
      name: user.name,
      email: user.email,
    });

  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ── POST /api/users/login ──────────────────────────────────
// Verifies credentials and returns the userId.
// No JWT — the frontend just stores userId in localStorage.
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Look up user by email
    const user = await User.findOne({ email });

    // Verify user exists AND password is correct
    if (user && (await user.matchPassword(password))) {
      generateTokenAndSetCookie(res, user._id);
      res.json({
        name: user.name,
        email: user.email,
      });
    } else {
      // Don't reveal which field was wrong (security best practice)
      res.status(401).json({ message: 'Invalid email or password' });
    }

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ── POST /api/users/logout ──────────────────────────────────
// Clears the secure cookie.
const logoutUser = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ message: 'Logged out successfully' });
};

module.exports = { registerUser, loginUser, logoutUser };
