# 数据持久化同步机制

## 概述

本次更新实现了离线数据和在线数据之间的智能同步机制，解决了之前数据无法自动同步的问题。

## 新增功能

### 1. 数据同步服务 (`data-sync.ts`)

新增了完整的数据同步服务类，提供以下功能：

#### 数据读取和保存
```typescript
// 读取离线数据
getOfflineData(): { bookmarks: Bookmark[]; categories: Category[] }

// 保存离线数据
saveOfflineData(data: { bookmarks?: Bookmark[]; categories?: Category[] }): void

// 检查是否有未同步数据
hasUnsyncedData(): boolean

// 获取离线数据统计
getOfflineDataStats(): { bookmarkCount: number; categoryCount: number }

// 清除离线数据
clearOfflineData(): void
```

#### 数据同步到服务器
```typescript
syncToServer(
  realBookmarkApi: BookmarkApi,
  realCategoryApi: CategoryApi,
  userId: string
): Promise<SyncResult>
```

**同步特性**:
- ✅ 自动去重（基于 URL 和分类名称）
- ✅ 分类优先同步（书签依赖分类）
- ✅ 分类 ID 映射处理
- ✅ 详细的同步结果报告
- ✅ 错误处理和恢复
- ✅ 同步成功后自动清除离线数据

#### 数据导出和导入
```typescript
// 导出离线数据为 JSON
exportOfflineData(): string

// 从 JSON 导入离线数据
importOfflineData(jsonString: string): Promise<void>
```

### 2. 智能模式切换

切换到在线模式时，系统会：

1. **检测离线数据**
   - 检查是否有未同步的离线数据
   - 显示数据统计（收藏数、分类数）

2. **用户确认**
   - 显示同步确认对话框
   - 提供两个选项：
     - 同步数据到服务器
     - 跳过同步（清除离线数据）

3. **数据同步**
   - 如果选择同步，执行以下步骤：
     - 同步分类（先创建新分类，跳过重复分类）
     - 同步书签（使用映射后的分类 ID，跳过重复 URL）
     - 显示同步结果
   - 如果选择跳过，直接清除离线数据

4. **加载服务器数据**
   - 从服务器加载最新数据
   - 更新本地状态
   - 切换到在线模式

### 3. 离线数据备份

当处于离线模式且有离线数据时，提供"导出离线数据"按钮：

- 点击后将离线数据导出为 JSON 文件
- 文件名格式：`offline-backup-YYYY-MM-DD.json`
- 包含版本号和导出日期

### 4. 改进的用户提示

#### 进入离线模式时
```
已切换到离线模式
当前有 5 个收藏和 3 个分类
```

#### 2秒后显示
```
提示：当后端恢复时，系统将自动切换到在线模式
或者点击右上角的"切换到在线"按钮手动切换
```

#### 同步数据时
```
正在同步数据到服务器...
```

#### 同步完成时
```
数据同步完成！
已同步 5 个收藏和 3 个分类，跳过 2 个重复收藏
```

#### 同步失败时
```
同步失败：书签 "XXX" 失败: 网络错误
```

#### 切换到在线模式失败时
```
切换到在线模式失败，请检查网络连接
```

## 技术实现

### 同步结果接口

```typescript
interface SyncResult {
  success: boolean;           // 同步是否成功
  syncedBookmarks: number;    // 已同步的书签数
  syncedCategories: number;   // 已同步的分类数
  skippedBookmarks: number;    // 跳过的书签数（重复）
  skippedCategories: number;   // 跳过的分类数（重复）
  errors: string[];           // 错误信息列表
}
```

### 同步流程

```typescript
// 1. 获取离线数据
const { bookmarks: offlineBookmarks, categories: offlineCategories } = getOfflineData();

// 2. 获取服务器数据（用于去重）
const [serverBookmarks, serverCategories] = await Promise.all([
  realBookmarkApi.getAll(),
  realCategoryApi.getAll(),
]);

// 3. 构建去重集合
const serverUrlSet = new Set(serverBookmarks.map(b => b.url));
const serverCategoryNameSet = new Map(
  serverCategories.map(c => [c.name.toLowerCase(), c.id])
);

// 4. 同步分类（先同步分类，因为书签依赖分类）
for (const category of offlineCategories) {
  const existingId = serverCategoryNameSet.get(category.name.toLowerCase());
  if (existingId) {
    // 分类已存在，使用现有分类的 ID
    categoryIdMap[category.id] = existingId;
  } else {
    // 创建新分类
    const newCategory = await realCategoryApi.create({
      name: category.name,
      color: category.color,
      icon: category.icon,
    });
    categoryIdMap[category.id] = newCategory.id;
  }
}

// 5. 同步书签
for (const bookmark of offlineBookmarks) {
  if (serverUrlSet.has(bookmark.url)) {
    // URL 已存在，跳过
    continue;
  }
  
  // 创建书签，使用映射后的分类 ID
  const mappedCategoryId = bookmark.categoryId
    ? categoryIdMap[bookmark.categoryId]
    : undefined;
    
  await realBookmarkApi.create({
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description,
    icon: bookmark.icon,
    tags: bookmark.tags || [],
    categoryId: mappedCategoryId,
  });
}
```

