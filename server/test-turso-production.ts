import { createClient } from '@libsql/client';

// 使用你的 Turso 生产数据库信息
const DATABASE_URL = 'libsql://bookmark-db-wy572039475.aws-ap-northeast-1.turso.io';
const AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0MzIwNTUsImlkIjoiMDE5ZDI0NjQtMzQwMS03ZTc2LTlhYzMtZmExZjZmMGFmMGIyIiwicmlkIjoiMGQ1MmJjZDgtOGE5Ny00OTIwLWIzZjgtOTIxYWRlYTYyNTcwIn0.HaW1n7ahpwM4C5xIX-NRnG2wFGaJA_bC9LJGZLQibulY-Gt7gQKRxaTs3pu9tYBmhH3VZsP1x_oYxM8yvdvUBQ';

async function testConnection() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 测试 Turso 生产数据库连接');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📊 数据库 URL:', DATABASE_URL);
  console.log('🔑 Token: 已配置\n');

  try {
    console.log('⏳ 正在连接数据库...');
    const client = createClient({
      url: DATABASE_URL,
      authToken: AUTH_TOKEN,
    });

    // 测试连接
    const result = await client.execute('SELECT sqlite_version() as version');
    console.log('✅ 数据库连接成功！');
    console.log(`📊 SQLite 版本: ${result.rows[0].version}\n`);

    // 检查现有表
    console.log('⏳ 检查数据库表...');
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    console.log('📋 当前数据库表:');
    if (tables.rows.length === 0) {
      console.log('   (暂无表，需要运行迁移)');
    } else {
      tables.rows.forEach((row: any) => {
        console.log(`   • ${row.name}`);
      });
    }
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 数据库测试完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ 数据库连接失败！');
    console.error(`错误信息: ${error.message}\n`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

testConnection();
