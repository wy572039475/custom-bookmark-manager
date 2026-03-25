// 数据库错误类型
export enum DatabaseErrorCode {
  CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  QUERY_FAILED = 'DB_QUERY_FAILED',
  TRANSACTION_FAILED = 'DB_TRANSACTION_FAILED',
  UNIQUE_VIOLATION = 'DB_UNIQUE_VIOLATION',
  FOREIGN_KEY_VIOLATION = 'DB_FOREIGN_KEY_VIOLATION',
  NOT_FOUND = 'DB_NOT_FOUND',
}

// 认证错误类型
export enum AuthErrorCode {
  INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  MISSING_CREDENTIALS = 'AUTH_MISSING_CREDENTIALS',
  INVALID_FINGERPRINT = 'AUTH_INVALID_FINGERPRINT',
  UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
}

// 验证错误类型
export enum ValidationErrorCode {
  INVALID_URL = 'VAL_INVALID_URL',
  INVALID_EMAIL = 'VAL_INVALID_EMAIL',
  REQUIRED_FIELD = 'VAL_REQUIRED_FIELD',
  INVALID_LENGTH = 'VAL_INVALID_LENGTH',
}

// API 错误响应接口
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  statusCode: number;
  timestamp: string;
  path: string;
}

// 自定义错误类
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
      statusCode: this.statusCode,
      timestamp: new Date().toISOString(),
      path: '',
    };
  }
}

// 数据库错误类
export class DatabaseError extends AppError {
  constructor(
    message: string,
    code: DatabaseErrorCode = DatabaseErrorCode.QUERY_FAILED,
    details?: Record<string, unknown>
  ) {
    super(message, 500, code, details);
    this.name = 'DatabaseError';
  }
}

// 认证错误类
export class AuthError extends AppError {
  constructor(
    message: string,
    code: AuthErrorCode = AuthErrorCode.UNAUTHORIZED,
    details?: Record<string, unknown>
  ) {
    super(message, 401, code, details);
    this.name = 'AuthError';
  }
}

// 验证错误类
export class ValidationError extends AppError {
  constructor(
    message: string,
    code: ValidationErrorCode = ValidationErrorCode.REQUIRED_FIELD,
    details?: Record<string, unknown>
  ) {
    super(message, 400, code, details);
    this.name = 'ValidationError';
  }
}

// 错误工厂函数
export function createDatabaseError(
  operation: string,
  originalError?: Error
): DatabaseError {
  return new DatabaseError(
    `数据库操作失败: ${operation}`,
    DatabaseErrorCode.QUERY_FAILED,
    originalError ? { originalMessage: originalError.message } : undefined
  );
}

export function createAuthError(
  code: AuthErrorCode,
  message: string
): AuthError {
  return new AuthError(message, code);
}

export function createValidationError(
  field: string,
  reason: string
): ValidationError {
  return new ValidationError(
    `${field}: ${reason}`,
    ValidationErrorCode.REQUIRED_FIELD,
    { field, reason }
  );
}
