# 全栈收藏夹系统

一个功能完整的收藏夹管理系统，支持设备指纹认证、收藏管理、分类管理、多设备同步等功能。

## 技术栈

### 前端
- React 18 + Vite
- TypeScript
- shadcn/ui
- Tailwind CSS
- React Router
- Axios

### 后端
- Node.js + Express
- TypeScript
- Turso (SQLite 云数据库) / 本地 SQLite
- JWT 认证
- @libsql/client

## 功能特性

- ✅ 设备指纹自动登录（无密码体验）
- ✅ 收藏夹CRUD（增删改查）
- ✅ 分类管理
- ✅ 全文搜索
- ✅ 标签系统
- ✅ 收藏统计
- ✅ 数据导入/导出
- ✅ 多设备同步码
- ✅ 响应式设计
- ✅ 深色/浅色主题

## 快速开始

### 安装依赖
```bash
npm run install:all
```

### 配置数据库

#### 方式一：使用 Turso 云数据库（推荐，8GB免费）

1. 访问 https://turso.tech 并创建免费账号
2. 创建数据库：
```bash
turso db create bookmark-db
```
3. 获取数据库 URL：
```bash
turso db show bookmark-db
```
4. 创建 Auth Token：
```bash
turso auth token create bookmark-db
```
5. 配置 `.env` 文件：
```bash
STORAGE_TYPE=sqlite
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```
6. 运行数据库迁移：
```bash
cd server
npm run db:migrate:turso
```

#### 方式二：使用本地 SQLite（无云端）

1. 配置 `.env` 文件：
```bash
STORAGE_TYPE=sqlite
USE_LOCAL_SQLITE=true
LOCAL_DB_PATH=./data/bookmark.db
```
2. 运行数据库迁移：
```bash
cd server
npm run db:migrate:turso
```

数据会保存在本地文件中。

### 启动开发服务器
```bash
npm run dev
```

前端: http://localhost:5173
后端API: http://localhost:3001

## 项目结构

```
daohang02/
├── client/              # 前端应用 (React + Vite)
│   ├── src/
│   │   ├── components/  # UI 组件
│   │   ├── context/     # React Context
│   │   ├── pages/       # 页面
│   │   ├── services/    # API 服务
│   │   └── utils/       # 工具函数
│   └── package.json
├── server/              # 后端应用 (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/ # 控制器
│   │   ├── db/          # 数据库模块
│   │   ├── middleware/  # 中间件
│   │   ├── routes/      # 路由
│   │   └── utils/       # 工具函数
│   ├── Dockerfile       # Docker 配置
│   └── package.json
└── README.md
```

## API 端点

### 认证
- `POST /api/auth/auto-login` - 设备指纹自动登录
- `GET /api/auth/profile` - 获取用户信息

### 收藏
- `GET /api/bookmarks` - 获取所有收藏
- `POST /api/bookmarks` - 创建收藏
- `PUT /api/bookmarks/:id` - 更新收藏
- `DELETE /api/bookmarks/:id` - 删除收藏
- `GET /api/bookmarks/export/all` - 导出所有收藏
- `POST /api/bookmarks/import/upload` - 导入收藏

### 分类
- `GET /api/categories` - 获取所有分类
- `POST /api/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

### 同步
- `GET /api/sync/code` - 获取同步码
- `POST /api/sync/connect` - 连接其他设备

## 部署

详见 [server/DEPLOYMENT.md](server/DEPLOYMENT.md)

## 安全说明

- 生产环境请务必修改 `JWT_SECRET`
- 配置正确的 `CORS_ORIGIN`
- 不要将 `.env` 文件提交到版本控制
