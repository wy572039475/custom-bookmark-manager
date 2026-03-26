# Railway + Turso 免费部署指南

## 架构方案

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Railway       │     │   Railway       │     │    Turso        │
│   (后端 Node.js)│────▶│   (前端静态站)   │     │  (SQLite 云端)  │
│   $0/月         │     │   $0/月         │     │   $0/月         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 费用说明

| 服务 | 套餐 | 费用 | 包含资源 |
|------|------|------|----------|
| Railway 后端 | Trial | $0/月 | 512MB RAM, 共享 CPU |
| Railway 前端 | Trial | $0/月 | 静态站点托管 |
| Turso | Free | $0/月 | 9GB 存储, 10亿行读取/月 |

**总计: $0/月** ✅

---

## 步骤 1: 推送代码到 GitHub

首先需要将代码推送到 GitHub，Railway 会从 GitHub 拉取代码。

### 如果还没有推送，执行：

```bash
cd "c:\Users\wuyan-v\Desktop\项目\自定义书签管理系统"
git add .
git commit -m "Add Railway deployment support"
git push origin main
```

### 如果网络有问题，可以：
1. 使用 GitHub Desktop 推送
2. 配置代理后推送
3. 直接在 GitHub 网页上传文件

---

## 步骤 2: 注册 Railway 账号

1. 访问 https://railway.app
2. 点击 **Start Your Project**
3. 使用 GitHub 账号登录（推荐）

---

## 步骤 3: 部署后端服务

### 3.1 创建新项目

1. 登录 Railway Dashboard
2. 点击 **+ New Project**
3. 选择 **Deploy from GitHub repo**
4. 授权 Railway 访问你的 GitHub
5. 选择 `custom-bookmark-manager` 仓库

### 3.2 配置后端服务

1. 在项目中选择 **Add Service** → **GitHub Repository**
2. 选择 `custom-bookmark-manager` 仓库
3. **Root Directory** 设置为 `server`
4. 点击 **Deploy**

### 3.3 设置环境变量

进入服务 → **Variables** 标签，添加以下变量：

```
NODE_ENV=production
PORT=3001
TURSO_DATABASE_URL=libsql://bookmark-db-wy572039475.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0MzIwNTUsImlkIjoiMDE5ZDI0NjQtMzQwMS03ZTc2LTlhYzMtZmExZjZmMGFmMGIyIiwicmlkIjoiMGQ1MmJjZDgtOGE5Ny00OTIwLWIzZjgtOTIxYWRlYTYyNTcwIn0.HaW1n7ahpwM4C5xIX-NRnG2wFGaJA_bC9LJGZLQibulY-Gt7gQKRxaTs3pu9tYBmhH3VZsP1x_oYxM8yvdvUBQ
JWT_SECRET=8104b1ff135be9acb9b1866e58df2c0ca2a10163fa0e0e5c18d1649b802689c4
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://custom-bookmark-client.up.railway.app
USE_LOCAL_SQLITE=false
```

> 注意：`CORS_ORIGIN` 的域名需要等前端部署后更新

### 3.4 配置域名

1. 进入服务 → **Settings** 标签
2. 找到 **Domains** 部分
3. 点击 **Generate Domain**
4. 你会得到类似 `custom-bookmark-server.up.railway.app` 的域名

### 3.5 验证后端

访问 `https://你的后端域名.up.railway.app/api/health`

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "environment": "production",
  "database": "turso"
}
```

---

## 步骤 4: 部署前端服务

### 4.1 添加前端服务

1. 在同一个 Railway 项目中
2. 点击 **+ Add Service** → **GitHub Repository**
3. 选择同一个仓库
4. **Root Directory** 设置为 `client`
5. 点击 **Deploy**

### 4.2 配置前端构建

进入服务 → **Settings**，确认：

- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4.3 设置环境变量

```
VITE_API_URL=https://你的后端域名.up.railway.app/api
```

### 4.4 配置域名

1. 进入服务 → **Settings** 标签
2. 找到 **Domains** 部分
3. 点击 **Generate Domain**
4. 你会得到类似 `custom-bookmark-client.up.railway.app` 的域名

### 4.5 配置静态站点

在 **Settings** 中：
- 找到 **Networking** 或 **Serving**
- 确认启用了静态文件服务
- 设置 **Index Document** 为 `index.html`

---

## 步骤 5: 更新 CORS 配置

### 5.1 获取前端域名

从前端服务的 Domains 设置中复制域名，例如：
`https://custom-bookmark-client.up.railway.app`

### 5.2 更新后端 CORS

1. 进入后端服务 → **Variables**
2. 更新 `CORS_ORIGIN` 为前端域名
3. Railway 会自动重新部署

---

## 步骤 6: 测试部署

### 6.1 访问应用

打开前端 URL：`https://你的前端域名.up.railway.app`

### 6.2 测试功能

1. 创建新设备/用户
2. 添加书签
3. 创建分类
4. 测试同步功能

### 6.3 检查日志

- 后端日志：后端服务 → **Deployments** → 点击部署 → **Logs**
- 前端日志：前端服务 → **Deployments** → 点击部署 → **Logs**

---

## 环境变量汇总

### 后端 (server)

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `3001` | 服务端口 |
| `TURSO_DATABASE_URL` | `libsql://bookmark-db-xxx.turso.io` | Turso 数据库 URL |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJ...` | Turso 认证 Token |
| `JWT_SECRET` | `8104b1ff...` | JWT 密钥 |
| `JWT_EXPIRES_IN` | `7d` | Token 有效期 |
| `CORS_ORIGIN` | `https://你的前端域名.up.railway.app` | 允许的前端域名 |
| `USE_LOCAL_SQLITE` | `false` | 使用 Turso |

### 前端 (client)

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_URL` | `https://你的后端域名.up.railway.app/api` | API 地址 |

---

## 常见问题

### 1. 部署失败 - Build Error

检查构建日志，常见原因：
- 依赖安装失败
- TypeScript 编译错误
- 环境变量未设置

### 2. 数据库连接失败

确认：
- `TURSO_DATABASE_URL` 正确
- `TURSO_AUTH_TOKEN` 有效（可在 Turso 控制台重新生成）

### 3. CORS 错误

确认：
- 后端 `CORS_ORIGIN` 设置正确
- 前端 `VITE_API_URL` 正确
- URL 末尾不要有 `/`

### 4. 前端 404 错误

确认：
- 构建成功
- Output Directory 设置为 `dist`
- SPA 路由配置正确（可能需要添加 `_redirects` 文件）

---

## 项目文件清单

### 已创建的部署文件

- `server/Dockerfile` - Docker 构建配置
- `server/railway.toml` - Railway 配置

### Turso 数据库信息

- **数据库 URL**: `libsql://bookmark-db-wy572039475.aws-ap-northeast-1.turso.io`
- **区域**: AWS ap-northeast-1 (东京)
- **已创建的表**: users, devices, device_fingerprints, categories, bookmarks

---

## 下一步

1. ✅ 推送代码到 GitHub
2. ✅ 在 Railway 创建后端服务
3. ✅ 配置后端环境变量
4. ✅ 在 Railway 创建前端服务
5. ✅ 配置前端环境变量
6. ✅ 更新 CORS 配置
7. ✅ 测试功能

**祝你部署顺利！** 🚀
