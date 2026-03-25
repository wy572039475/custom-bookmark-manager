import { useTheme } from '../context/ThemeContext';

/**
 * 背景装饰组件 - 为页面添加丰富的视觉效果
 * 包含：浮动光球、网格、噪点纹理、几何装饰等
 */
export function BackgroundDecorations() {
  const { theme } = useTheme();

  // 清新主题使用更柔和的装饰
  const isFreshTheme = theme === 'fresh';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 浮动光球 */}
      <div className="bg-orb bg-orb-1 absolute rounded-full" 
        style={{ 
          filter: 'blur(80px)',
          animation: 'orbFloat 20s ease-in-out infinite'
        }} 
      />
      <div className="bg-orb bg-orb-2 absolute rounded-full" 
        style={{ 
          filter: 'blur(80px)',
          animation: 'orbFloat 25s ease-in-out infinite',
          animationDelay: '-8s'
        }} 
      />
      <div className="bg-orb bg-orb-3 absolute rounded-full" 
        style={{ 
          filter: 'blur(80px)',
          animation: 'orbFloat 22s ease-in-out infinite',
          animationDelay: '-16s'
        }} 
      />

      {/* 网格背景 - 只在非清新主题显示 */}
      {!isFreshTheme && <div className="bg-grid" />}

      {/* 噪点纹理 */}
      <div className="bg-noise" style={{ opacity: 0.03 }} />

      {/* 几何装饰 */}
      <div className="bg-shapes">
        <div className="bg-shape bg-shape-circle" />
        <div className="bg-shape bg-shape-square" />
        <div className="bg-shape bg-shape-triangle" />
      </div>

      {/* 波浪装饰 - 底部 */}
      <div className="bg-waves absolute bottom-0 left-0 w-full h-32 overflow-hidden" style={{ opacity: 0.1 }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ width: '200%', height: '100%' }}>
          <path 
            d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z"
            fill="currentColor"
            className="text-white"
            style={{ animation: 'waveMove 30s linear infinite' }}
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * 简化版背景装饰 - 用于侧边栏等局部区域
 */
export function SidebarDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 微弱光晕 */}
      <div 
        className="absolute top-0 right-0 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--theme-gradient-1) / 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'translate(30%, -30%)'
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-48 h-48 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--theme-gradient-2) / 0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'translate(-30%, 30%)'
        }}
      />
    </div>
  );
}
