import jwt from 'jsonwebtoken';
import passport from 'passport';
import User from '../models/User.js';

// Helper function to sign JWT
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET || 'supersecretkeyforgravtyexpensetracker12345!',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res, next) => {
  const { email, password, full_name } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      full_name,
    });

    const token = signToken(user);

    return res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        user_metadata: { full_name: user.full_name },
      },
      token,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
// @access  Public
export const signin = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info ? info.message : 'Login failed' });
    }

    // Login successful
    const token = signToken(user);

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        user_metadata: { full_name: user.full_name },
      },
      token,
    });
  })(req, res, next);
};

// @desc    Get logged in user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      user_metadata: { full_name: req.user.full_name },
    },
  });
};
