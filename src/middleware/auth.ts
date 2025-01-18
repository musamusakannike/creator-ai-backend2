// middleware/auth.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken } from "../utils/jwt";

export const authenticate: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return; // Explicitly return to satisfy TypeScript
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded; // Attach decoded token payload to the request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
    return; // Explicitly return to satisfy TypeScript
  }
};
