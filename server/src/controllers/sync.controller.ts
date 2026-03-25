import { Request, Response } from 'express';
import { query } from '../db';
import { generateSyncCode } from '../utils/sync-code';

// 获取设备的同步码
export const getSyncCode = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    const result = await query(
      'SELECT fingerprint, sync_code, created_at FROM devices WHERE fingerprint = ?',
      [fingerprint]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '设备不存在' });
    }

    const row = result.rows[0] as any;
    res.json({
      fingerprint: row.fingerprint,
      syncCode: row.sync_code,
    });
  } catch (error) {
    console.error('获取同步码失败:', error);
    res.status(500).json({ message: '获取同步码失败' });
  }
};

// 通过同步码绑定设备
export const bindDevice = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { syncCode } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    if (!syncCode) {
      return res.status(400).json({ message: '缺少同步码' });
    }

    // 查找同步码对应的设备
    const targetDeviceResult = await query(
      'SELECT fingerprint, username, email, sync_code FROM devices WHERE sync_code = ?',
      [syncCode]
    );

    if (targetDeviceResult.rows.length === 0) {
      return res.status(404).json({ message: '同步码无效' });
    }

    const targetDevice = targetDeviceResult.rows[0] as any;

    // 如果当前设备已经是目标设备，直接返回
    if (targetDevice.fingerprint === fingerprint) {
      return res.json({
        message: '设备已是同步状态',
        device: {
          fingerprint: targetDevice.fingerprint,
          username: targetDevice.username,
          email: targetDevice.email,
        },
      });
    }

    // 添加设备关联
    await query(
      'INSERT INTO device_fingerprints (device_fingerprint, original_fingerprint) VALUES (?, ?)',
      [fingerprint, targetDevice.fingerprint]
    );

    // 更新当前设备的用户信息，使其与目标设备一致
    await query(
      'UPDATE devices SET username = ?, email = ? WHERE fingerprint = ?',
      [targetDevice.username, targetDevice.email, fingerprint]
    );

    res.json({
      message: '设备绑定成功',
      device: {
        fingerprint: targetDevice.fingerprint,
        username: targetDevice.username,
        email: targetDevice.email,
      },
    });
  } catch (error) {
    console.error('绑定设备失败:', error);
    
    // 处理唯一约束冲突（设备已绑定）
    if (error instanceof Error && (error.message.includes('UNIQUE constraint') || error.message.includes('unique constraint'))) {
      return res.status(400).json({ message: '设备已绑定到其他账户' });
    }
    
    res.status(500).json({ message: '绑定设备失败' });
  }
};

// 重新生成同步码
export const regenerateSyncCode = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    const newSyncCode = generateSyncCode();

    const result = await query(
      'UPDATE devices SET sync_code = ? WHERE fingerprint = ?',
      [newSyncCode, fingerprint]
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: '设备不存在' });
    }

    // 获取更新后的同步码
    const updatedDevice = await query(
      'SELECT sync_code FROM devices WHERE fingerprint = ?',
      [fingerprint]
    );

    if (updatedDevice.rows.length === 0) {
      return res.status(404).json({ message: '设备不存在' });
    }

    res.json({
      message: '同步码更新成功',
      syncCode: (updatedDevice.rows[0] as any).sync_code,
    });
  } catch (error) {
    console.error('重新生成同步码失败:', error);
    res.status(500).json({ message: '重新生成同步码失败' });
  }
};

// 获取已绑定的设备列表
export const getLinkedDevices = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    // 查找主设备（通过 sync_code 查找）
    const mainDeviceResult = await query(
      'SELECT fingerprint, sync_code, username, email, created_at FROM devices WHERE fingerprint = ?',
      [fingerprint]
    );

    if (mainDeviceResult.rows.length === 0) {
      return res.status(404).json({ message: '设备不存在' });
    }

    const mainDevice = mainDeviceResult.rows[0] as any;

    // 查找所有关联的设备
    const linkedDevicesResult = await query(
      `SELECT 
        df.device_fingerprint,
        d.username,
        d.email,
        d.created_at
       FROM device_fingerprints df
       JOIN devices d ON df.device_fingerprint = d.fingerprint
       WHERE df.original_fingerprint = ?`,
      [mainDevice.fingerprint]
    );

    res.json({
      mainDevice: {
        fingerprint: mainDevice.fingerprint,
        syncCode: mainDevice.sync_code,
        username: mainDevice.username,
        email: mainDevice.email,
        createdAt: mainDevice.created_at,
      },
      linkedDevices: linkedDevicesResult.rows.map((row: any) => ({
        fingerprint: row.device_fingerprint,
        username: row.username,
        email: row.email,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('获取关联设备失败:', error);
    res.status(500).json({ message: '获取关联设备失败' });
  }
};

// 解绑设备
export const unbindDevice = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { deviceFingerprint } = req.params;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    // 删除设备关联
    await query(
      'DELETE FROM device_fingerprints WHERE device_fingerprint = ? AND original_fingerprint = ?',
      [deviceFingerprint, fingerprint]
    );

    res.status(204).send();
  } catch (error) {
    console.error('解绑设备失败:', error);
    res.status(500).json({ message: '解绑设备失败' });
  }
};
