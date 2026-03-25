/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * 处理数据库错误
 */
export function handleDatabaseError(error: any): AppError {
  console.error('数据库错误:', error);

  // PostgreSQL 唯一约束冲突
  if (error.code === '23505') {
    const constraint = error.constraint;
    if (constraint?.includes('users_email_key')) {
      return new ConflictError('该邮箱已被使用');
    }
    if (constraint?.includes('users_username_key')) {
      return new ConflictError('该用户名已被使用');
    }
    return new ConflictError('数据冲突，请检查输入');
  }

  // PostgreSQL 外键约束冲突
  if (error.code === '23503') {
    return new ConflictError('关联的数据不存在');
  }

  // 连接错误
  if (error.code === 'ECONNREFUSED') {
    return new AppError('数据库连接失败，请检查数据库是否运行', 503);
  }

  return new AppError('数据库操作失败', 500);
}

/**
 * 处理网络错误
 */
export function handleNetworkError(error: any): AppError {
  console.error('网络错误:', error);

  if (error.code === 'ECONNREFUSED') {
    return new AppError('无法连接到服务器', 503);
  }

  if (error.code === 'ETIMEDOUT') {
    return new AppError('请求超时，请稍后重试', 504);
  }

  return new AppError('网络错误，请检查连接', 500);
}

/**
 * 格式化错误响应
 */
export function formatErrorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return {
      success: false,
      message: error.message,
      statusCode: error.statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
  }

  return {
    success: false,
    message: '服务器内部错误',
    statusCode: 500,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
}

export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  handleDatabaseError,
  handleNetworkError,
  formatErrorResponse
};
