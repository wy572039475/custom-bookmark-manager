import { Request, Response } from 'express';
import { query } from '../db';
import { generateSyncCode } from '../utils/sync-code';

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

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    const result = await query(
      'SELECT id, fingerprint, name, color, icon, sort_order, created_at FROM categories WHERE fingerprint = ? ORDER BY sort_order',
      [fingerprint]
    );

    res.json(result.rows.map((row: any) => ({
      id: row.id,
      userId: row.fingerprint,
      name: row.name,
      color: row.color,
      icon: row.icon,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
    })));
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({ message: '获取分类列表失败' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { name, color, icon } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    if (!name) {
      return res.status(400).json({ message: '分类名称不能为空' });
    }

    // 确保设备存在
    await ensureDeviceExists(fingerprint);

    // 获取当前最大排序值
    const maxOrder = await query(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM categories WHERE fingerprint = ?',
      [fingerprint]
    );

    const sortOrder = ((maxOrder.rows[0] as any).max_order || 0) + 1;

    const result = await query(
      'INSERT INTO categories (fingerprint, name, color, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
      [fingerprint, name, color || '#3b82f6', icon || null, sortOrder]
    );

    // 获取刚插入的记录
    const newCategory = await query(
      'SELECT id, fingerprint, name, color, icon, sort_order, created_at FROM categories WHERE id = ?',
      [result.lastInsertRowid]
    );

    const category = newCategory.rows[0] as any;
    res.status(201).json({
      id: category.id,
      userId: category.fingerprint,
      name: category.name,
      color: category.color,
      icon: category.icon,
      sortOrder: category.sort_order,
      createdAt: category.created_at,
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({ message: '创建分类失败' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { id } = req.params;
    const { name, color, icon, sortOrder } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    // 验证分类是否属于该设备
    const checkResult = await query(
      'SELECT id FROM categories WHERE id = ? AND fingerprint = ?',
      [id, fingerprint]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: '分类不存在或无权访问' });
    }

    await query(
      `UPDATE categories SET 
        name = COALESCE(?, name), 
        color = COALESCE(?, color), 
        icon = COALESCE(?, icon), 
        sort_order = COALESCE(?, sort_order) 
      WHERE id = ? AND fingerprint = ?`,
      [name, color, icon, sortOrder, id, fingerprint]
    );

    // 获取更新后的记录
    const updatedCategory = await query(
      'SELECT id, fingerprint, name, color, icon, sort_order, created_at FROM categories WHERE id = ?',
      [id]
    );

    if (updatedCategory.rows.length === 0) {
      return res.status(404).json({ message: '分类不存在' });
    }

    const category = updatedCategory.rows[0] as any;
    res.json({
      id: category.id,
      userId: category.fingerprint,
      name: category.name,
      color: category.color,
      icon: category.icon,
      sortOrder: category.sort_order,
      createdAt: category.created_at,
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({ message: '更新分类失败' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const fingerprint = req.headers['x-fingerprint'] as string;
    const { id } = req.params;

    if (!fingerprint) {
      return res.status(400).json({ message: '缺少设备指纹' });
    }

    // 验证分类是否属于该设备
    const checkResult = await query(
      'SELECT id FROM categories WHERE id = ? AND fingerprint = ?',
      [id, fingerprint]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: '分类不存在或无权访问' });
    }

    await query('DELETE FROM categories WHERE id = ?', [id]);

    // 将该分类下的书签设为无分类
    await query('UPDATE bookmarks SET category_id = NULL WHERE category_id = ?', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({ message: '删除分类失败' });
  }
};
