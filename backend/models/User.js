// =============================================
// models/User.js — User Schema & Model
// =============================================
// Defines the "shape" of a user document in MongoDB.
// Also handles password hashing automatically before saving.

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,            // Remove extra whitespace
    },
    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,            // No duplicate emails
      lowercase: true,           // Always store as lowercase
      trim:     true,
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ── Pre-save hook ──────────────────────────────────────────
// Runs automatically BEFORE every .save() call.
// Hashes the plain-text password so we never store it as-is.
userSchema.pre('save', async function (next) {
  // Only re-hash if the password field was actually changed
  if (!this.isModified('password')) return next();

  // genSalt(10) creates a random "salt" — extra data mixed into the hash
  // Higher number = more secure but slower. 10 is a safe standard.
  const salt     = await bcrypt.genSalt(10);
  this.password  = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method ────────────────────────────────────────
// Lets us call  user.matchPassword('plaintext')  during login.
// bcrypt.compare hashes the input and checks it matches the stored hash.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
