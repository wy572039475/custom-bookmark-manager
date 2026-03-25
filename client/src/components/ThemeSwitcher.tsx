import { useState, useRef, useEffect } from 'react';
import { useTheme, ThemeType } from '../context/ThemeContext';
import { Palette } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTheme = themes.find(t => t.id === theme);

  const getThemePreview = (themeId: ThemeType) => {
    const previews: Record<ThemeType, { gradient: string; color: string }> = {
      purple: { 
        gradient: 'linear-gradient(135deg, #667eea, #764ba2)', 
        color: '#667eea' 
      },
      ocean: { 
        gradient: 'linear-gradient(135deg, #00d4ff, #0066ff)', 
        color: '#00d4ff' 
      },
      sunset: { 
        gradient: 'linear-gradient(135deg, #ff6b35, #ff9500)', 
        color: '#ff6b35' 
      },
      forest: { 
        gradient: 'linear-gradient(135deg, #2ecc71, #27ae60)', 
        color: '#2ecc71' 
      },
      rose: { 
        gradient: 'linear-gradient(135deg, #ff6b9d, #c44569)', 
        color: '#ff6b9d' 
      },
      midnight: { 
        gradient: 'linear-gradient(135deg, #5a67d8, #3d4db7)', 
        color: '#5a67d8' 
      },
      fresh: { 
        gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', 
        color: '#3B82F6' 
      },
      steady: { 
        gradient: 'linear-gradient(135deg, #10B981, #F59E0B)', 
        color: '#10B981' 
      },
      warm: { 
        gradient: 'linear-gradient(135deg, #F97316, #EAB308)', 
        color: '#F97316' 
      },
    };
    return previews[themeId];
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all text-white"
        title="切换主题"
      >
        <Palette className="h-5 w-5" />
        <span className="hidden sm:inline text-sm font-medium">{currentTheme?.name}</span>
        <div 
          className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white/30"
          style={{ background: getThemePreview(theme).gradient }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-500" />
              选择主题风格
            </h3>
          </div>
          <div className="p-2 space-y-1">
            {themes.map((t) => {
              const preview = getThemePreview(t.id);
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200/50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-lg shadow-md ring-1 ring-black/5 flex items-center justify-center text-lg"
                    style={{ background: preview.gradient }}
                  >
                    {t.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-medium ${isActive ? 'text-purple-700' : 'text-gray-700'}`}>
                      {t.name}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
