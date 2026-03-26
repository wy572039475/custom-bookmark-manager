import { createClient } from '@libsql/client';

import dotenv from 'dotenv';

dotenv.config();

// 每次请求创建独立的数据库连接
let dbClient: ReturnType<typeof createClient> | null = null;

// 配置信息
const DATABASE_URL = process.env.TURSO_DATABASE_URL || 'file:./local.db';
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || undefined;

const isProduction = process.env.NODE_ENV === 'production';

export function getDb(): ReturnType<typeof createClient> {
  return dbClient;
}

// 初始化数据库连接（延迟加载）
async function initDb(): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      // 初始化全局客户端
      dbClient = createClient({
        url: DATABASE_URL,
        authToken: AUTH_TOKEN,
      });

      
      console.log(`✅ Database connection established:`);
      console.log(`   URL: ${DATABASE_URL}`);
      
      // 测试连接
      await dbClient.execute('SELECT 1');
      console.log('✅ Database connection test successful');
    } catch (error: any) {
      console.error('Database connection failed:', error);
      if (isProduction) {
        console.error('💥 Production environment requires database connection. Exiting...');
        process.exit(1);
      }
    }
  });
}

 return dbClient;
}

export { getDb } = getDb;
