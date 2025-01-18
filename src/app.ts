import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import passport from "./config/passport.config";
import session from "express-session";
import authRoutes from "./routes/auth.route";
import youtubeRoutes from "./routes/youtube.route";
import connectDB from "./config/db.config";

dotenv.config();

connectDB();
const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-fallback-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/youtube", youtubeRoutes);

export default app;
