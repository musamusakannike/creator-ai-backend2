import { Router } from "express";
import passport from "passport";
import {
  loginSuccess,
  loginFailure,
  logout,
} from "../controllers/auth.controller";
import { generateToken } from '../utils/jwt';

const router = Router();

// Google Auth Route
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Auth Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/login" }),
  async (req, res): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication failed' });
      return;
    }
    // Generate a JWT for the authenticated user
    const user = req.user as any; // Adjust typing as needed
    const token = generateToken({ id: user.id, email: user.email });

    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
  }
);

// Auth Success Route
router.get("/success", loginSuccess);

// Auth Failure Route
router.get("/failure", loginFailure);

// Logout Route
router.get("/logout", logout);

export default router;
