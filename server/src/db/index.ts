import { createClient, LibsqlError } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

// Turso 数据库连接配置
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

const isProduction = process.env.NODE_ENV === 'production';

// 测试数据库连接
db.execute('SELECT 1')
  .then(() => {
    console.log('✅ Turso database connected successfully');
    console.log(`   URL: ${process.env.TURSO_DATABASE_URL || 'local.db'}`);
  })
  .catch((err: LibsqlError) => {
    console.error('❌ Database connection failed:', err.message);
    
    if (isProduction) {
      // 生产环境：数据库连接失败必须退出
      console.error('💥 Production environment requires database connection. Exiting...');
      process.exit(1);
    } else {
      // 开发环境：允许继续运行（使用本地 fallback）
      console.log('⚠️  Server will continue without database. Make sure Turso is configured correctly.');
      console.log('   Please check your .env file:');
      console.log(`   TURSO_DATABASE_URL: ${process.env.TURSO_DATABASE_URL || '(not set)'}`);
    }
  });

// 查询函数 - 统一返回格式
export const query = async (sql: string, params?: any[]) => {
  try {
    const result = await db.execute({
      sql,
      args: params || [],
    });
    
    return {
      rows: result.rows,
      rowsAffected: result.rowsAffected,
      lastInsertRowid: result.lastInsertRowid,
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// 批量执行
export const batch = async (statements: { sql: string; args?: any[] }[]) => {
  try {
    const results = await db.batch(statements);
    return results;
  } catch (error) {
    console.error('Database batch error:', error);
    throw error;
  }
};

// 事务执行
export const transaction = async (statements: { sql: string; args?: any[] }[]) => {
  try {
    const results = await db.transaction(statements);
    return results;
  } catch (error) {
    console.error('Database transaction error:', error);
    throw error;
  }
};

export default db;
