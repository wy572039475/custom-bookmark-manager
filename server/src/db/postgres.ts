import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL 数据库连接配置
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// 测试数据库连接
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    if (process.env.NODE_ENV === 'production') {
    console.error('Please check your DATABASE_URL environment variable');
  }
  return;
  }
  console.log('✅ PostgreSQL database connected successfully');
  release();
});

// 查询函数
export const query = async (sql: string, params?: any[]): Promise<any> => {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
};

// 执行函数（用于 INSERT/UPDATE/DELETE）
export const execute = async (sql: string, params?: any[]): Promise<any> => {
  return await query(sql, params);
};

// 批量执行
export const batch = async (statements: { sql: string; args?: any[] }[]): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const stmt of statements) {
      await client.query(stmt.sql, stmt.args);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// 事务执行
export const transaction = async (callback: (client: any) => Promise<any>): Promise<any> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
