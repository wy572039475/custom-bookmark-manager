import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ValidationError,
  handleDatabaseError,
  handleNetworkError,
  formatErrorResponse
} from '../utils/error-handler';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 记录错误
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  let appError: AppError;

  // 判断错误类型
  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof ValidationError) {
    appError = err;
  } else if (err.name === 'ValidationError') {
    appError = new ValidationError(err.message);
  } else if (err.code && err.code.startsWith('23')) {
    // PostgreSQL 错误代码
    appError = handleDatabaseError(err);
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    // 网络错误
    appError = handleNetworkError(err);
  } else {
    // 未知错误
    appError = new AppError(
      process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
      500,
      false
    );
  }

  const response = formatErrorResponse(appError);

  res.status(appError.statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `路径 ${req.method} ${req.url} 不存在`,
    statusCode: 404
  });
};
