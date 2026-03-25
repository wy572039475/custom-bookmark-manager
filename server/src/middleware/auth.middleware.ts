import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import validateEnv from '../utils/env-validation';

const env = validateEnv();

// 设备指纹格式验证
const FINGERPRINT_REGEX = /^[a-zA-Z0-9_-]{32,64}$/;

function validateFingerprint(fingerprint: string): boolean {
  if (!fingerprint || typeof fingerprint !== 'string') {
    return false;
  }
  return FINGERPRINT_REGEX.test(fingerprint);
}

function sanitizeFingerprint(fingerprint: string): string {
  return fingerprint.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

export interface AuthRequest extends Request {
  userId?: string;
  fingerprint?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 从多个来源获取认证信息
    const authHeader = req.headers['authorization'];
    const rawFingerprint = req.headers['x-fingerprint'] as string;

    // 验证并清理设备指纹
    if (rawFingerprint && !validateFingerprint(rawFingerprint)) {
      console.warn(`Invalid fingerprint format: ${rawFingerprint.slice(0, 8)}...`);
      return res.status(400).json({ message: '设备指纹格式无效' });
    }

    const fingerprint = rawFingerprint ? sanitizeFingerprint(rawFingerprint) : undefined;

    // 优先使用 token 认证
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, env.jwtSecret) as any;

        // 验证 token 中的数据
        if (!decoded.userId || !decoded.fingerprint) {
          return res.status(401).json({ message: 'Token 数据不完整' });
        }

        // 验证 token 中的设备指纹格式
        if (!validateFingerprint(decoded.fingerprint)) {
          return res.status(401).json({ message: 'Token 中的设备指纹无效' });
        }

        req.userId = decoded.userId;
        req.fingerprint = decoded.fingerprint;

        // 验证设备指纹是否匹配（如果请求中提供了指纹）
        if (fingerprint && fingerprint !== decoded.fingerprint) {
          console.warn(`Fingerprint mismatch: ${fingerprint.slice(0, 8)} vs ${decoded.fingerprint.slice(0, 8)}`);
          return res.status(403).json({ message: '设备指纹不匹配' });
        }

        return next();
      } catch (tokenError: any) {
        if (tokenError.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token 已过期，请重新登录' });
        }
        if (tokenError.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: 'Token 无效' });
        }
        // Token 无效，继续尝试设备指纹认证
        console.warn('Token verification failed:', tokenError.message);
      }
    }

    // 如果 token 无效，使用设备指纹认证
    if (fingerprint) {
      req.fingerprint = fingerprint;
      req.userId = fingerprint; // 设备指纹作为用户ID
      return next();
    }

    // 都没有，返回错误
    return res.status(401).json({ message: '未授权：缺少有效的认证信息' });
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({ message: '认证处理失败' });
  }
};

// 可选的认证中间件（允许未认证用户访问）
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const rawFingerprint = req.headers['x-fingerprint'] as string;

    // 验证并清理设备指纹
    if (rawFingerprint) {
      if (!validateFingerprint(rawFingerprint)) {
        // 可选认证：格式错误时不阻止，但记录警告
        console.warn(`Invalid fingerprint format in optional auth: ${rawFingerprint.slice(0, 8)}...`);
      } else {
        const fingerprint = sanitizeFingerprint(rawFingerprint);
        req.fingerprint = fingerprint;
        req.userId = fingerprint;
      }
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, env.jwtSecret) as any;

        // 验证 token 中的数据
        if (decoded.userId && decoded.fingerprint && validateFingerprint(decoded.fingerprint)) {
          req.userId = decoded.userId;
          req.fingerprint = decoded.fingerprint;
        }
      } catch (tokenError) {
        // Token 无效，忽略（可选认证）
      }
    }

    next();
  } catch (error) {
    // 可选认证失败，继续执行
    next();
  }
};

export default authMiddleware;
