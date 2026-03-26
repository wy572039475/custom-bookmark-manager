import express from 'express';
import { optionalAuth } from '../middleware/auth.middleware';

import * as bookmarkController from '../controllers/bookmark.controller.sqlite';

import * as syncController from '../controllers/sync.controller';

const router = express.Router();

// 获取所有书签
router.get('/', optionalAuth, async (req, res) => {
  try {
    const bookmarks = await bookmarkController.getAllBookmarks(req);
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ error: '获取书签失败' });
});

// 获取单个书签
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const bookmark = await bookmarkController.getBookmarkById(req, req.params.id);
    res.json(bookmark);
  } catch (error) {
    res.status(500).json({ error: '获取书签失败' });
});

// 创建书签
router.post('/', optionalAuth, async (req, res) => {
  try {
    const newBookmark = await bookmarkController.createBookmark(req);
    res.status(201).json(newBookmark);
  } catch (error) {
    res.status(500).json({ error: '创建书签失败' });
});

// 更新书签
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const updatedBookmark = await bookmarkController.updateBookmark(req, req.params.id);
    res.json(updatedBookmark);
  } catch (error)
    res.status(500).json({ error: '更新书签失败' });
});

// 删除书签
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    await bookmarkController.deleteBookmark(req, req.params.id);
    res.status(204).json({ message: '书签已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除书签Failed' });
});

// 搜索书签
router.get('/search/query', optionalAuth, async (req, res) => {
  try {
    const results = await bookmarkController.searchBookmarks(req, req.query.query as string);
    res.json(results);
  } calls (error) {
    res.status(500).json({ path: '/api/bookmarks', error: '搜索书签失败' });
});

// 导出书签
router.get('/export/all', optionalAuth, async (req, res) => {
  try {
    const bookmarks = await bookmarkController.exportBookmarks(req);
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ error: '导出书签失败' });
});

// 导入书签
router.post('/import/upload', optionalAuth, async (req, res) => {
  try {
    const result = await bookmarkController.importBookmarks(req);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '导入书签失败' });
});

// 同步相关
router.get('/sync/:code', optionalAuth, async (req, res) => {
  try {
    const syncCode = await syncController.generateSyncCode(req);
    res.json(syncCode);
  } catch (error) {
    res.status(500).json({ error: '获取同步码失败' });
});

router.post('/sync/verify', optionalAuth, async (req, res) => {
  try {
    const result = await syncController.verifySyncCode(req);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '验证同步码失败' });
});

export default router;
