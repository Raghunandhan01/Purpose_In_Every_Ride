import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB, isUsingRealMongoDB } from './server/config/db.js';
import authRoutes from './server/routes/authRoutes.js';
import platformRoutes from './server/routes/platformRoutes.js';
import workLogRoutes from './server/routes/workLogRoutes.js';
import analyticsRoutes from './server/routes/analyticsRoutes.js';
import reportRoutes from './server/routes/reportRoutes.js';
import translateRoutes from './server/routes/translateRoutes.js';
import predictionRoutes from './server/routes/predictionRoutes.js';
import emergencyFundRoutes from './server/routes/emergencyFundRoutes.js';
import { checkAndRunScheduledReports } from './server/services/weeklyReportService.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Connect database
  await connectDB();

  // Run the background scheduler for weekly reports (checks every 5 minutes)
  checkAndRunScheduledReports().catch(console.error);
  setInterval(() => {
    checkAndRunScheduledReports().catch(console.error);
  }, 5 * 60 * 1000);

  // Trust proxy for rate limiting behind load balancer
  app.set('trust proxy', 1);

  // Middleware
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for Vite dev server compatibility
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan('dev'));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // increased slightly for responsive UI fetching
  });
  app.use('/api/', limiter);

  // Routes
  app.get('/api/db-status', (req, res) => {
    res.json({
      success: true,
      usingRealDB: isUsingRealMongoDB(),
      mongodbUriSet: !!(process.env.MONGODB_URI || process.env.MONGO_URI)
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/platforms', platformRoutes);
  app.use('/api/worklogs', workLogRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/translate', translateRoutes);
  app.use('/api/predictions', predictionRoutes);
  app.use('/api/emergency-fund', emergencyFundRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
