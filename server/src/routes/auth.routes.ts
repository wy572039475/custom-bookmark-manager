import { Router } from 'express';
import { autoLogin, getProfile } from '../controllers/auth.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// 自动登录 - 不需要认证（设备指纹在请求头中）
router.post('/auto-login', autoLogin);

// 获取用户信息 - 需要认证
router.get('/profile', optionalAuth, getProfile);

export default router;
