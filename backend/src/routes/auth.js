import express from 'express';
import { signup, signin, getProfile } from '../controllers/authController.js';
import passport from 'passport';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);

// Protected routes
router.get('/profile', passport.authenticate('jwt', { session: false }), getProfile);

export default router;
