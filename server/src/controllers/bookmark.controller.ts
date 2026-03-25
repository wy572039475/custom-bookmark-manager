import { Request, Response } from 'express';
import { query } from '../db';
import { generateSyncCode } from '../utils/sync-code';
import { validateUrl } from '../utils/validation';
import { transformBookmark, transformBookmarks, transformCategories } from '../utils/bookmark-transform';

// 确保设备存在
async function ensureDeviceExists(fingerprint: string): Promise<void> {
  const result = await query(
    'SELECT fingerprint FROM devices WHERE fingerprint = ?',
    [fingerprint]
  );
  
  if (result.rows.length === 0) {
    // 设备不存在，自动创建
    await query(
      'INSERT INTO devices (fingerprint, sync_code) VALUES (?, ?)',
      [fingerprint, generateSyncCode()]
    );
  }
}

export const getAll = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { categoryId, search } = req.query;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    let sql = 'SELECT id, fingerprint, category_id, title, url, description, icon, tags, sort_order, visit_count, last_visited, created_at, updated_at FROM bookmarks WHERE fingerprint = ?';
    const params: any[] = [fingerprint];

    if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }

    if (search) {
      // 限制搜索关键词长度
      const searchQuery = (search as string).trim().slice(0, 100);
      if (searchQuery) {
        // 转义特殊字符
        const escapedQuery = searchQuery.replace(/[%_\\]/g, '\\$&');
        const searchPattern = `%${escapedQuery}%`;
        sql += ' AND (title LIKE ? ESCAPE \'\\\' OR url LIKE ? ESCAPE \'\\\' OR description LIKE ? ESCAPE \'\\\')';
        params.push(searchPattern, searchPattern, searchPattern);
      }
    }

    sql += ' ORDER BY sort_order, created_at DESC';

    const result = await query(sql, params);
    res.json(transformBookmarks(result.rows as any[]));
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ message: '获取收藏列表失败' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { id } = req.params;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    const result = await query(
      'SELECT * FROM bookmarks WHERE id = ? AND fingerprint = ?',
      [id, fingerprint]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '收藏不存在' });
    }

    res.json(transformBookmark(result.rows[0] as any));
  } catch (error) {
    console.error('获取收藏失败:', error);
    res.status(500).json({ message: '获取收藏失败' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { categoryId, title, url, description, icon, tags, sortOrder } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    if (!title || !url) {
      return res.status(400).json({ message: '标题和URL不能为空' });
    }

    if (!validateUrl(url)) {
      return res.status(400).json({ message: 'URL格式不正确' });
    }

    // 确保设备存在
    await ensureDeviceExists(fingerprint);

    const result = await query(
      'INSERT INTO bookmarks (fingerprint, category_id, title, url, description, icon, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [fingerprint, categoryId || null, title, url, description || '', icon || null, JSON.stringify(tags || []), sortOrder || 0]
    );

    // 获取刚插入的记录
    const newBookmark = await query(
      'SELECT * FROM bookmarks WHERE id = ?',
      [result.lastInsertRowid]
    );

    res.status(201).json(transformBookmark(newBookmark.rows[0] as any));
  } catch (error) {
    console.error('创建收藏失败:', error);
    res.status(500).json({ message: '创建收藏失败' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { id } = req.params;
    const { categoryId, title, url, description, icon, tags, sortOrder } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    // 验证书签是否属于该设备
    const checkResult = await query(
      'SELECT id FROM bookmarks WHERE id = ? AND fingerprint = ?',
      [id, fingerprint]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: '收藏不存在或无权访问' });
    }

    if (url && !validateUrl(url)) {
      return res.status(400).json({ message: 'URL格式不正确' });
    }

    await query(
      `UPDATE bookmarks SET 
        category_id = ?, 
        title = COALESCE(?, title), 
        url = COALESCE(?, url), 
        description = COALESCE(?, description), 
        icon = ?, 
        tags = COALESCE(?, tags), 
        sort_order = COALESCE(?, sort_order), 
        updated_at = datetime('now') 
      WHERE id = ?`,
      [categoryId, title, url, description, icon, tags ? JSON.stringify(tags) : null, sortOrder, id]
    );

    // 获取更新后的记录
    const updatedBookmark = await query(
      'SELECT * FROM bookmarks WHERE id = ?',
      [id]
    );

    res.json(transformBookmark(updatedBookmark.rows[0] as any));
  } catch (error) {
    console.error('更新收藏失败:', error);
    res.status(500).json({ message: '更新收藏失败' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { id } = req.params;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    // 验证书签是否属于该设备
    const checkResult = await query(
      'SELECT id FROM bookmarks WHERE id = ? AND fingerprint = ?',
      [id, fingerprint]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: '收藏不存在或无权访问' });
    }

    await query('DELETE FROM bookmarks WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('删除收藏失败:', error);
    res.status(500).json({ message: '删除收藏失败' });
  }
};

export const incrementVisit = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { id } = req.params;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    await query(
      'UPDATE bookmarks SET visit_count = visit_count + 1, last_visited = datetime(\'now\') WHERE id = ? AND fingerprint = ?',
      [id, fingerprint]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('更新访问次数失败:', error);
    res.status(500).json({ message: '更新访问次数失败' });
  }
};

export const search = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { q } = req.query;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: '请提供搜索关键词' });
    }

    // 限制搜索关键词长度，防止过长查询
    const searchQuery = q.trim().slice(0, 100);

    if (searchQuery.length < 1) {
      return res.status(400).json({ message: '搜索关键词不能为空' });
    }

    // 转义特殊字符，防止 LIKE 注入
    const escapedQuery = searchQuery.replace(/[%_\\]/g, '\\$&');
    const searchPattern = `%${escapedQuery}%`;

    const result = await query(
      `SELECT id, fingerprint, category_id, title, url, description, icon, tags, sort_order, visit_count, last_visited, created_at, updated_at
       FROM bookmarks
       WHERE fingerprint = ? AND (title LIKE ? ESCAPE '\\' OR url LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')
       ORDER BY visit_count DESC, created_at DESC
       LIMIT 100`,
      [fingerprint, searchPattern, searchPattern, searchPattern]
    );

    res.json(transformBookmarks(result.rows as any));
  } catch (error) {
    console.error('搜索收藏失败:', error);
    res.status(500).json({ message: '搜索收藏失败' });
  }
};

