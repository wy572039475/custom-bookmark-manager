import { Router } from 'express';
import { registerOrGetDevice, restoreDevice, getDeviceInfo, regenerateSyncCode } from '../controllers/device.controller';

const router = Router();

// 注册或获取设备（根据指纹自动创建/获取）
router.post('/register', registerOrGetDevice);

// 使用同步码恢复数据
router.post('/restore', restoreDevice);

// 获取设备信息
router.get('/:fingerprint', getDeviceInfo);

// 重新生成同步码
router.post('/regenerate-sync', regenerateSyncCode);

export default router;
