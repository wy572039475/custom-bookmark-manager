import { Router } from 'express';
import { getAll, create, update, remove } from '../controllers/category.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// 所有路由都使用可选认证，既支持 token 认证，也支持设备指纹认证
router.get('/', optionalAuth, getAll);
router.post('/', optionalAuth, create);
router.put('/:id', optionalAuth, update);
router.delete('/:id', optionalAuth, remove);

export default router;
