import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import validateEnv from '../utils/env-validation';
import { generateSyncCode } from '../utils/sync-code';

const env = validateEnv();

export const autoLogin = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    // 检查设备是否已存在
    const result = await query(
      'SELECT fingerprint, username, email, created_at FROM devices WHERE fingerprint = ?',
      [fingerprint]
    );

    let deviceData;
    if (result.rows.length > 0) {
      // 设备已存在,直接返回
      deviceData = result.rows[0] as any;
    } else {
      // 设备不存在,自动创建匿名设备用户
      const username = `访客${Date.now().toString().slice(-6)}`;
      const email = `guest_${Date.now()}@auto.local`;

      const createResult = await query(
        'INSERT INTO devices (fingerprint, username, email, sync_code) VALUES (?, ?, ?, ?)',
        [fingerprint, username, email, generateSyncCode()]
      );

      // 获取刚插入的记录
      const newDevice = await query(
        'SELECT fingerprint, username, email, created_at FROM devices WHERE fingerprint = ?',
        [fingerprint]
      );

      deviceData = newDevice.rows[0] as any;
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: deviceData.fingerprint, fingerprint },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    res.json({
      user: {
        id: deviceData.fingerprint,
        username: deviceData.username,
        email: deviceData.email,
        createdAt: deviceData.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('自动登录失败:', error);
    res.status(500).json({ message: '自动登录失败' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    const result = await query(
      'SELECT fingerprint, username, email, created_at FROM devices WHERE fingerprint = ?',
      [fingerprint]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const user = result.rows[0] as any;

    res.json({
      id: user.fingerprint,
      username: user.username,
      email: user.email,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
};
