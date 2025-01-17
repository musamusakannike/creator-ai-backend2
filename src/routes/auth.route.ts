import { Router } from 'express';
import passport from 'passport';
import { loginSuccess, loginFailure, logout } from '../controllers/auth.controller';

const router = Router();

// Google Auth Route
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google Auth Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    res.redirect('/auth/success');
  }
);

// Auth Success Route
router.get('/success', loginSuccess);

// Auth Failure Route
router.get('/failure', loginFailure);

// Logout Route
router.get('/logout', logout);

export default router;
