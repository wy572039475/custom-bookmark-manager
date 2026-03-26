import dotenv from 'dotenv';

dotenv.config();

// 数据库类型配置
const DB_TYPE = process.env.DB_TYPE || 'turso'; // 'turso' 或 'postgres'
const USE_LOCAL_SQLITE = process.env.USE_LOCAL_SQLITE === 'true';

console.log(`📊 Database type: ${DB_TYPE}`);

// 根据配置选择数据库
let db: any;
let queryFn: any;
let executeFn: any;
let batchFn: any;
let transactionFn: any;

if (USE_LOCAL_SQLITE) {
  // 使用本地 SQLite
  console.log('📁 Using local SQLite database');
  const sqliteDb = await import('./sqlite');
  db = sqliteDb.default || sqliteDb.db;
  queryFn = sqliteDb.query;
  executeFn = sqliteDb.execute;
  batchFn = sqliteDb.batch;
  transactionFn = sqliteDb.transaction;
} else if (DB_TYPE === 'postgres' && process.env.DATABASE_URL) {
  // 使用 PostgreSQL (Supabase)
  console.log('🐘 Using PostgreSQL (Supabase) database');
  const postgresDb = await import('./postgres');
  db = postgresDb.default || postgresDb.pool;
  queryFn = postgresDb.query;
  executeFn = postgresDb.execute;
  batchFn = postgresDb.batch;
  transactionFn = postgresDb.transaction;
} else {
  // 使用 Turso
  console.log('☁️ Using Turso database');
  const tursoDb = await import('./sqlite');
  db = tursoDb.default || tursoDb.db;
  queryFn = tursoDb.query;
  executeFn = tursoDb.execute;
  batchFn = tursoDb.batch;
  transactionFn = tursoDb.transaction;
}

// 统一导出的函数
export const query = queryFn;
export const execute = executeFn;
export const batch = batchFn;
export const transaction = transactionFn;

export default db;
