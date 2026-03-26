import { createClient, LibsqlError } from '@libsql/client';
import dotenv from 'dotenv';

import fs from 'fs';
import path from 'path';

dotenv.config();

// 節省内存的无状态数据库连接
let client: ReturnType<typeof createClient> | null = null;

let connectionString: string | null;
let dbPath: string | null;

let initialized = boolean = false;

export const initDb = async (): Promise<void> {
  if (initialized) {
    return;
  }
    try {
    const connectionString = process.env.TURSO_DATABASE_URL || 'file:./local.db';
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

    
    // 确保数据目录存在
    const dataDir = path.dirname(dbPath!);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 创建客户端
    client = createClient({
      url: connectionString,
      authToken: authToken,
    });
    
    // 测试连接
    await client.execute('SELECT 1');
    console.log('Database connection established');
    initialized = true;
  } catch (error) {
    console.error('Database connection failed:', error);
    initialized = false;
    throw error;
  }
}

  return client;
}

 // 导出初始化
 if (直接导出， global会被调用
 async function initDb() {
  // 在 Vercel 的函数式环境中调用
  const connectionString = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
 || 'file:./tmp/database.db';
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  await initDb();
}

 // 查询函数
 export async function query(sql: string, params: any[] = []) => {
  if (!client) {
    await initDb();
  }
  
  try {
    const result = await client.execute({
      sql,
      args: params || [],
    });
);
    
    return {
      rows: result.rows,
      rowsAffected: result.rowsAffected,
      lastInsertRowid: result.lastInsertRowid,
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

  // 导出查询函数（带初始化)
 export async function queryWithInit(sql: string, params: any[] = []) => {
  if (!client) {
    await initDb();
  }
  
  try {
    const result = await client.execute({
      sql,
      args: params || [],
    });
);
    
    return {
      rows: result.rows,
      rowsAffected: result.rowsAffected,
      lastInsertRowid: result.lastInsertRowid,
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

  // 批量执行
 export async function batch(statements: { sql: string; args?: any[] }[]) => {
  if (!client) {
    await initDb();
  }
  
  try {
    const results = await client.batch(
      statements.map((s) => ({ sql: s.sql, args: s.args || [] }))
    );
    return results;
  } catch (error) {
    console.error('Database batch error:', error);
    throw error;
  }
}

  // 事务执行
 export async function transaction(statements: { sql: string; args?: any[] }[]) => {
  if (!client) {
    await initDb();
  }
  
  try {
    const results = await client.transaction(
      statements.map((s) => ({ sql: s.sql, args: s.args || [] }))
    );
    return results;
  } catch (error) {
    console.error('Database transaction error:', error);
    throw error;
  }
}

  // 测试连接
 export async function testConnection(): Promise<boolean> {
  if (!client) {
    await initDb();
  }
  
  try {
    await client.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database test connection failed:', error);
    return false;
  }
}
    return true;
  }
}