export const exportBookmarks = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    // 导出书签
    const bookmarksResult = await query(
      'SELECT * FROM bookmarks WHERE fingerprint = ?',
      [fingerprint]
    );

    // 导出分类
    const categoriesResult = await query(
      'SELECT * FROM categories WHERE fingerprint = ?',
      [fingerprint]
    );

    // 转换为驼峰命名格式，与导入时期望的格式一致
    const bookmarks = bookmarksResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.fingerprint,
      categoryId: row.category_id,
      title: row.title,
      url: row.url,
      description: row.description,
      icon: row.icon,
      tags: row.tags ? JSON.parse(row.tags) : [],
      sortOrder: row.sort_order,
      visitCount: row.visit_count,
      lastVisited: row.last_visited,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const categories = categoriesResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.fingerprint,
      name: row.name,
      color: row.color,
      icon: row.icon,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
    }));

    const exportData = {
      bookmarks,
      categories,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    // 返回 JSON 字符串作为文件下载
    const jsonData = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonData, 'utf-8');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bookmarks-${new Date().toISOString().split('T')[0]}.json`
    );
    res.status(200).send(buffer);
  } catch (error) {
    console.error('导出收藏失败:', error);
    res.status(500).json({ message: '导出收藏失败' });
  }
};

export const importBookmarks = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }
    if (!req.file) {
      return res.status(400).json({ message: '请上传文件' });
    }
    const fileContent = JSON.parse(req.file.buffer.toString());
    // 支持两种格式：
    // 1. 旧格式：只有书签数组 [...bookmarks]
    // 2. 新格式：包含 bookmarks 和 categories 的对象 { bookmarks: [...], categories: [...] }
    const bookmarks = Array.isArray(fileContent) ? fileContent : (fileContent.bookmarks || []);
    const categories = fileContent.categories || [];
    if (!Array.isArray(bookmarks)) {
      return res.status(400).json({ message: '文件格式不正确' });
    }
    // 确保设备存在
    await ensureDeviceExists(fingerprint);
    // 分类ID映射：旧ID -> 新ID
    const categoryIdMap: Record<string, string> = {};
    // 获取现有分类名称列表（用于去重）
    const existingCategoriesResult = await query(
      'SELECT id, name FROM categories WHERE fingerprint = ?',
      [fingerprint]
    );
    const existingCategoryNames = new Map(
      existingCategoriesResult.rows.map((r: any) => [r.name.toLowerCase(), r.id])
    );
    // 批量导入分类
    let importedCategoryCount = 0;
    for (const category of categories) {
      const name = category.name || '未命名分类';
      const existingId = existingCategoryNames.get(name.toLowerCase());
      if (existingId) {
        categoryIdMap[category.id] = existingId;
      } else {
        const result = await query(
          'INSERT INTO categories (fingerprint, name, color, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
          [fingerprint, name, category.color || '#3b82f6', category.icon || null, category.sortOrder ?? category.sort_order ?? 0]
        );
        const newId = result.lastInsertRowid;
        categoryIdMap[category.id] = String(newId);
        existingCategoryNames.set(name.toLowerCase(), String(newId));
        importedCategoryCount++;
      }
    }
    // 获取现有URL列表
    const existingResult = await query(
      'SELECT url FROM bookmarks WHERE fingerprint = ?',
      [fingerprint]
    );
    const existingUrls = new Set(existingResult.rows.map((r: any) => r.url));
    // 过滤出需要导入的书签
    const bookmarksToImport = bookmarks.filter((b: any) => b.url && !existingUrls.has(b.url));
    const importedBookmarkCount = bookmarksToImport.length;
    // 批量插入书签
    if (bookmarksToImport.length > 0) {
      // SQLite 不支持多行 VALUES，需要逐条插入
      for (const bookmark of bookmarksToImport) {
        const oldCategoryId = bookmark.categoryId || bookmark.category_id || null;
        const categoryId = oldCategoryId ? (categoryIdMap[oldCategoryId] || null) : null;
        const title = bookmark.title || bookmark.url;
        const url = bookmark.url;
        const description = bookmark.description || '';
        const icon = bookmark.icon || null;
        const tags = JSON.stringify(bookmark.tags || []);
        const sortOrder = bookmark.sortOrder ?? bookmark.sort_order ?? 0;
        const visitCount = bookmark.visitCount ?? bookmark.visit_count ?? 1;
        
        await query(
          `INSERT INTO bookmarks (fingerprint, category_id, title, url, description, icon, tags, sort_order, visit_count, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [fingerprint, categoryId, title, url, description, icon, tags, sortOrder, visitCount]
        );
      }
    }
    res.json({
      message: `成功导入 ${importedBookmarkCount} 个收藏和 ${importedCategoryCount} 个分类`,
      importedBookmarkCount,
      importedCategoryCount,
    });
  } catch (error) {
    console.error('导入收藏失败:', error);
    res.status(500).json({ message: '导入收藏失败' });
  }
};
