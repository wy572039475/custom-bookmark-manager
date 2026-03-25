import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { authApi as mockAuthApi } from '../services/mock-api';
import { useDevice } from './DeviceContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { fingerprint, isLoading: deviceLoading } = useDevice();

  useEffect(() => {
    // 等待设备指纹加载完成
    if (deviceLoading) {
      return;
    }

    const autoLogin = async () => {
      if (!fingerprint) {
        setLoading(false);
        return;
      }

      try {
        // 检查是否已有 token
        const existingToken = localStorage.getItem('token');
        const existingUser = localStorage.getItem('user');

        if (existingToken && existingUser) {
          // 如果已有 token 和用户信息，先使用它们
          setToken(existingToken);
          setUser(JSON.parse(existingUser));

          // 尝试验证 token 是否仍然有效
          try {
            await authApi.getProfile();
            console.log('现有 token 仍然有效');
            setLoading(false);
            return;
          } catch (profileError) {
            // Token 无效，需要重新登录
            console.log('Token 已过期，重新登录');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }

        // 先尝试真实 API
        try {
          const response = await authApi.autoLogin();
          setUser(response.user);
          setToken(response.token);
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('use_mock_api', 'false');
          console.log('使用真实 API 登录成功');
        } catch (realApiError) {
          // 真实 API 失败，尝试模拟 API
          console.log('真实 API 自动登录失败，尝试模拟模式');
          const response = await mockAuthApi.autoLogin();
          setUser(response.user);
          setToken(response.token);
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('use_mock_api', 'true');
          console.log('使用模拟 API 登录成功');
        }
      } catch (error) {
        console.error('自动登录失败:', error);
        // 即使自动登录失败，也允许用户访问页面（显示离线模式）
        localStorage.setItem('use_mock_api', 'true');
      } finally {
        setLoading(false);
      }
    };

    autoLogin();
  }, [deviceLoading, fingerprint]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
