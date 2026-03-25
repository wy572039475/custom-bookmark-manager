import type { AuthResponse, LoginData, RegisterData, User, Category, Bookmark, Device, SyncData } from '../types';

// 模拟数据库
class MockDatabase {
  private _users: User[] = [];
  private _categories: Category[] = [];
  private _bookmarks: Bookmark[] = [];

  // 公共 getter
  get users() { return this._users; }
  get categories() { return this._categories; }
  get bookmarks() { return this._bookmarks; }

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      this._users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      this._categories = JSON.parse(localStorage.getItem('mock_categories') || '[]');
      this._bookmarks = JSON.parse(localStorage.getItem('mock_bookmarks') || '[]');
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('mock_users', JSON.stringify(this._users));
      localStorage.setItem('mock_categories', JSON.stringify(this._categories));
      localStorage.setItem('mock_bookmarks', JSON.stringify(this._bookmarks));
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  }

  // 用户相关
  addUser(user: User) {
    this._users.push(user);
    this.saveToStorage();
  }

  findUserByEmail(email: string): User | undefined {
    return this._users.find(u => u.email === email);
  }

  findUserByUsername(username: string): User | undefined {
    return this._users.find(u => u.username === username);
  }

  // 分类相关
  addCategory(category: Category) {
    this._categories.push(category);
    this.saveToStorage();
  }

  getCategoriesByUserId(userId: string): Category[] {
    return this._categories.filter(c => c.userId === userId);
  }

  updateCategory(id: string, data: Partial<Category>) {
    const index = this._categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this._categories[index] = { ...this._categories[index], ...data };
      this.saveToStorage();
    }
  }

  deleteCategory(id: string) {
    this._categories = this._categories.filter(c => c.id !== id);
    this._bookmarks.forEach(b => {
      if (b.categoryId === id) {
        b.categoryId = undefined;
      }
    });
    this.saveToStorage();
  }

  // 收藏相关
  addBookmark(bookmark: Bookmark) {
    this._bookmarks.push(bookmark);
    this.saveToStorage();
  }

  getBookmarksByUserId(userId: string): Bookmark[] {
    return this._bookmarks.filter(b => b.userId === userId);
  }

  updateBookmark(id: string, data: Partial<Bookmark>) {
    const index = this._bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
      this._bookmarks[index] = { ...this._bookmarks[index], ...data, updatedAt: new Date().toISOString() };
      this.saveToStorage();
    }
  }

  deleteBookmark(id: string) {
    this._bookmarks = this._bookmarks.filter(b => b.id !== id);
    this.saveToStorage();
  }

  incrementVisitCount(id: string) {
    const bookmark = this._bookmarks.find(b => b.id === id);
    if (bookmark) {
      bookmark.visitCount++;
      this.saveToStorage();
    }
  }

  // 导出
  exportData(userId: string) {
    return {
      bookmarks: this._bookmarks.filter(b => b.userId === userId),
      categories: this._categories.filter(c => c.userId === userId),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // 导入
  importData(userId: string, data: any) {
    // 获取现有URL列表用于去重
    const existingUrls = new Set(this._bookmarks
      .filter(b => b.userId === userId)
      .map(b => b.url));
    
    // 获取现有分类名称列表用于去重
    const existingCategoryNames = new Map(
      this._categories
        .filter(c => c.userId === userId)
        .map(c => [c.name.toLowerCase(), c.id])
    );
    
    // 分类ID映射：旧ID -> 新ID
    const categoryIdMap: Record<string, string> = {};
    
    // 支持两种格式：包含bookmarks数组的格式 或 直接的书签数组
    const bookmarksToImport = Array.isArray(data) ? data : (data.bookmarks || []);
    
    // 先导入分类（如果有）
    if (data.categories && Array.isArray(data.categories)) {
      data.categories.forEach((c: any) => {
        const name = c.name || '未命名分类';
        
        // 检查是否已存在同名分类
        const existingId = existingCategoryNames.get(name.toLowerCase());
        if (existingId) {
          // 存在同名分类，使用现有分类的ID
          categoryIdMap[c.id] = existingId;
        } else {
          // 不存在同名分类，创建新分类
          const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          const newCategory: Category = {
            id: newId,
            userId: userId,
            name: name,
            color: c.color || '#3b82f6',
            icon: c.icon || null,
            sortOrder: c.sortOrder ?? c.sort_order ?? 0,
            createdAt: c.createdAt || new Date().toISOString()
          };
          this._categories.push(newCategory);
          categoryIdMap[c.id] = newId;
          existingCategoryNames.set(name.toLowerCase(), newId);
        }
      });
    }
    
    // 导入书签
    if (bookmarksToImport.length > 0) {
      bookmarksToImport.forEach((b: any) => {
        // 去重：只导入不存在的URL
        if (b.url && !existingUrls.has(b.url)) {
          // 获取分类ID，如果有的话使用映射后的新分类ID
          const oldCategoryId = b.categoryId || b.category_id;
          const newCategoryId = oldCategoryId ? (categoryIdMap[oldCategoryId] || null) : null;
          
          const bookmark: Bookmark = {
            id: b.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: userId,
            title: b.title || b.url,
            url: b.url,
            description: b.description || '',
            icon: b.icon || null,
            tags: b.tags || [],
            categoryId: newCategoryId,
            sortOrder: b.sortOrder ?? b.sort_order ?? 0,
            visitCount: b.visitCount ?? b.visit_count ?? 0,
            lastVisited: b.lastVisited ?? b.last_visited,
            createdAt: b.createdAt || new Date().toISOString(),
            updatedAt: b.updatedAt || b.updated_at || new Date().toISOString()
          };
          this._bookmarks.push(bookmark);
          existingUrls.add(b.url);
        }
      });
    }
    this.saveToStorage();
  }

  clear() {
    this._users = [];
    this._categories = [];
    this._bookmarks = [];
    this.saveToStorage();
  }
}

const db = new MockDatabase();

// 认证相关API
export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    const { username, email } = data;

    // 检查用户是否已存在
    if (db.findUserByEmail(email)) {
      throw new Error('邮箱已被使用');
    }

    if (db.findUserByUsername(username)) {
      throw new Error('用户名已被使用');
    }

    // 创建用户
    const user: User = {
      id: Date.now().toString(),
      username,
      email,
      createdAt: new Date().toISOString()
    };

    db.addUser(user);

    // 生成简单的token
    const token = btoa(`${user.id}:${Date.now()}`);

    return {
      user,
      token
    };
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    const { email } = data;

    const user = db.findUserByEmail(email);

    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    // 在实际应用中应该验证密码，这里简化处理
    const token = btoa(`${user.id}:${Date.now()}`);

    return {
      user,
      token
    };
  },

  getProfile: async (): Promise<User> => {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    // 从token获取用户ID
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录');
    }

    const userId = atob(token).split(':')[0];
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  },

  autoLogin: async (): Promise<AuthResponse> => {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    const fingerprint = localStorage.getItem('device_fingerprint');

    if (!fingerprint) {
      throw new Error('缺少设备指纹');
    }

    // 检查用户是否已存在
    let user = db.findUserByUsername(fingerprint);

    if (!user) {
      // 用户不存在,创建匿名用户
      user = {
        id: fingerprint,
        username: `访客${Date.now().toString().slice(-6)}`,
        email: `guest_${Date.now()}@auto.local`,
        createdAt: new Date().toISOString()
      };

      db.addUser(user);
    }

    const token = btoa(`${user.id}:${Date.now()}`);

    return {
      user,
      token
    };
  },
};

