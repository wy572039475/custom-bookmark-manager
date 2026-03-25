import { Router } from 'express';
import {
  getSyncCode,
  bindDevice,
  regenerateSyncCode,
  getLinkedDevices,
  unbindDevice
} from '../controllers/sync.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 获取当前设备的同步码
router.get('/code', authMiddleware, getSyncCode);

// 通过同步码绑定设备
router.post('/bind', authMiddleware, bindDevice);

// 重新生成同步码
router.post('/regenerate', authMiddleware, regenerateSyncCode);

// 获取已绑定的设备列表
router.get('/devices', authMiddleware, getLinkedDevices);

// 解绑设备
router.delete('/unbind/:deviceFingerprint', authMiddleware, unbindDevice);

export default router;
