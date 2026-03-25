import dotenv from 'dotenv';
import { testConnection, query } from './src/db/sqlite';

dotenv.config();

async function main() {
  console.log('🔍 测试 Turso 数据库连接...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 显示配置
  console.log('📋 连接配置:');
  console.log(`   URL: ${process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'local'}`);
  console.log(`   Token: ${process.env.TURSO_AUTH_TOKEN ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   本地模式: ${process.env.USE_LOCAL_SQLITE === 'true' ? '是' : '否'}`);
  console.log(`   本地路径: ${process.env.LOCAL_DB_PATH || './data/bookmark.db'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 测试连接
    console.log('⏳ 测试数据库连接...');
    await testConnection();

    // 查询版本
    const versionResult = await query('SELECT sqlite_version() as version');
    console.log(`📊 SQLite 版本: ${versionResult.rows[0].version}\n`);

    // 检查表是否存在
    console.log('⏳ 检查数据表...');
    const tablesResult = await query(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `);

    if (tablesResult.rows.length > 0) {
      console.log('✅ 已创建以下表:\n');
      tablesResult.rows.forEach((row: any, index: number) => {
        console.log(`   ${index + 1}. ${row.name}`);
      });
      console.log('');

      // 查询每个表的记录数
      console.log('📊 数据统计:');
      for (const row of tablesResult.rows as any[]) {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${row.name}`);
        console.log(`   • ${row.name}: ${countResult.rows[0].count} 条记录`);
      }
      console.log('');

    } else {
      console.log('⚠️  未检测到数据表，请运行数据库迁移:');
      console.log('   npm run db:migrate:turso\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 测试通过！数据库连接正常。');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 测试失败！');
    console.error(`错误信息: ${error.message}\n`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('💡 排查建议:');
    console.error('   1. 检查 .env 文件中的配置是否正确');
    console.error('   2. 确认 Turso 数据库是否已创建');
    console.error('   3. 检查 Token 和 URL 是否正确');
    console.error('   4. 如果使用本地模式，确保目录有写入权限');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(1);
  }
}

main();
