import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001/api';

// API 健康检查
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE.replace('/api', '')}/health`, {
      timeout: 3000,
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// 检查后端 API 是否可用
export async function checkRealApiAvailable(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE}/auth/profile`, {
      timeout: 3000,
      headers: {
        'Content-Type': 'application/json',
        'x-fingerprint': localStorage.getItem('device_fingerprint') || '',
      },
    });
    // 即使返回 401 或 403，也说明后端是可用的
    return response.status === 200 || response.status === 401 || response.status === 403;
  } catch (error: any) {
    // 网络错误或超时说明后端不可用
    return false;
  }
}

// API 管理器类
export class ApiManager {
  private static instance: ApiManager;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  private constructor() {}

  public static getInstance(): ApiManager {
    if (!ApiManager.instance) {
      ApiManager.instance = new ApiManager();
    }
    return ApiManager.instance;
  }

  // 开始定期检查后端状态
  public startHealthCheck(intervalMs: number = 30000): void {
    this.stopHealthCheck(); // 先停止之前的检查

    // 立即检查一次
    this.checkBackend();

    // 设置定期检查
    this.checkInterval = setInterval(() => {
      this.checkBackend();
    }, intervalMs);

    console.log('API 健康检查已启动，检查间隔:', intervalMs, 'ms');
  }

  // 停止定期检查
  public stopHealthCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('API 健康检查已停止');
    }
  }

  // 手动检查后端状态
  public async checkBackend(): Promise<boolean> {
    const isOnline = await checkRealApiAvailable();

    // 通知所有监听器
    this.listeners.forEach(listener => listener(isOnline));

    return isOnline;
  }

  // 添加状态监听器
  public addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);

    // 返回取消监听的函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  // 切换到在线模式
  public switchToOnline(): void {
    localStorage.setItem('use_mock_api', 'false');
    console.log('已切换到在线模式');
  }

  // 切换到离线模式
  public switchToOffline(): void {
    localStorage.setItem('use_mock_api', 'true');
    console.log('已切换到离线模式');
  }

  // 获取当前模式
  public getCurrentMode(): 'online' | 'offline' {
    return localStorage.getItem('use_mock_api') === 'true' ? 'offline' : 'online';
  }
}

// 导出单例实例
export const apiManager = ApiManager.getInstance();