// 分类相关API
export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录');
    }

    const userId = atob(token).split(':')[0];
    return db.getCategoriesByUserId(userId);
  },

  create: async (data: Omit<Category, 'id' | 'userId' | 'createdAt' | 'sortOrder'>): Promise<Category> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录');
    }

    const userId = atob(token).split(':')[0];
    const category: Category = {
      id: Date.now().toString(),
      userId,
      name: data.name,
      color: data.color,
      sortOrder: 0,
      createdAt: new Date().toISOString()
    };

    db.addCategory(category);
    return category;
  },

  update: async (id: string, data: Partial<Category>): Promise<Category> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    db.updateCategory(id, data);
    const category = db.categories.find(c => c.id === id);
    if (!category) {
      throw new Error('分类不存在');
    }
    return category;
  },

  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    db.deleteCategory(id);
  },
};

// 收藏相关API
export const bookmarkApi = {
  getAll: async (params?: { categoryId?: string; search?: string }): Promise<Bookmark[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录');
    }

    const userId = atob(token).split(':')[0];
    let bookmarks = db.getBookmarksByUserId(userId);

    if (params?.categoryId) {
      bookmarks = bookmarks.filter(b => b.categoryId === params.categoryId);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      bookmarks = bookmarks.filter(b =>
        b.title.toLowerCase().includes(search) ||
        b.url.toLowerCase().includes(search) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(search)))
      );
    }

    return bookmarks;
  },

  getById: async (id: string): Promise<Bookmark> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const bookmark = db.bookmarks.find(b => b.id === id);
    if (!bookmark) {
      throw new Error('收藏不存在');
    }
    return bookmark;
  },

  create: async (data: Omit<Bookmark, 'id' | 'userId' | 'visitCount' | 'createdAt' | 'updatedAt'>): Promise<Bookmark> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录');
    }

    const userId = atob(token).split(':')[0];
    const bookmark: Bookmark = {
      id: Date.now().toString(),
      userId,
      title: data.title,
      url: data.url,
      description: data.description,
      tags: [],
      categoryId: data.categoryId,
      visitCount: 0,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addBookmark(bookmark);
    return bookmark;
  },

  update: async (id: string, data: Partial<Bookmark>): Promise<Bookmark> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    db.updateBookmark(id, data);
    const bookmark = db.bookmarks.find(b => b.id === id);
    if (!bookmark) {
      throw new Error('收藏不存在');
    }
    return bookmark;
  },

  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    db.deleteBookmark(id);
  },

  incrementVisit: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    db.incrementVisitCount(id);
  },

  search: async (query: string): Promise<Bookmark[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录');
    }

    const userId = atob(token).split(':')[0];
    const bookmarks = db.getBookmarksByUserId(userId);
    const search = query.toLowerCase();

    return bookmarks.filter(b =>
      b.title.toLowerCase().includes(search) ||
      b.url.toLowerCase().includes(search) ||
      b.description?.toLowerCase().includes(search) ||
      (b.tags && b.tags.some(t => t.toLowerCase().includes(search)))
    );
  },

  export: async (): Promise<Blob> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录');
    }

    const userId = atob(token).split(':')[0];
    const data = db.exportData(userId);
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  },

  import: async (file: File): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const text = await file.text();
    const data = JSON.parse(text);

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录');
    }

    const userId = atob(token).split(':')[0];
    db.importData(userId, data);
  },
};

// 检查是否使用模拟模式
export const useMockApi = () => {
  return localStorage.getItem('use_mock_api') === 'true';
};

export const setMockApi = (useMock: boolean) => {
  localStorage.setItem('use_mock_api', useMock.toString());
};

export default {
  authApi,
  categoryApi,
  bookmarkApi,
  useMockApi,
  setMockApi,
};
