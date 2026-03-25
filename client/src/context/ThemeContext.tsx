import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeType = 
  | 'purple'      // 默认紫色主题
  | 'ocean'       // 海洋蓝色
  | 'sunset'      // 日落橙色
  | 'forest'      // 森林绿色
  | 'rose'        // 玫瑰粉色
  | 'midnight'    // 午夜深色
  | 'fresh'       // 清新现代风 - 亮蓝+紫罗兰
  | 'steady'      // 沉稳专业风 - 翠绿+琥珀
  | 'warm';       // 柔和暖色调 - 暖橙+明黄

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themes: { id: ThemeType; name: string; icon: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: { id: ThemeType; name: string; icon: string }[] = [
  { id: 'purple', name: '梦幻紫', icon: '✨' },
  { id: 'ocean', name: '海洋蓝', icon: '🌊' },
  { id: 'sunset', name: '日落橙', icon: '🌅' },
  { id: 'forest', name: '森林绿', icon: '🌲' },
  { id: 'rose', name: '玫瑰粉', icon: '🌸' },
  { id: 'midnight', name: '午夜黑', icon: '🌙' },
  { id: 'fresh', name: '清新现代', icon: '💎' },
  { id: 'steady', name: '沉稳专业', icon: '🌿' },
  { id: 'warm', name: '柔和暖色', icon: '🌅' },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as ThemeType) || 'steady';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // 移除所有主题类
    root.classList.remove('theme-purple', 'theme-ocean', 'theme-sunset', 'theme-forest', 'theme-rose', 'theme-midnight', 'theme-fresh', 'theme-steady', 'theme-warm');
    
    // 添加当前主题类
    root.classList.add(`theme-${theme}`);
    
    // 保存到本地存储
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
