/**
 * 前端错误处理工具
 */

export interface ErrorResponse {
  message: string;
  statusCode: number;
  success: boolean;
  details?: any;
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  return (
    !error.response &&
    !!error.request &&
    (error.message?.includes('Network Error') ||
     error.message?.includes('timeout') ||
     error.code === 'ECONNABORTED' ||
     error.code === 'ETIMEDOUT')
  );
}

/**
 * 判断是否为服务器错误
 */
export function isServerError(error: any): boolean {
  return (
    error.response?.status >= 500 &&
    error.response?.status < 600
  );
}

/**
 * 判断是否为客户端错误
 */
export function isClientError(error: any): boolean {
  return (
    error.response?.status >= 400 &&
    error.response?.status < 500
  );
}

/**
 * 判断是否为认证错误
 */
export function isAuthError(error: any): boolean {
  return error.response?.status === 401 || error.response?.status === 403;
}

/**
 * 获取用户友好的错误消息
 */
export function getErrorMessage(error: any): string {
  // API 返回的错误消息
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // 网络错误
  if (isNetworkError(error)) {
    return '网络连接失败，请检查网络设置';
  }

  // 服务器错误
  if (isServerError(error)) {
    return '服务器暂时不可用，请稍后重试';
  }

  // 认证错误
  if (isAuthError(error)) {
    return '登录已过期，请重新登录';
  }

  // 404 错误
  if (error.response?.status === 404) {
    return '请求的资源不存在';
  }

  // 其他错误
  if (error.message) {
    return error.message;
  }

  return '操作失败，请重试';
}

/**
 * 格式化错误详情
 */
export function formatErrorDetails(error: any): any {
  const details: any = {
    timestamp: new Date().toISOString(),
  };

  if (error.response?.status) {
    details.statusCode = error.response.status;
  }

  if (error.response?.data) {
    details.data = error.response.data;
  }

  if (error.config) {
    details.url = error.config.url;
    details.method = error.config.method;
  }

  return details;
}

/**
 * 日志错误
 */
export function logError(error: any, context?: string) {
  const errorMessage = getErrorMessage(error);
  const details = formatErrorDetails(error);

  console.error(`[Error${context ? ` - ${context}` : ''}]`, {
    message: errorMessage,
    details,
    originalError: error,
  });
}

/**
 * Toast 消息配置
 */
export function getToastConfig(error: any): {
  message: string;
  variant: 'error' | 'warning' | 'info';
  duration: number;
} {
  const message = getErrorMessage(error);

  if (isAuthError(error)) {
    return { message, variant: 'warning', duration: 3000 };
  }

  if (isServerError(error)) {
    return { message, variant: 'error', duration: 5000 };
  }

  if (isNetworkError(error)) {
    return { message, variant: 'error', duration: 5000 };
  }

  return { message, variant: 'error', duration: 3000 };
}

export default {
  isNetworkError,
  isServerError,
  isClientError,
  isAuthError,
  getErrorMessage,
  formatErrorDetails,
  logError,
  getToastConfig,
};
