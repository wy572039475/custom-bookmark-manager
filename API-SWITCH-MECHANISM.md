# API 切换机制改进说明

## 概述

本次更新改进了前端的 API 切换机制，实现了自动检测后端状态和智能切换功能。

## 新增功能

### 1. 自动后端健康检查

- **检查频率**: 每 30 秒自动检查一次后端状态
- **检查方式**: 通过 `/api/auth/profile` 端点检测后端可用性
- **状态显示**: 页面右上角实时显示后端状态

### 2. 智能模式切换

- **自动切换**: 当后端从离线恢复到在线时，自动尝试切换回在线模式
- **手动切换**: 用户可以手动点击"切换到在线"按钮切换模式
- **状态持久化**: 当前模式保存在 localStorage 中

### 3. 实时状态指示器

页面右上角显示三种状态：

#### 在线状态 ✅
```
📶 在线
```
- 绿色图标
- 后端服务正常运行
- 数据存储在数据库中

#### 离线状态 ⚠️
```
📶 离线
```
- 黄色图标
- 后端服务不可用
- 数据存储在 localStorage 中

#### 检查中...
```
🔄 检查中...
```
- 正在检测后端状态
- 旋转的加载图标

### 4. 手动切换按钮

当后端在线且当前处于离线模式时，显示"切换到在线"按钮：
- 点击后自动从服务器加载最新数据
- 切换成功后显示成功提示
- 失败时保持离线模式

### 5. 侧边栏统计信息

侧边栏底部新增显示：
- 当前模式（在线/离线）
- 后端状态（正常/不可用）
- 总收藏数
- 分类数

## 技术实现

### 新增文件

#### `client/src/services/api-manager.ts`
API 管理器类，提供以下功能：

```typescript
// 健康检查
checkApiHealth(): Promise<boolean>
checkRealApiAvailable(): Promise<boolean>

// 状态管理
startHealthCheck(intervalMs: number): void
stopHealthCheck(): void

// 模式切换
switchToOnline(): void
switchToOffline(): void
getCurrentMode(): 'online' | 'offline'

// 事件监听
addListener(listener: (isOnline: boolean) => void): () => void
```

### Dashboard 组件更新

#### 新增状态变量
```typescript
const [isBackendOnline, setIsBackendOnline] = useState(false);
const [isCheckingBackend, setIsCheckingBackend] = useState(false);
```

#### 新增函数
```typescript
// 检查后端状态
const checkBackendStatus = useCallback(async () => { ... });

// 尝试切换到在线模式
const trySwitchToOnline = useCallback(async () => { ... });
```

#### useEffect 更新
- 启动后端健康检查（30秒间隔）
- 添加后端状态监听器
- 后端恢复时自动切换
- 组件卸载时清理资源

## 用户体验改进

### 1. 无感知切换
- 用户不需要手动刷新页面
- 后端恢复后自动切换到在线模式
- 切换过程对用户透明

### 2. 明确的状态提示
- 实时显示后端连接状态
- 清晰指示当前使用的模式
- 操作反馈及时准确

### 3. 数据一致性
- 切换到在线模式时自动同步最新数据
- 避免数据丢失或冲突
- 乐观更新机制确保用户体验流畅

## 使用场景

### 场景 1: 后端服务正常
1. 用户打开页面
2. 自动连接到后端 API
3. 显示"在线"状态
4. 数据存储在数据库

### 场景 2: 后端服务不可用
1. 用户打开页面
2. 自动检测到后端不可用
3. 切换到离线模式
4. 显示"离线"状态
5. 数据存储在 localStorage

### 场景 3: 后端服务恢复
1. 后端服务从离线恢复
2. 系统自动检测到后端在线
3. 自动切换回在线模式
4. 从服务器加载最新数据
5. 显示"切换成功"提示

### 场景 4: 手动切换
1. 用户看到"切换到在线"按钮
2. 点击按钮手动切换
3. 系统尝试从服务器加载数据
4. 成功则切换，失败则保持当前模式

## 配置选项

### 健康检查间隔
可以在 `Dashboard.tsx` 中修改检查间隔：

```typescript
apiManager.startHealthCheck(30000); // 30秒
```

建议值：
- 开发环境: 10000ms (10秒)
- 生产环境: 60000ms (60秒)

### 超时时间
在 `api-manager.ts` 中修改超时时间：

```typescript
timeout: 3000, // 3秒
```

## 注意事项

1. **数据同步**: 离线模式下修改的数据不会自动同步到服务器
2. **数据丢失**: 清除浏览器缓存会导致离线数据丢失
3. **网络延迟**: 健康检查可能因为网络延迟而误判
4. **并发处理**: 切换模式时的请求冲突需要妥善处理

## 未来改进方向

1. **数据同步**: 实现离线数据到在线数据的自动同步
2. **冲突解决**: 处理离线数据和服务器数据的冲突
3. **离线提示**: 更明显的离线模式提示
4. **批量操作**: 支持批量上传离线数据
5. **数据迁移**: 提供数据导入/导出工具

## 调试

### 启用调试日志
在浏览器控制台会输出以下日志：

```
API 健康检查已启动，检查间隔: 30000 ms
后端已恢复，尝试切换到在线模式
尝试切换到在线模式...
已切换到在线模式
```

### 手动测试健康检查
在浏览器控制台执行：

```javascript
// 检查后端状态
import { apiManager } from './services/api-manager';
const isOnline = await apiManager.checkBackend();
console.log('后端状态:', isOnline);

// 手动切换模式
apiManager.switchToOnline();
apiManager.switchToOffline();
```
