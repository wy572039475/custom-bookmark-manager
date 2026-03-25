import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { DeviceProvider } from './context/DeviceContext';
import { Dashboard } from './pages/Dashboard';
import { useAuth } from './context/AuthContext';

// 受保护路由组件 - 等待自动登录完成后显示内容
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">正在初始化...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <DeviceProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <Routes>
                {/* 主页面 - 自动通过设备指纹登录 */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                {/* 其他所有路径重定向到首页 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </DeviceProvider>
    </ThemeProvider>
  );
}

export default App;
