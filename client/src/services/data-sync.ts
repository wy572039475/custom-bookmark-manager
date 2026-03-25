import type { Bookmark, Category } from '../types';

/**
 * 数据同步服务
 * 负责在离线模式和在线模式之间同步数据
 */

export interface SyncResult {
  success: boolean;
  syncedBookmarks: number;
  syncedCategories: number;
  skippedBookmarks: number;
  skippedCategories: number;
  errors: string[];
}

export class DataSyncService {
  private static instance: DataSyncService;

  private constructor() {}

  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  /**
   * 从 localStorage 读取离线数据
   */
  public getOfflineData(): { bookmarks: Bookmark[]; categories: Category[] } {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('mock_bookmarks') || '[]');
      const categories = JSON.parse(localStorage.getItem('mock_categories') || '[]');
      return { bookmarks, categories };
    } catch (error) {
      console.error('读取离线数据失败:', error);
      return { bookmarks: [], categories: [] };
    }
  }

  /**
   * 将数据保存到 localStorage
   */
  public saveOfflineData(data: { bookmarks?: Bookmark[]; categories?: Category[] }): void {
    try {
      if (data.bookmarks) {
        localStorage.setItem('mock_bookmarks', JSON.stringify(data.bookmarks));
      }
      if (data.categories) {
        localStorage.setItem('mock_categories', JSON.stringify(data.categories));
      }
    } catch (error) {
      console.error('保存离线数据失败:', error);
      throw new Error('保存数据失败，请检查存储空间');
    }
  }

  /**
   * 检查是否有未同步的离线数据
   */
  public hasUnsyncedData(): boolean {
    const { bookmarks, categories } = this.getOfflineData();
    return bookmarks.length > 0 || categories.length > 0;
  }

  /**
   * 获取离线数据统计
   */
  public getOfflineDataStats(): { bookmarkCount: number; categoryCount: number } {
    const { bookmarks, categories } = this.getOfflineData();
    return {
      bookmarkCount: bookmarks.length,
      categoryCount: categories.length,
    };
  }

  /**
   * 清除离线数据
   */
  public clearOfflineData(): void {
    localStorage.removeItem('mock_bookmarks');
    localStorage.removeItem('mock_categories');
    localStorage.removeItem('mock_users');
  }

  /**
   * 同步离线数据到服务器
   * @param realBookmarkApi 真实书签 API
   * @param realCategoryApi 真实分类 API
   * @param userId 用户 ID
   */
  public async syncToServer(
    realBookmarkApi: {
      create: (data: any) => Promise<Bookmark>;
      getAll: () => Promise<Bookmark[]>;
    },
    realCategoryApi: {
      create: (data: any) => Promise<Category>;
      getAll: () => Promise<Category[]>;
      update?: (id: string, data: Partial<Category>) => Promise<Category>;
    },
    userId: string
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedBookmarks: 0,
      syncedCategories: 0,
      skippedBookmarks: 0,
      skippedCategories: 0,
      errors: [],
    };

    try {
      // 获取离线数据
      const { bookmarks: offlineBookmarks, categories: offlineCategories } = this.getOfflineData();

      // 获取服务器数据（用于去重）
      const [serverBookmarks, serverCategories] = await Promise.all([
        realBookmarkApi.getAll(),
        realCategoryApi.getAll(),
      ]);

      const serverUrlSet = new Set(serverBookmarks.map(b => b.url));
      const serverCategoryNameSet = new Map(
        serverCategories.map(c => [c.name.toLowerCase(), c.id])
      );

      // 同步分类（先同步分类，因为书签依赖分类）
      const categoryIdMap: Record<string, string> = {};

      for (const category of offlineCategories) {
        try {
          const existingId = serverCategoryNameSet.get(category.name.toLowerCase());
          
          if (existingId) {
            // 分类已存在，使用现有分类
            categoryIdMap[category.id] = existingId;
            result.skippedCategories++;
          } else {
            // 创建新分类
            const newCategory = await realCategoryApi.create({
              name: category.name,
              color: category.color,
              icon: category.icon,
            });
            categoryIdMap[category.id] = newCategory.id;
            result.syncedCategories++;
          }
        } catch (error: any) {
          result.errors.push(`同步分类 "${category.name}" 失败: ${error.message}`);
        }
      }

      // 同步书签
      for (const bookmark of offlineBookmarks) {
        try {
          // 检查 URL 是否已存在
          if (serverUrlSet.has(bookmark.url)) {
            result.skippedBookmarks++;
            continue;
          }

          // 创建书签，使用映射后的分类 ID
          const mappedCategoryId = bookmark.categoryId
            ? categoryIdMap[bookmark.categoryId]
            : undefined;

          const newBookmark = await realBookmarkApi.create({
            title: bookmark.title,
            url: bookmark.url,
            description: bookmark.description,
            icon: bookmark.icon,
            tags: bookmark.tags || [],
            categoryId: mappedCategoryId,
          });
          result.syncedBookmarks++;
        } catch (error: any) {
          result.errors.push(`同步书签 "${bookmark.title}" 失败: ${error.message}`);
        }
      }

      // 如果全部同步成功，清除离线数据
      if (result.errors.length === 0) {
        this.clearOfflineData();
        console.log('离线数据已全部同步到服务器，本地数据已清除');
      } else if (result.syncedBookmarks > 0 || result.syncedCategories > 0) {
        console.log('部分数据同步成功，但仍有错误');
      }

    } catch (error: any) {
      result.success = false;
      result.errors.push(`同步失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 从服务器下载数据到本地
   */
  public async syncFromServer(
    serverBookmarks: Bookmark[],
    serverCategories: Category[]
  ): Promise<void> {
    try {
      this.saveOfflineData({
        bookmarks: serverBookmarks,
        categories: serverCategories,
      });
      console.log('已从服务器同步数据到本地');
    } catch (error) {
      console.error('从服务器同步数据失败:', error);
      throw error;
    }
  }

  /**
   * 导出离线数据为 JSON
   */
  public exportOfflineData(): string {
    const { bookmarks, categories } = this.getOfflineData();
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      bookmarks,
      categories,
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * 从 JSON 导入离线数据
   */
  public async importOfflineData(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        throw new Error('无效的书签数据格式');
      }
      
      if (!data.categories || !Array.isArray(data.categories)) {
        throw new Error('无效的分类数据格式');
      }

      // 验证数据结构
      for (const bookmark of data.bookmarks) {
        if (!bookmark.title || !bookmark.url) {
          throw new Error('书签数据缺少必需字段');
        }
      }

      this.saveOfflineData({
        bookmarks: data.bookmarks,
        categories: data.categories,
      });
    } catch (error) {
      console.error('导入离线数据失败:', error);
      throw new Error('导入数据失败：数据格式不正确');
    }
  }
}

// 导出单例实例
export const dataSyncService = DataSyncService.getInstance();
