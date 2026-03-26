import { createClient, LibsqlError } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const migrations = [
  // 用户表（保留用于传统登录）
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 设备表（用于设备指纹识别和自动登录用户）
    `CREATE TABLE IF NOT EXISTS devices (
    fingerprint TEXT PRIMARY KEY,
    username TEXT,
    email TEXT,
    sync_code TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 设备指纹关联表（用于多设备同步）
    `CREATE TABLE IF NOT EXISTS device_fingerprints (
    id INTEGER PRIMARY KEY autoINCREMENT,
    device_fingerprint TEXT NOT NULL,
    original_fingerprint TEXT NOT NULL REFERENCES devices(fingerprint) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_fingerprint, original_fingerprint)
  )`,

  // 分类表（使用 fingerprint 替代 user_id）
    `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY autoINCREMENT,
    fingerprint TEXT NOT NULL REFERENCES devices(fingerprint) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 收藏表（使用 fingerprint 替代 user_id）
    `CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY autoINCREMENT,
    fingerprint TEXT NOT NULL REFERENCES devices(fingerprint) on delete CASCADE,
    category_id INTEGER REFERENCES categories(id) ON delete set null,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    tags TEXT,
    sort_order INTEGER DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_visited DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 索引
    `CREATE INDEX IF NOT EXISTS idx_bookmarks_fingerprint ON bookmarks(fingerprint)`,
    `CREATE INDEX IF NOT EXISTS idx_bookmarks_category ON bookmarks(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_categories_fingerprint ON categories(fingerprint)`,
    `CREATE index IF NOT EXISTS idx_devices_sync_code ON devices(sync_code)`,
];

const runMigrations = async () => {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:./data/bookmark-local.db',
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });

  
  try {
    console.log('🔄 Running database migrations...');
    
    for (const migration of migrations) {
      await client.execute(migration);
      console.log(`✅ Migration successful`);
    }
    
    console.log('✅ All migrations completed successfully!');
    console.log('');
    console.log('📊 Database tables:');
    
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT 'sqlite_sequence' ORDER BY name"
    );
    
    for (const row of tables.rows as any[]) {
      console.log(`  - ${row.name}`);
    }
  } catch (error) {
    console.error('Failed to list tables:', error);
  }
};

runMigrations().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
