import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { bookmarkApi as realBookmarkApi, categoryApi as realCategoryApi } from '../services/api';
import { bookmarkApi as mockBookmarkApi, categoryApi as mockCategoryApi } from '../services/mock-api';
import { apiManager } from '../services/api-manager';
import { dataSyncService } from '../services/data-sync';
import { Bookmark as BookmarkType, Category } from '../types';
import { BookmarkCard } from '../components/BookmarkCard';
import { BookmarkForm } from '../components/BookmarkForm';
import { CategoryForm } from '../components/CategoryForm';
import { Button } from '../components/ui/Button';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { Search, Plus, FolderPlus, Download, Upload, LayoutGrid, List, LayoutDashboard, Edit2, ChevronLeft, ChevronRight, Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { BackgroundDecorations, SidebarDecorations } from '../components/BackgroundDecorations';
import { useTheme } from '../context/ThemeContext';

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { fingerprint, isLoading: deviceLoading } = useDevice();
  const toast = useToast();
  const { confirm, DialogComponent } = useConfirmDialog();
  const { theme } = useTheme();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [deletingBookmarkIds, setDeletingBookmarkIds] = useState<Set<string>>(new Set());
  const [deletingCategoryIds, setDeletingCategoryIds] = useState<Set<string>>(new Set());
  
  // 是否为清新主题(浅色侧边栏)
  const isFreshTheme = theme === 'fresh';

  // 等待设备指纹和认证加载完成后再加载数据
  useEffect(() => {
    if (!deviceLoading && !authLoading && fingerprint && user) {
      const savedUseMock = localStorage.getItem('use_mock_api') === 'true';
      setUseMock(savedUseMock);
      loadData();

      // 启动后端健康检查
      apiManager.startHealthCheck(30000); // 每30秒检查一次

      // 添加后端状态监听器
      const unsubscribe = apiManager.addListener((isOnline: boolean) => {
        setIsBackendOnline(isOnline);
        // 如果后端恢复在线，且当前是离线模式，尝试切换回在线模式
        const currentUseMock = localStorage.getItem('use_mock_api') === 'true';
        if (isOnline && currentUseMock) {
          console.log('后端已恢复，尝试切换到在线模式');
          trySwitchToOnline();
        }
      });

      // 初始检查后端状态
      checkBackendStatus();

      // 组件卸载时清理
      return () => {
        apiManager.stopHealthCheck();
        unsubscribe();
      };
    }
  }, [deviceLoading, authLoading, fingerprint, user]);

  // 检查后端状态
  const checkBackendStatus = useCallback(async () => {
    setIsCheckingBackend(true);
    const isOnline = await apiManager.checkBackend();
    setIsBackendOnline(isOnline);
    setIsCheckingBackend(false);
    return isOnline;
  }, []);

  // 尝试切换到在线模式
  const trySwitchToOnline = useCallback(async () => {
    try {
      console.log('尝试切换到在线模式...');
      
      // 检查是否有未同步的离线数据
      const hasOfflineData = dataSyncService.hasUnsyncedData();
      
      if (hasOfflineData) {
        const stats = dataSyncService.getOfflineDataStats();
        
        // 显示确认对话框
        const confirmed = await confirm({
          title: '同步离线数据',
          message: `检测到 ${stats.bookmarkCount} 个收藏和 ${stats.categoryCount} 个分类的离线数据。\n\n是否将这些数据同步到服务器？`,
          confirmText: '同步数据',
          cancelText: '跳过同步',
          variant: 'info',
        });

        if (confirmed) {
          toast.info('正在同步数据到服务器...');
          
          // 同步数据到服务器
          const syncResult = await dataSyncService.syncToServer(
            {
              create: realBookmarkApi.create,
              getAll: realBookmarkApi.getAll,
            },
            {
              create: realCategoryApi.create,
              getAll: realCategoryApi.getAll,
            },
            user?.id || ''
          );

          if (syncResult.success) {
            toast.success(
              `数据同步完成！\n已同步 ${syncResult.syncedBookmarks} 个收藏和 ${syncResult.syncedCategories} 个分类${
                syncResult.skippedBookmarks > 0 ? `，跳过 ${syncResult.skippedBookmarks} 个重复收藏` : ''
              }`
            );
          } else {
            toast.error(`同步失败：${syncResult.errors.join(', ')}`);
          }
        } else {
          // 用户选择跳过同步，清除离线数据
          dataSyncService.clearOfflineData();
          toast.info('已跳过同步，离线数据已清除');
        }
      }

      // 从服务器加载最新数据
      const [bookmarksRes, categoriesRes] = await Promise.all([
        realBookmarkApi.getAll(),
        realCategoryApi.getAll(),
      ]);
      setBookmarks(bookmarksRes);
      setCategories(categoriesRes);
      setUseMock(false);
      apiManager.switchToOnline();
      localStorage.setItem('use_mock_api', 'false');
      
      if (!hasOfflineData) {
        toast.success('已切换到在线模式');
      }
    } catch (error) {
      console.log('切换到在线模式失败，保持离线模式:', error);
      toast.error('切换到在线模式失败，请检查网络连接');
    }
  }, [toast, confirm, user]);

  const loadData = async () => {
    try {
      // 先尝试使用真实API
      const [bookmarksRes, categoriesRes] = await Promise.all([
        realBookmarkApi.getAll(),
        realCategoryApi.getAll(),
      ]);
      setBookmarks(bookmarksRes);
      setCategories(categoriesRes);
      setUseMock(false);
      setIsBackendOnline(true);
    } catch (error) {
      console.log('后端未连接，使用模拟数据');
      // 如果后端不可用，使用模拟API
      try {
        const [bookmarksRes, categoriesRes] = await Promise.all([
          mockBookmarkApi.getAll(),
          mockCategoryApi.getAll(),
        ]);
        setBookmarks(bookmarksRes);
        setCategories(categoriesRes);
        setUseMock(true);
        setIsBackendOnline(false);
        
        // 显示离线模式提示
        const stats = dataSyncService.getOfflineDataStats();
        toast.info(
          `已切换到离线模式\n当前有 ${stats.bookmarkCount} 个收藏和 ${stats.categoryCount} 个分类`,
          { duration: 5000 }
        );
        
        // 提示用户可以通过刷新页面尝试重新连接
        setTimeout(() => {
          toast.info(
            '提示：当后端恢复时，系统将自动切换到在线模式\n或者点击右上角的"切换到在线"按钮手动切换',
            { duration: 6000 }
          );
        }, 2000);
      } catch (mockError) {
        console.error('模拟API也失败了:', mockError);
        setLoading(false);
        toast.error('数据加载失败，请刷新页面重试', { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddBookmark = async (data: Omit<BookmarkType, 'id' | 'userId' | 'visitCount' | 'createdAt' | 'updatedAt'>) => {
    // 乐观更新：立即添加到本地状态
    const tempId = `temp-${Date.now()}`;
    const optimisticBookmark: BookmarkType = {
      id: tempId,
      ...data,
      userId: user?.id || '',
      visitCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBookmarks(prev => [...prev, optimisticBookmark]);
    setShowBookmarkForm(false);

    try {
      let newBookmark: BookmarkType;
      if (useMock) {
        newBookmark = await mockBookmarkApi.create(data);
      } else {
        newBookmark = await realBookmarkApi.create(data);
      }
      // 用服务器返回的真实数据替换临时数据
      setBookmarks(prev => prev.map(b => b.id === tempId ? newBookmark : b));
      toast.success('添加收藏成功');
    } catch (error: any) {
      // 失败时回滚
      setBookmarks(prev => prev.filter(b => b.id !== tempId));
      console.error('添加收藏失败:', error);

      // 根据错误类型显示不同的提示
      if (error.message?.includes('URL格式')) {
        toast.error('URL 格式不正确，请检查输入');
      } else if (error.message?.includes('已存在') || error.message?.includes('冲突')) {
        toast.error('该收藏已存在');
      } else {
        toast.error('添加收藏失败，请稍后重试');
      }
    }
  };

  const handleUpdateBookmark = async (data: Omit<BookmarkType, 'id' | 'userId' | 'visitCount' | 'createdAt' | 'updatedAt'>) => {
    if (!editingBookmark) return;

    // 乐观更新：立即更新本地状态
    // 保存更新前的完整副本（深度拷贝）
    const previousBookmark = { ...editingBookmark };
    const originalBookmarkId = editingBookmark.id;
    setBookmarks(prev => prev.map(b => 
      b.id === editingBookmark.id 
        ? { ...b, ...data, updatedAt: new Date().toISOString() }
        : b
    ));
    setShowBookmarkForm(false);
    setEditingBookmark(null);

    try {
      if (useMock) {
        await mockBookmarkApi.update(editingBookmark.id, data);
      } else {
        await realBookmarkApi.update(editingBookmark.id, data);
      }
    } catch (error) {
      // 失败时回滚
      setBookmarks(prev => prev.map(b => 
        b.id === originalBookmarkId ? previousBookmark : b
      ));
      console.error('更新收藏失败:', error);
      toast.error('更新收藏失败');
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    // 防止重复点击
    if (deletingBookmarkIds.has(id)) {
      return;
    }

    const confirmed = await confirm({
      title: '删除收藏',
      message: '确定要删除这个收藏吗？',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
    });
    if (!confirmed) return;

    // 标记为删除中
    setDeletingBookmarkIds(prev => new Set(prev).add(id));

    // 乐观更新：立即从本地状态移除
    // 保存删除前的完整副本（深度拷贝）
    const previousBookmarks = [...bookmarks];
    setBookmarks(prev => prev.filter(b => b.id !== id));

    try {
      if (useMock) {
        await mockBookmarkApi.delete(id);
      } else {
        await realBookmarkApi.delete(id);
      }
      // 删除成功，移除删除中的标记
      setDeletingBookmarkIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success('删除收藏成功');
    } catch (error: any) {
      // 失败时回滚
      setBookmarks(previousBookmarks);
      setDeletingBookmarkIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      console.error('删除收藏失败:', error);

      if (error.message?.includes('网络') || error.message?.includes('连接')) {
        toast.error('网络错误，删除失败，请检查网络连接');
      } else if (error.message?.includes('权限') || error.message?.includes('授权')) {
        toast.error('没有权限删除此收藏');
      } else {
        toast.error('删除收藏失败，请稍后重试');
      }
    }
  };

  const handleVisitBookmark = async (id: string, url: string) => {
    window.open(url, '_blank');
  };

  const handleAddCategory = async (data: Omit<Category, 'id' | 'userId' | 'createdAt' | 'sortOrder'>) => {
    // 乐观更新：立即更新本地状态
    const tempId = `temp-${Date.now()}`;
    const optimisticCategory: Category = {
      id: tempId,
      ...data,
      userId: user?.id || '',
      createdAt: new Date().toISOString(),
      sortOrder: categories.length,
    };
    setCategories(prev => [...prev, optimisticCategory]);
    setShowCategoryForm(false);

    try {
      let newCategory: Category;
      if (useMock) {
        newCategory = await mockCategoryApi.create(data);
      } else {
        newCategory = await realCategoryApi.create(data);
      }
      // 用服务器返回的真实数据替换临时数据
      setCategories(prev => prev.map(c => c.id === tempId ? newCategory : c));
    } catch (error) {
      // 失败时回滚
      setCategories(prev => prev.filter(c => c.id !== tempId));
      console.error('添加分类失败:', error);
      toast.error('添加分类失败');
    }
  };

  const handleUpdateCategory = async (data: Omit<Category, 'id' | 'userId' | 'createdAt' | 'sortOrder'>) => {
    if (!editingCategory) return;

    // 乐观更新：立即更新本地状态
    // 保存更新前的完整副本（深度拷贝）
    const previousCategory = { ...editingCategory };
    const originalCategoryId = editingCategory.id;
    setCategories(prev => prev.map(c => 
      c.id === editingCategory.id 
        ? { ...c, ...data }
        : c
    ));
    setShowCategoryForm(false);
    setEditingCategory(null);

    try {
      if (useMock) {
        await mockCategoryApi.update(editingCategory.id, data);
      } else {
        await realCategoryApi.update(editingCategory.id, data);
      }
    } catch (error) {
      // 失败时回滚
      setCategories(prev => prev.map(c => 
        c.id === originalCategoryId ? previousCategory : c
      ));
      console.error('更新分类失败:', error);
      toast.error('更新分类失败');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    // 防止重复点击
    if (deletingCategoryIds.has(id)) {
      return;
    }

    const confirmed = await confirm({
      title: '删除分类',
      message: '确定要删除这个分类吗？该分类下的所有收藏将变为未分类状态。',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'warning',
    });
    if (!confirmed) return;

    // 标记为删除中
    setDeletingCategoryIds(prev => new Set(prev).add(id));

    // 乐观更新：立即从本地状态移除
    // 保存删除前的完整副本（深度拷贝）
    const previousCategories = [...categories];
    const previousSelectedCategory = selectedCategory;
    setCategories(prev => prev.filter(c => c.id !== id));
    if (selectedCategory === id) setSelectedCategory(null);

    try {
      if (useMock) {
        await mockCategoryApi.delete(id);
      } else {
        await realCategoryApi.delete(id);
      }
      // 删除成功，移除删除中的标记
      setDeletingCategoryIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      // 失败时回滚
      setCategories(previousCategories);
      if (previousSelectedCategory === id) setSelectedCategory(previousSelectedCategory);
      setDeletingCategoryIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      console.error('删除分类失败:', error);
      toast.error('删除分类失败');
    }
  };

  const handleExport = async () => {
    try {
      const response = useMock ? await mockBookmarkApi.export() : await realBookmarkApi.export();
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookmarks-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (useMock) {
        await mockBookmarkApi.import(file);
      } else {
        await realBookmarkApi.import(file);
      }
      toast.success('导入成功');
      loadData();
    } catch (error: any) {
      console.error('导入失败:', error);

      if (error.message?.includes('格式')) {
        toast.error('文件格式不正确，请上传 JSON 文件');
      } else if (error.message?.includes('解析')) {
        toast.error('文件解析失败，请检查文件内容');
      } else {
        toast.error('导入失败，请稍后重试');
      }
    }
    e.target.value = '';
  };

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesSearch =
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = selectedCategory
      ? bookmark.categoryId === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  // 根据搜索关键词过滤分类
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const getCategoryIcon = (name: string) => {
    if (name.includes('开发')) return 'fas fa-code';
    if (name.includes('娱乐')) return 'fas fa-gamepad';
    if (name.includes('常用')) return 'fas fa-globe';
    return 'fas fa-folder';
  };

  if (authLoading || deviceLoading || loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg relative">
      {/* 背景装饰 */}
      <BackgroundDecorations />
      
      {/* Header */}
      <header className="header-gradient backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mr-4 shadow-lg pulse-glow">
              <LayoutDashboard className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white text-glow">工作导航</h1>
              <p className="text-xs text-white/70 mt-0.5">智能书签管理系统</p>
            </div>
          </div>
          <div className="flex items-center">
            {/* 后端状态指示器 */}
            <div className="mr-4 flex items-center">
              {isCheckingBackend ? (
                <div className="flex items-center text-white/70">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-xs">检查中...</span>
                </div>
              ) : isBackendOnline ? (
                <div className="flex items-center text-green-400">
                  <Wifi className="h-4 w-4 mr-1" />
                  <span className="text-xs">在线</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-400">
                  <WifiOff className="h-4 w-4 mr-1" />
                  <span className="text-xs">离线</span>
                </div>
              )}
            </div>

            {useMock && (
              <span className="mr-4 badge-new px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                离线模式
              </span>
            )}

            {/* 手动切换按钮 */}
            {isBackendOnline && useMock && (
              <button
                onClick={trySwitchToOnline}
                className="mr-4 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all shadow-md border border-green-500/30"
                title="切换到在线模式"
              >
                切换到在线
              </button>
            )}

            <div className="mr-4">
              <ThemeSwitcher />
            </div>
            <div className="flex items-center text-white mr-4">
              <span className="text-sm opacity-90">访问统计:</span>
              <span className="ml-2 font-semibold gradient-text">{bookmarks.length} 个收藏</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`sidebar-gradient min-h-screen flex flex-col border-r border-white/10 relative transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20 p-3' : 'w-72 p-6'}`}>
          {/* 侧边栏装饰 */}
          <SidebarDecorations />
          
          {/* 收缩/展开按钮 */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full gradient-primary flex items-center justify-center shadow-lg z-10 hover:scale-110 transition-transform cursor-pointer"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4 text-white" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-white" />
            )}
          </button>
          
          {/* Actions */}
          <div className={`mb-8 space-y-4 ${sidebarCollapsed ? 'hidden' : ''}`}>
            <h2 className="text-white text-lg font-bold mb-5 flex items-center">
              <span className="w-1 h-5 gradient-primary rounded-full mr-2"></span>
              操作面板
            </h2>
            <button
              onClick={() => { setEditingBookmark(null); setShowBookmarkForm(true); }}
              className="w-full theme-btn ripple flex items-center justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              添加收藏
            </button>
            <button
              onClick={() => { setEditingCategory(null); setShowCategoryForm(true); }}
              className="w-full bg-white/10 backdrop-blur-sm text-white py-3 px-4 rounded-xl font-medium hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
            >
              <FolderPlus className="h-5 w-5 mr-2" />
              添加分类
            </button>
            <div className="flex space-x-2">
              <button
                onClick={handleExport}
                className="flex-1 bg-white/10 backdrop-blur-sm text-white py-3 px-4 rounded-xl font-medium hover:bg-white/20 transition-all flex items-center justify-center border border-white/10 hover:border-purple-400/50"
              >
                <Download className="h-5 w-5 mr-2" />
                导出
              </button>
              <button
                onClick={() => document.getElementById('import-input')?.click()}
                className="flex-1 bg-white/10 backdrop-blur-sm text-white py-3 px-4 rounded-xl font-medium hover:bg-white/20 transition-all flex items-center justify-center border border-white/10 hover:border-purple-400/50"
              >
                <Upload className="h-5 w-5 mr-2" />
                导入
              </button>
            </div>
            <input
              id="import-input"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          
          {/* 收缩状态下的快捷按钮 */}
          {sidebarCollapsed && (
            <div className="space-y-3 mb-6">
              <button
                onClick={() => { setEditingBookmark(null); setShowBookmarkForm(true); }}
                className="w-full aspect-square bg-white/10 backdrop-blur-sm text-white py-3 rounded-xl font-medium hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
                title="添加收藏"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                onClick={() => { setEditingCategory(null); setShowCategoryForm(true); }}
                className="w-full aspect-square bg-white/10 backdrop-blur-sm text-white py-3 rounded-xl font-medium hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
                title="添加分类"
              >
                <FolderPlus className="h-5 w-5" />
              </button>
              <button
                onClick={handleExport}
                className="w-full aspect-square bg-white/10 backdrop-blur-sm text-white py-3 rounded-xl font-medium hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
                title="导出"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={() => document.getElementById('import-input')?.click()}
                className="w-full aspect-square bg-white/10 backdrop-blur-sm text-white py-3 rounded-xl font-medium hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
                title="导入"
              >
                <Upload className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Categories */}
          <div className={`mb-8 flex-1 min-h-0 ${sidebarCollapsed ? 'hidden' : ''}`}>
            <h2 className="text-white text-lg font-bold mb-5 flex items-center">
              <span className="w-1 h-5 gradient-primary rounded-full mr-2"></span>
              分类导航
            </h2>
            {/* 分类搜索框 */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="搜索分类..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm text-white py-2 pl-10 pr-4 rounded-xl text-sm border border-white/10 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 placeholder-gray-400"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              <div
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                  selectedCategory === null
                    ? 'sidebar-item-active text-white border shadow-lg'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                    selectedCategory === null ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'
                  }`}>
                    <i className="fas fa-th-large text-sm"></i>
                  </div>
                  <span className="font-medium">全部收藏</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  selectedCategory === null ? 'bg-white/20' : 'bg-white/10'
                }`}>{bookmarks.length}</span>
              </div>
              {filteredCategories.map((category) => {
                const count = bookmarks.filter(b => b.categoryId === category.id).length;
                const icon = getCategoryIcon(category.name);
                return (
                  <div key={category.id} className="flex items-center group">
                    <div
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex-1 flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'sidebar-item-active text-white border shadow-lg'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                          selectedCategory === category.id ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'
                        }`}>
                          <i className={`${icon} text-sm`}></i>
                        </div>
                        <span className="flex items-center min-w-0">
                          <span className="inline-block w-3 h-3 rounded-full mr-2 flex-shrink-0 ring-2 ring-white/20" style={{ backgroundColor: category.color }}></span>
                          <span className="truncate font-medium">{category.name}</span>
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ml-2 flex-shrink-0 ${
                        selectedCategory === category.id ? 'bg-white/20' : 'bg-white/10'
                      }`}>{count}</span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(category);
                          setShowCategoryForm(true);
                        }}
                        className="p-2 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all text-white"
                        title="编辑分类"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all text-white"
                        title="删除分类"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 收缩状态下的分类图标 */}
          {sidebarCollapsed && (
            <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar">
              <div
                onClick={() => setSelectedCategory(null)}
                className={`aspect-square rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center ${
                  selectedCategory === null
                    ? 'sidebar-item-active text-white border shadow-lg'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
                title="全部收藏"
              >
                <i className="fas fa-th-large text-lg"></i>
              </div>
              {filteredCategories.slice(0, 5).map((category) => {
                const icon = getCategoryIcon(category.name);
                return (
                  <div
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`aspect-square rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center ${
                      selectedCategory === category.id
                        ? 'sidebar-item-active text-white border shadow-lg'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                    title={category.name}
                  >
                    <i className={`${icon} text-lg`}></i>
                  </div>
                );
              })}
              {filteredCategories.length > 5 && (
                <div className="aspect-square rounded-xl text-gray-400 flex items-center justify-center text-xs">
                  +{filteredCategories.length - 5}
                </div>
              )}
            </div>
          )}

          {/* Statistics */}
          <div className={`p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 ${sidebarCollapsed ? 'hidden' : ''}`}>
            <h2 className="text-white text-lg font-bold mb-4 flex items-center">
              <span className="w-1 h-5 gradient-primary rounded-full mr-2"></span>
              数据统计
            </h2>
            <div className="space-y-3 text-white">
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-gray-300 text-sm">总收藏数</span>
                <span className="font-bold gradient-text">{bookmarks.length}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-gray-300 text-sm">分类数</span>
                <span className="font-bold gradient-text">{categories.length}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-gray-300 text-sm">当前模式</span>
                <span className={`font-bold text-xs ${useMock ? 'text-yellow-400' : 'text-green-400'}`}>
                  {useMock ? '离线模式' : '在线模式'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-gray-300 text-sm">后端状态</span>
                <span className={`font-bold text-xs ${isBackendOnline ? 'text-green-400' : 'text-red-400'}`}>
                  {isBackendOnline ? '正常' : '不可用'}
                </span>
              </div>
              {useMock && dataSyncService.hasUnsyncedData() && (
                <button
                  onClick={async () => {
                    try {
                      const json = dataSyncService.exportOfflineData();
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `offline-backup-${new Date().toISOString().split('T')[0]}.json`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      toast.success('离线数据已导出');
                    } catch (error) {
                      toast.error('导出失败');
                    }
                  }}
                  className="w-full mt-2 bg-gradient-to-r from-blue-500/50 to-cyan-500/50 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-500/70 hover:to-cyan-500/70 transition-all border border-blue-400/30 flex items-center justify-center"
                  title="备份离线数据"
                >
                  <Database className="h-4 w-4 mr-2" />
                  导出离线数据
                </button>
              )}
              {useMock && (
                <button
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: '清除本地数据',
                      message: '确定要清除所有本地数据吗？这将删除所有收藏和分类。',
                      confirmText: '清除',
                      cancelText: '取消',
                      variant: 'danger',
                    });
                    if (confirmed) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="w-full mt-4 bg-gradient-to-r from-red-500/50 to-pink-500/50 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:from-red-500/70 hover:to-pink-500/70 transition-all border border-red-400/30"
                >
                  清除本地数据
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 main-content-bg rounded-tl-3xl">

          {/* Search Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="搜索标题、URL或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-enhanced pl-12"
              />
            </div>
            <div className="flex ml-4 space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white/90 text-primary shadow-lg ring-2 ring-primary/30' 
                    : 'text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white/90 text-primary shadow-lg ring-2 ring-primary/30' 
                    : 'text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Bookmarks Grid */}
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-16 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
              <div className="w-20 h-20 mx-auto mb-6 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-bookmark text-white text-3xl"></i>
              </div>
              <p className="text-white text-lg mb-6">暂无收藏</p>
              <Button
                onClick={() => { setEditingBookmark(null); setShowBookmarkForm(true); }}
                className="theme-btn ripple"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加第一个收藏
              </Button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredBookmarks.map((bookmark, index) => (
                <div key={bookmark.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <BookmarkCard
                    bookmark={bookmark}
                    categories={categories}
                    onEdit={(b) => { setEditingBookmark(b); setShowBookmarkForm(true); }}
                    onDelete={handleDeleteBookmark}
                    onVisit={handleVisitBookmark}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <BookmarkForm
        isOpen={showBookmarkForm}
        onClose={() => { setShowBookmarkForm(false); setEditingBookmark(null); }}
        onSubmit={editingBookmark ? handleUpdateBookmark : handleAddBookmark}
        bookmark={editingBookmark}
        categories={categories}
      />
      <CategoryForm
        isOpen={showCategoryForm}
        onClose={() => { setShowCategoryForm(false); setEditingCategory(null); }}
        onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
        category={editingCategory}
      />
      <DialogComponent />
    </div>
  );
}
