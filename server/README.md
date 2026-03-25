# 自定义书签管理系统 - 后端API

基于 Node.js + Express + PostgreSQL 的书签管理系统后端。

## 技术栈

- Node.js + Express
- TypeScript
- PostgreSQL
- JWT 认证
- bcryptjs 密码加密

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookmark_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

### 3. 创建数据库

使用 PostgreSQL 客户端创建数据库：

```sql
CREATE DATABASE bookmark_db;
```

### 4. 运行数据库迁移

```bash
npm run db:migrate
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动。

## API 文档

### 认证相关

#### 注册用户
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456"
}
```

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456"
}
```

#### 获取用户信息
```
GET /api/auth/profile
Authorization: Bearer <token>
```

### 分类相关

#### 获取所有分类
```
GET /api/categories
Authorization: Bearer <token>
```

#### 创建分类
```
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "工作",
  "color": "#3b82f6",
  "icon": "folder"
}
```

#### 更新分类
```
PUT /api/categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新名称",
  "color": "#10b981"
}
```

#### 删除分类
```
DELETE /api/categories/:id
Authorization: Bearer <token>
```

### 收藏相关

#### 获取所有收藏
```
GET /api/bookmarks?categoryId=xxx&search=xxx
Authorization: Bearer <token>
```

#### 获取单个收藏
```
GET /api/bookmarks/:id
Authorization: Bearer <token>
```

#### 创建收藏
```
POST /api/bookmarks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Google",
  "url": "https://www.google.com",
  "description": "搜索引擎",
  "categoryId": "1",
  "tags": ["搜索", "工具"]
}
```

#### 更新收藏
```
PUT /api/bookmarks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新标题",
  "tags": ["标签1", "标签2"]
}
```

#### 删除收藏
```
DELETE /api/bookmarks/:id
Authorization: Bearer <token>
```

#### 增加访问次数
```
POST /api/bookmarks/:id/visit
Authorization: Bearer <token>
```

#### 搜索收藏
```
GET /api/bookmarks/search?q=xxx
Authorization: Bearer <token>
```

#### 导出收藏
```
GET /api/bookmarks/export
Authorization: Bearer <token>
```

#### 导入收藏
```
POST /api/bookmarks/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <JSON file>
```

## 数据库表结构

### users (用户表)
- id: SERIAL PRIMARY KEY
- username: VARCHAR(50) UNIQUE NOT NULL
- email: VARCHAR(100) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()

### categories (分类表)
- id: SERIAL PRIMARY KEY
- user_id: INTEGER REFERENCES users(id)
- name: VARCHAR(50) NOT NULL
- color: VARCHAR(7)
- icon: VARCHAR(50)
- sort_order: INTEGER DEFAULT 0
- created_at: TIMESTAMP DEFAULT NOW()

### bookmarks (收藏表)
- id: SERIAL PRIMARY KEY
- user_id: INTEGER REFERENCES users(id)
- category_id: INTEGER REFERENCES categories(id)
- title: VARCHAR(255) NOT NULL
- url: TEXT NOT NULL
- description: TEXT
- icon: TEXT
- tags: TEXT[]
- sort_order: INTEGER DEFAULT 0
- visit_count: INTEGER DEFAULT 0
- last_visited: TIMESTAMP
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
