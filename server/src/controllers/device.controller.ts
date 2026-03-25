import { Request, Response } from 'express';
import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';

// 生成6位同步码
function generateSyncCode(): string {
  return uuidv4().slice(0, 6).toUpperCase();
}

 // 生成指纹ID（如果不存在）
async function generateFingerprint(): Promise<string> {
  return `fp_${uuidv4()}`;
}

 // 注册或获取设备
export const registerOrGetDevice = async (req: Request, res: Response) => {
  try {
    const { fingerprint, syncCode } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少指纹标识' });
    }

    // 检查设备是否已存在
    let existingDevice = await query(
      'SELECT fingerprint, sync_code FROM devices WHERE fingerprint = $1',
      [fingerprint]
    );

    if (existingDevice.rows.length > 0) {
      // 设备已存在，返回信息
      const device = existingDevice.rows[0];
      return res.json({
        fingerprint: device.fingerprint,
        syncCode: device.sync_code,
        isNew: false,
      });
    }

    // 设备不存在，创建新设备
    let newSyncCode = syncCode || generateSyncCode();

    const result = await query(
      'INSERT INTO devices (fingerprint, sync_code) VALUES ($1, $2) RETURN fingerprint, sync_code',
      [fingerprint, newSyncCode]
    );

    const device = result.rows[0];
    return res.status(201).json({
      fingerprint: device.fingerprint,
      syncCode: device.sync_code,
      isNew: true,
    });
  } catch (error) {
    console.error('设备注册失败:', error);
    res.status(500).json({ message: '设备注册失败' });
  }
};

// 通过同步码获取或绑定设备
export const restoreDevice = async (req: Request, res: Response) => {
  try {
    const { syncCode, fingerprint } = req.body;

    if (!syncCode) {
      return res.status(400).json({ message: '缺少同步码' });
    }

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少指纹标识' });
    }

    // 查找同步码对应的设备
    const existingDevice = await query(
      'SELECT fingerprint, sync_code FROM devices WHERE sync_code = $1',
      [syncCode]
    );

    if (existingDevice.rows.length === 0) {
      return res.status(404).json({ message: '同步码无效' });
    }

    const device = existingDevice.rows[0];

    // 如果提供了新的指纹，将其绑定到该同步码
    if (fingerprint !== device.fingerprint) {
      // 将新指纹添加为该设备的附加指纹
      await query(
        'INSERT INTO device_fingerprints (device_fingerprint, original_fingerprint) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [fingerprint, device.fingerprint]
      );

      // 或者直接更新设备的主指纹
      // await query(
      //   'UPDATE devices SET fingerprint = $1 WHERE sync_code = $2',
      //   [fingerprint, syncCode]
      // );
    }

    return res.json({
      fingerprint: device.fingerprint,
      syncCode: device.sync_code,
      restored: true,
    });
  } catch (error) {
    console.error('恢复设备失败:', error);
    res.status(500).json({ message: '恢复设备失败' });
  }
};

// 重新生成同步码
export const regenerateSyncCode = async (req: Request, res: Response) => {
  try {
    const { fingerprint } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少指纹标识' });
    }

    // 生成新的同步码
    let newSyncCode = generateSyncCode();
    let attempts = 0;

    // 确保同步码唯一
    while (attempts < 10) {
      const existing = await query(
        'SELECT id FROM devices WHERE sync_code = $1',
        [newSyncCode]
      );

      if (existing.rows.length > 0) {
        newSyncCode = generateSyncCode();
        attempts++;
      } else {
        break;
      }
    }

    if (attempts >= 10) {
      return res.status(500).json({ message: '生成同步码失败' });
    }

    // 更新同步码
    await query(
      'UPDATE devices SET sync_code = $1 WHERE fingerprint = $2',
      [newSyncCode, fingerprint]
    );

    res.json({ syncCode: newSyncCode });
  } catch (error) {
    console.error('重新生成同步码失败:', error);
    res.status(500).json({ message: '重新生成同步码失败' });
  }
};

// 获取设备信息
export const getDeviceInfo = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.params.fingerprint;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少指纹标识' });
    }

    const result = await query(
      'SELECT fingerprint, sync_code, created_at FROM devices WHERE fingerprint = $1',
      [fingerprint]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '设备不存在' });
    }

    const device = result.rows[0];
    res.json({
      fingerprint: device.fingerprint,
      syncCode: device.sync_code,
      createdAt: device.created_at,
    });
  } catch (error) {
    console.error('获取设备信息失败:', error);
    res.status(500).json({ message: '获取设备信息失败' });
  }
};
