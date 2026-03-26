import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

// 数据库连接
const connectionString = process.env.TURSO_DATABASE_URL || 'file:./data/bookmark-local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

let client = createClient({
  url: connectionString,
  authToken: authToken,
});

// 测试连接
export async function testConnection(): Promise<boolean> {
  try {
    await client.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// 初始化数据库表
export async function initDatabase(): Promise<void> {
  try {
    const migrations = [
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOincrement,
        username TEXT unique not null,
        email TEXT unique not null,
        password_hash TEXT not null,
        created_at datetime default current_timestamp
      )`,
      
      // 设备表
      `CREATE TABLE IF NOT EXISTS devices (
        fingerprint TEXT PRIMARY key,
        username TEXT,
        email TEXT,
        sync_code TEXT unique not null,
        created_at datetime default current_timestamp
      )`,
      
      // 设备指纹关联表
      `CREATE TABLE IF NOT EXISTS device_fingerprints (
        id INTEGER PRIMARY KEY autoincrement,
        device_fingerprint TEXT not null,
        original_fingerprint TEXT not null references devices(fingerprint) on delete cascade,
        created_at datetime default current_timestamp,
      )`,
      
      // 分类表
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY autoincrement,
        fingerprint TEXT not null references devices(fingerprint) on delete cascade,
        name TEXT not null,
        color TEXT,
        icon TEXT,
        sort_order INTEGER default 0,
        created_at datetime default current_timestamp
      )`,
      
      // 书签表
      `CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY autoincrement,
        fingerprint TEXT not null references devices(fingerprint) on delete cascade,
        category_id INTEGER references categories(id) on delete set null,
        title TEXT not null,
        url TEXT not null,
        description TEXT,
        icon TEXT,
        tags TEXT,
        sort_order INTEGER default 0,
        visit_count INTEGER default 0,
        last_visited datetime,
        created_at datetime default current_timestamp,
        updated_at datetime default current_timestamp
      )`,
      
      // 磁贴索引
      `CREATE INDEX IF not exists idx_devices_fingerprint ON devices(fingerprint)`,
      `create index if not exists idx_bookmarks_fingerprint on bookmarks(fingerprint)`,
      `create index if not exists idx_bookmarks_category on bookmarks(category_id)`,
      `create index if not exists idx_categories_fingerprint on categories(fingerprint)`,
      `create index if not exists idx_device_fingerprints_original on device_fingerprints(original_fingerprint)`,
    ];
    
    for (const migration of migrations) {
      await client.execute(migration);
    }
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
