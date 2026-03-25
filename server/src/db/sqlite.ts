import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

// 配置
const DATABASE_URL = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const USE_LOCAL = process.env.USE_LOCAL_SQLITE === 'true';
const LOCAL_DB_PATH = process.env.LOCAL_DB_PATH || './data/bookmark.db';

// 创建客户端
export const createTursoClient = () => {
  if (USE_LOCAL) {
    console.log('📁 使用本地 SQLite 数据库:', LOCAL_DB_PATH);
    return createClient({ url: `file:${LOCAL_DB_PATH}` });
  }

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL 环境变量未设置');
  }

  console.log('☁️ 使用 Turso 云数据库');
  return createClient({
    url: DATABASE_URL,
    authToken: AUTH_TOKEN,
  });
};

const client = createTursoClient();

// 测试连接
export async function testConnection() {
  try {
    const result = await client.execute('SELECT sqlite_version() as version');
    console.log('✅ Turso 连接成功！');
    console.log(`📊 SQLite 版本: ${result.rows[0].version}`);
    return true;
  } catch (error: any) {
    console.error('❌ Turso 连接失败:', error.message);
    throw error;
  }
}

// 执行查询
export async function query(sql: string, params?: any[]) {
  try {
    const result = await client.execute({ sql, args: params });
    return result;
  } catch (error: any) {
    console.error('SQL 查询失败:', error.message);
    throw error;
  }
}

// 执行插入/更新/删除（返回影响行数）
export async function execute(sql: string, params?: any[]): Promise<number> {
  try {
    const result = await client.execute({ sql, args: params });
    return result.rowsAffected || 0;
  } catch (error: any) {
    console.error('SQL 执行失败:', error.message);
    throw error;
  }
}

// 事务支持
export async function transaction<T>(
  callback: (db: ReturnType<typeof createTursoClient>) => Promise<T>
): Promise<T> {
  // Turso 目前不支持传统的事务，使用自动提交模式
  // 如果需要事务，可以将多个操作组合在一起
  return await callback(client);
}

// 获取最后插入的 ID
export async function lastInsertId() {
  const result = await query('SELECT last_insert_rowid() as id');
  return result.rows[0].id;
}

export default client;
