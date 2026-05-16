// =============================================
// routes/userRoutes.js — User API Routes
// =============================================
// Maps HTTP endpoints to controller functions.

const express    = require('express');
const router     = express.Router();
const { registerUser, loginUser, logoutUser } = require('../controllers/userController');

// POST /api/users/register — Create a new account
router.post('/register', registerUser);

// POST /api/users/login — Sign in and get userId
router.post('/login', loginUser);

// POST /api/users/logout — Clear secure cookie
router.post('/logout', logoutUser);

module.exports = router;
