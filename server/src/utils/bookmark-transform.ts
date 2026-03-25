/**
 * 书签数据转换工具
 * 统一处理数据库字段到 API 响应的转换
 */

// 数据库原始书签记录格式（蛇形命名）
export interface DatabaseBookmarkRow {
  id: number;
  fingerprint: string;
  category_id: number | null;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  tags: string | null;
  sort_order: number;
  visit_count: number;
  last_visited: string | null;
  created_at: string;
  updated_at: string;
}

// 数据库原始分类记录格式（蛇形命名）
export interface DatabaseCategoryRow {
  id: number;
  fingerprint: string;
  name: string;
  color: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

// API 响应书签格式（驼峰命名）
export interface ApiBookmark {
  id: number;
  userId: string;
  categoryId: number | null;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  tags: string[];
  sortOrder: number;
  visitCount: number;
  lastVisited: string | null;
  createdAt: string;
  updatedAt: string;
}

// API 响应分类格式（驼峰命名）
export interface ApiCategory {
  id: number;
  userId: string;
  name: string;
  color: string;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
}

/**
 * 将数据库书签记录转换为 API 响应格式
 */
export function transformBookmark(row: DatabaseBookmarkRow): ApiBookmark {
  return {
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
  };
}

/**
 * 批量转换书签记录
 */
export function transformBookmarks(rows: DatabaseBookmarkRow[]): ApiBookmark[] {
  return rows.map(transformBookmark);
}

/**
 * 将数据库分类记录转换为 API 响应格式
 */
export function transformCategory(row: DatabaseCategoryRow): ApiCategory {
  return {
    id: row.id,
    userId: row.fingerprint,
    name: row.name,
    color: row.color,
    icon: row.icon,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

/**
 * 批量转换分类记录
 */
export function transformCategories(rows: DatabaseCategoryRow[]): ApiCategory[] {
  return rows.map(transformCategory);
}
