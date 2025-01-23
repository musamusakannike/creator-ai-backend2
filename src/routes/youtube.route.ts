import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getAllChannelContent, getDashboardStats } from "../controllers/youtube.controller";

const router = Router();

// Route for fetching dashboard analytics
router.get(
  "/analytics",
  authenticate,
  getDashboardStats
);

// Route for fetching all channel content
router.get(
  "/contents",
  authenticate,
  getAllChannelContent
);

export default router;
