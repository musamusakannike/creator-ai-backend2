import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route';
import connectDB from './config/db.config';

dotenv.config();

connectDB();
const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use('/auth', authRoutes);

export default app;
