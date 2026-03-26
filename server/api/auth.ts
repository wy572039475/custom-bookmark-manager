import express from 'express';
import { autoLogin, getProfile } from '../controllers/auth.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = express.Router();

// 自动登录
router.post('/auto-login', autoLogin);

router.get('/profile', optionalAuth, getProfile);

// 登录 (用于测试)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // 这里需要实现登录逻辑
    // 暂时返回模拟响应
    res.json({
      message: 'Login successful',
      user: { username }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
});

// 注册 (用于开发测试)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // 这里需要实现注册逻辑
    // 暂时返回模拟响应
    res.json({
      message: 'Registration successful',
      user: { username, email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
});

export default router;
