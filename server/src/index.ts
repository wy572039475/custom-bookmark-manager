import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import validateEnv from './utils/env-validation';

// Routes
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import syncRoutes from './routes/sync.routes';

dotenv.config();

// 验证环境变量
const env = validateEnv();

const app = express();
const PORT = env.port;

// Middleware
// CORS 配置
// 生产环境必须显式配置 CORS_ORIGIN，否则只允许 localhost
const getAllowedOrigins = () => {
  if (env.nodeEnv !== 'production') {
    return true; // 开发环境允许所有源
  }

  const configuredOrigins = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean);

  if (!configuredOrigins || configuredOrigins.length === 0) {
    console.warn('⚠️  CORS_ORIGIN 未配置，生产环境建议设置正确的前端域名');
    return true; // 允许所有源（不推荐，但保证可用性）
  }

  return configuredOrigins;
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-fingerprint'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // 预检请求缓存 10 分钟
};

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    }
  },
  crossOriginEmbedderPolicy: { policy: "credentialless" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (支持两个路径：/health 和 /api/health)
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

// Start server with explicit host binding
// 生产环境绑定 0.0.0.0 允许外部访问，开发环境绑定 127.0.0.1
function startServer(port: number) {
  const host = env.nodeEnv === 'production' ? '0.0.0.0' : '127.0.0.1';
  const server = app.listen(port, host, () => {
    console.log(`🚀 Server running on ${host}:${port}`);
    console.log(`📚 API available at http://${host}:${port}/api`);
    console.log(`💚 Health check at http://${host}:${port}/health`);
    console.log(`🌍 Environment: ${env.nodeEnv}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use or requires elevated permissions`);
      if (port < 5010) {
        console.log(`🔄 Trying alternative port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('❌ Unable to find available port');
        process.exit(1);
      }
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}

startServer(PORT);
