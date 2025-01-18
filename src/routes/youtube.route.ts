import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getDashboardStats } from "../controllers/youtube.controller";

const router = Router();
router.get(
  "/analytics",
  authenticate,
  getDashboardStats
);
