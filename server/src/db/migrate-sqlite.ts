import { execute, testConnection } from './sqlite';

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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_fingerprint TEXT NOT NULL,
    original_fingerprint TEXT NOT NULL REFERENCES devices(fingerprint) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_fingerprint, original_fingerprint)
  )`,

  // 分类表（使用 fingerprint 替代 user_id）
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fingerprint TEXT NOT NULL REFERENCES devices(fingerprint) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 收藏表（使用 fingerprint 替代 user_id）
  `CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fingerprint TEXT NOT NULL REFERENCES devices(fingerprint) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
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
  `CREATE INDEX IF NOT EXISTS idx_devices_sync_code ON devices(sync_code)`,
];

async function migrate() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗄️  开始 SQLite 数据库迁移...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 测试连接
    console.log('⏳ 测试数据库连接...');
    await testConnection();
    console.log('✅ 数据库连接正常\n');

    // 执行迁移
    console.log('⏳ 执行数据库迁移...');
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      try {
        await execute(migration);
        console.log(`  ✅ 迁移 ${i + 1}/${migrations.length}: ${migration.split('(')[0]}CREATE TABLE`);
      } catch (error: any) {
        console.log(`  ⚠️  迁移 ${i + 1}/${migrations.length}: 跳过（表可能已存在）`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 数据库迁移完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 显示表列表
    console.log('📋 已创建的表:');
    const tables = await query(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
    tables.rows.forEach((row: any) => {
      console.log(`   • ${row.name}`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ 数据库迁移失败:', error);
    process.exit(1);
  }
}

async function query(sql: string, params?: any[]) {
  const { query } = await import('./sqlite');
  return await query(sql, params);
}

migrate();
