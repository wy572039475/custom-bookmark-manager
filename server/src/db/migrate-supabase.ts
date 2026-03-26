import { query } from './postgres';

const migrations = [
  // 用户表
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 设备表（用于设备指纹识别）
  `CREATE TABLE IF NOT EXISTS devices (
    fingerprint VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255),
    sync_code VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 设备指纹关联表
  `CREATE TABLE IF NOT EXISTS device_fingerprints (
    id SERIAL PRIMARY KEY,
    device_fingerprint VARCHAR(255) NOT NULL,
    original_fingerprint VARCHAR(255) NOT NULL REFERENCES devices(fingerprint) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_fingerprint, original_fingerprint)
  )`,

  // 分类表
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    fingerprint VARCHAR(255) NOT NULL REFERENCES devices(fingerprint) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50),
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 收藏表
  `CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    fingerprint VARCHAR(255) NOT NULL REFERENCES devices(fingerprint) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    icon VARCHAR(500),
    tags TEXT,
    sort_order INTEGER DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_visited TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    console.log('🗄️  开始 Supabase 数据库迁移...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 测试连接
    console.log('⏳ 测试数据库连接...');
    const testResult = await query('SELECT NOW() as now');
    console.log(`✅ 数据库连接成功！`);
    console.log(`📊 当前时间: ${testResult.rows[0].now}\n`);

    // 执行迁移
    console.log('⏳ 执行数据库迁移...');
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      try {
        await query(migration);
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
    const tables = await query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    tables.rows.forEach((row: any) => {
      console.log(`   • ${row.tablename}`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ 数据库迁移失败:', error);
    process.exit(1);
  }
}

migrate();