## 使用场景

### 场景 1：正常使用在线模式
1. 用户打开页面
2. 后端正常，使用在线模式
3. 所有操作直接保存到数据库

### 场景 2：后端不可用，进入离线模式
1. 后端服务停止
2. 系统检测到后端不可用
3. 自动切换到离线模式
4. 显示离线提示和数据统计
5. 所有操作保存到 localStorage

### 场景 3：后端恢复，自动切换
1. 后端服务恢复
2. 系统自动检测到后端在线
3. 检测到有离线数据
4. 显示同步确认对话框
5. 用户选择同步或跳过
6. 同步完成后切换到在线模式

### 场景 4：手动切换到在线模式
1. 用户点击"切换到在线"按钮
2. 系统检测到有离线数据
3. 显示同步确认对话框
4. 执行同步（如果用户确认）
5. 切换到在线模式

### 场景 5：备份离线数据
1. 用户在离线模式下
2. 点击"导出离线数据"按钮
3. 数据导出为 JSON 文件
4. 用户可以保存备份

## 数据格式

### 导出的 JSON 格式

```json
{
  "version": "1.0",
  "exportDate": "2026-03-24T12:00:00.000Z",
  "bookmarks": [
    {
      "id": "123",
      "userId": "user-id",
      "title": "示例收藏",
      "url": "https://example.com",
      "description": "描述",
      "icon": null,
      "tags": ["标签1", "标签2"],
      "categoryId": "category-id",
      "sortOrder": 0,
      "visitCount": 5,
      "lastVisited": "2026-03-24T10:00:00.000Z",
      "createdAt": "2026-03-24T08:00:00.000Z",
      "updatedAt": "2026-03-24T08:00:00.000Z"
    }
  ],
  "categories": [
    {
      "id": "category-id",
      "userId": "user-id",
      "name": "示例分类",
      "color": "#3b82f6",
      "icon": "fas fa-folder",
      "sortOrder": 0,
      "createdAt": "2026-03-24T08:00:00.000Z"
    }
  ]
}
```

## 注意事项

### 1. 数据冲突处理
- **分类冲突**: 如果分类名称相同，使用服务器上的分类
- **书签冲突**: 如果 URL 相同，跳过该书签
- **优先级**: 服务器数据 > 离线数据

### 2. 同步失败处理
- 单个书签/分类同步失败不影响其他数据
- 所有错误都会被记录并在结果中显示
- 同步成功后离线数据会被清除

### 3. 数据丢失风险
- 清除浏览器缓存会导致离线数据丢失
- 建议定期导出离线数据备份
- 重要数据建议尽快同步到服务器

### 4. 性能考虑
- 同步操作是串行的，确保数据一致性
- 大量数据同步可能需要较长时间
- 同步过程中显示加载状态

## 最佳实践

### 1. 定期同步
- 后端恢复后尽快同步数据
- 不要长期依赖离线模式
- 定期导出数据备份

### 2. 网络环境
- 在稳定的网络环境下进行同步
- 避免在同步过程中切换网络
- 同步失败时可以重试

### 3. 数据管理
- 及时清理不需要的离线数据
- 定期检查和整理收藏
- 使用分类和标签提高可管理性

## 故障排除

### 问题：同步失败
**可能原因**:
- 网络连接不稳定
- 服务器返回错误
- 数据格式不正确

**解决方法**:
- 检查网络连接
- 查看浏览器控制台错误
- 尝试重新同步

### 问题：数据丢失
**可能原因**:
- 清除了浏览器缓存
- 使用了隐私模式
- 存储空间不足

**解决方法**:
- 定期导出数据备份
- 避免清除浏览器缓存
- 检查存储空间

### 问题：重复数据
**可能原因**:
- 多次同步相同数据
- 离线数据未清除

**解决方法**:
- 系统会自动去重
- 手动清理重复数据
- 同步成功后离线数据会自动清除

## 未来改进方向

1. **增量同步**: 只同步变化的数据，提高效率
2. **后台同步**: 在后台自动同步，不影响用户操作
3. **冲突解决**: 提供更灵活的冲突处理选项
4. **批量操作**: 支持批量导入/导出
5. **版本控制**: 保留数据历史版本
6. **多设备同步**: 支持多设备间数据同步
7. **云端备份**: 自动备份到云端
