import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import validateEnv from './utils/env-validation';

// Routes
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import syncRoutes from './routes/sync.routes';

// Import all controllers
import * as authController from './controllers/auth.controller';
import * as categoryController from './controllers/category.controller';
import * as bookmarkController from './controllers/bookmark.controller.sqlite';
import * as syncController from './controllers/sync.controller';

dotenv.config();

// 验证环境变量
const env = validateEnv();

const app = express();
const PORT = env.port;

// Middleware - Helmet security headers
app.use(helmet());

// CORS 配置
const getAllowedOrigins = () => {
  if (env.nodeEnv !== 'production') {
    return true; // 开发环境允许所有源
  }
  const configuredOrigins = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean);
  if (!configuredOrigins || configuredOrigins.length === 0) {
    console.warn('⚠️  CORS_ORIGIN 未配置');
    return true; // 允许所有源（保证可用)
  }
  return configuredOrigins;
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-fingerprint'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
const healthCheck = (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    database: process.env.TURSO_DATABASE_URL ? 'turso' : 'local'
  });
};
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/sync', syncRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Export app for Vercel
export default app;
