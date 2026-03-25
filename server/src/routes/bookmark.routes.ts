import { Router } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'postgres';

// 根据存储类型动态加载控制器
let bookmarkController: any;

async function loadController() {
  if (!bookmarkController) {
    if (STORAGE_TYPE === 'sqlite') {
      console.log('📦 使用 SQLite 控制器');
      bookmarkController = await import('../controllers/bookmark.controller.sqlite');
    } else {
      console.log('📦 使用 PostgreSQL 控制器');
      bookmarkController = await import('../controllers/bookmark.controller');
    }
  }
  return bookmarkController;
}

const router = Router();

// 包装所有路由，动态加载控制器
router.get('/', async (req, res, next) => {
  const controller = await loadController();
  return controller.getAll(req, res, next);
});

router.get('/:id', async (req, res, next) => {
  const controller = await loadController();
  return controller.getById(req, res, next);
});

router.post('/', async (req, res, next) => {
  const controller = await loadController();
  return controller.create(req, res, next);
});

router.put('/:id', async (req, res, next) => {
  const controller = await loadController();
  return controller.update(req, res, next);
});

router.delete('/:id', async (req, res, next) => {
  const controller = await loadController();
  return controller.remove(req, res, next);
});

router.post('/:id/visit', async (req, res, next) => {
  const controller = await loadController();
  return controller.incrementVisit(req, res, next);
});

router.get('/search/query', async (req, res, next) => {
  const controller = await loadController();
  return controller.search(req, res, next);
});

router.get('/export/all', async (req, res, next) => {
  const controller = await loadController();
  return controller.exportBookmarks(req, res, next);
});

router.post('/import/upload', async (req, res, next) => {
  const controller = await loadController();
  return controller.importBookmarks(req, res, next);
});

export default router;
