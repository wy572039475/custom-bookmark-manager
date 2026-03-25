/**
 * 环境变量验证工具
 * 确保所有必需的环境变量都已正确设置
 */

export interface EnvConfig {
  port: number;
  nodeEnv: string;
  tursoDatabaseUrl: string;
  tursoAuthToken: string;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export function validateEnv(): EnvConfig {
  const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || 'file:./local.db',
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };

  // 验证必需的环境变量
  const errors: string[] = [];

  // 生产环境必须配置 Turso
  if (config.nodeEnv === 'production') {
    if (!config.tursoDatabaseUrl || config.tursoDatabaseUrl === 'file:./local.db') {
      errors.push('TURSO_DATABASE_URL is required in production');
    }
    if (!config.tursoAuthToken) {
      errors.push('TURSO_AUTH_TOKEN is required in production');
    }
  }

  if (!config.jwtSecret) {
    errors.push('JWT_SECRET is required');
  }

  if (config.jwtSecret.length < 16) {
    errors.push('JWT_SECRET must be at least 16 characters long');
  }

  if (config.nodeEnv === 'production') {
    if (config.jwtSecret === 'your_jwt_secret_key_here_change_in_production') {
      errors.push('JWT_SECRET must be changed in production');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Environment variable validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\n📝 Please check your .env file and .env.example for reference.');
    process.exit(1);
  }

  return config;
}

export default validateEnv;
