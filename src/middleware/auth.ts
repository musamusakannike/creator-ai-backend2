import { RequestHandler } from "express";
import { verifyToken } from "../utils/jwt";
import userModel from "../models/user.model";

export const authenticate: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return; // Explicitly return to satisfy TypeScript
  }

  const token = authHeader.split(" ")[1];
  try {
    // Decode the token
    const decoded = verifyToken(token);

    // Fetch the full user object from the database
    const user = await userModel.findById(decoded.id);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Attach the full user object to the request
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
    return; // Explicitly return to satisfy TypeScript
  }
};
