# 🚀 Vercel + Render 免费部署指南

## 📋 部署概览

```
┌─────────────────┐          ┌──────────────────┐
│   Vercel        │   HTTP   │   Render          │
│   (前端静态站)   │ ───────> │   (后端 API)       │
│   React + Vite  │          │   Express + Node   │
└─────────────────┘          └──────────────────┘
  yourdomain.vercel.app      yourapp.onrender.com
```

**总成本：** $0/月（完全免费）

---

## 🗂️ 第一部分：准备工作

### 1. 获取 Turso 数据库（免费）

1. **注册 Turso 账号**
   - 访问：https://turso.tech
   - 点击 "Start Free" 注册（支持 GitHub 登录）

2. **创建数据库**
   ```bash
   # 安装 Turso CLI
   # Windows (PowerShell):
   irm get turso | iex
   
   # 或直接在网页控制台创建数据库
   # 访问 https://app.turso.tech
   # 点击 "Create Database"
   # 名称：bookmark-db
   # 区域：选择最近的区域（如 Singapore）
   ```

3. **获取数据库连接信息**
   
   在 Turso 控制台（https://app.turso.tech）：
   - 点击你的数据库 `bookmark-db`
   - 复制 **Database URL**（格式：`libsql://bookmark-db-xxx.turso.io`）
   - 点击 "Create Token" 创建认证令牌
   - 复制生成的 **Auth Token**

4. **保存信息**（稍后需要用到）
   ```
   TURSO_DATABASE_URL=libsql://bookmark-db-xxx.turso.io
   TURSO_AUTH_TOKEN=eyJhbGciOiJFZ...
   ```

---

## 🖥️ 第二部分：部署后端到 Render

### 1. 连接 GitHub 仓库

1. 访问：https://render.com
2. 点击 "Get Started" 或 "Sign Up"
3. 选择 "GitHub" 登录
4. 授权 Render 访问你的仓库 `wy572039475/custom-bookmark-manager`

### 2. 创建 Web Service

1. 在 Render Dashboard，点击 **New** → **Web Service**
2. 选择你的 GitHub 仓库：`custom-bookmark-manager`
3. 配置基本信息：

```
Name: custom-bookmark-backend
Region: Oregon (US West) 或 Singapore
Branch: main
Root Directory: server
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run db:migrate:turso && npm start
Instance Type: Starter (免费)
```

### 3. 配置环境变量

在 "Environment Variables" 部分，添加以下变量：

**必需的环境变量：**

```bash
# 数据库配置（从 Turso 获取）
TURSO_DATABASE_URL=libsql://你的数据库地址.turso.io
TURSO_AUTH_TOKEN=你的Turso认证令牌

# JWT 配置（生成随机密钥）
JWT_SECRET=点击 "Generate" 按钮自动生成
JWT_EXPIRES_IN=7d

# CORS 配置（部署前端后再填入）
CORS_ORIGIN=https://你的前端域名.vercel.app

# 其他配置
NODE_ENV=production
PORT=3001
USE_LOCAL_SQLITE=false
```

**生成 JWT_SECRET：**
```bash
# 在 Render 环境变量页面，点击 "Generate" 按钮
# 或本地生成后粘贴：
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 部署

1. 点击 **Create Web Service**
2. 等待构建完成（约 3-5 分钟）
3. 复制你的后端 URL（格式：`https://custom-bookmark-backend-xxx.onrender.com`）

### 5. 验证后端

访问：`https://你的后端URL/health`

应该看到：
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "environment": "production",
  "database": "turso"
}
```

---

## 🎨 第三部分:部署前端到 Vercel

### 1. 连接 GitHub 仓库

1. 访问：https://vercel.com
2. 点击 "Sign Up" → 选择 "Continue with GitHub"
3. 授权 Vercel 访问仓库 `wy572039475/custom-bookmark-manager`

### 2. 导入项目

1. 在 Vercel Dashboard，点击 **Add New** → **Project**
2. 选择 `custom-bookmark-manager` 仓库
3. 配置项目：

```
Project Name: custom-bookmark-manager
Framework Preset: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 3. 配置环境变量

在 "Environment Variables" 部分，添加：

```bash
VITE_API_URL=https://你的后端URL.onrender.com/api
```

**示例：**
```
VITE_API_URL=https://custom-bookmark-backend-abc123.onrender.com/api
```

### 4. 部署

1. 点击 **Deploy**
2. 緻加环境变量后，部署按钮
2. 等待构建完成（约 1-2 分钟）
3. 复制你的前端 URL（格式：`https://custom-bookmark-manager-xxx.vercel.app`）

### 4. 更新后端 CORS 配置

**重要！** 回到 Render：

1. 进入你的 Web Service `custom-bookmark-backend`
2. 点击 "Environment" 标签
3. 编辑 `CORS_ORIGIN` 变量：
   ```bash
   CORS_ORIGIN=https://你的前端域名.vercel.app
   ```
4. 点击 "Save Changes"
5. Render 会自动重启服务

---

## ✅ 第四部分:测试验证

### 1. 测试后端 API

```bash
# 健康检查
curl https://你的后端URL.onrender.com/health

# 自动登录测试
curl -X POST https://你的后端URL.onrender.com/api/auth/auto-login \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-device-123"}'
```

### 2. 测试前端

1. 访问：`https://你的前端URL.vercel.app`
2. 检查浏览器控制台（F12）是否有错误
3. 测试基本功能：
   - 自动登录
   - 添加书签
   - 搜索书签

### 3. 检查网络请求

在浏览器开发者工具（F12）→ Network 标签：
- 应该看到对 `https://你的后端URL/api/*` 的请求
- 状态码应该是 200

---

## 🔄 第五部分:自动部署配置

现在每次推送到 GitHub，Vercel 和 Render 会自动部署：

### 自动部署流程

```bash
# 1. 修改代码
git add .
git commit -m "Update feature"
git push origin main

# 2. 自动触发
# - Vercel: 自动构建前端
# - Render: 自动构建后端
```

### 强制重新部署

**Render:**
- Dashboard → 你的服务 → "Manual Deploy" → "Deploy latest commit"

**Vercel:**
- Dashboard → 你的项目 → "Deployments" → 点击最新部署 → "Redeploy"

---

## 🆘 常见问题排查

,添加 Bookmarks"
}
```

### 2. **后端部署失败 - 数据库迁移错误**
```bash
# 手动运行迁移
# 在 Render Shell 中执行：
npm run db:migrate:turso
```

### 3. **后端无法启动**
```bash
# 检查日志
# Render Dashboard → 你的服务 → "Logs" 标签

# 常见原因：
# - 环境变量未配置
# - 数据库连接失败
# - 端口配置错误
```

### 4. **前端空白页**
```bash
# 检查浏览器控制台错误
# 常见原因：
# - VITE_API_URL 未配置或错误
# - API 请求被 CORS 阻止
```

---

## 📊 资源使用监控

### Render (后端)
- Dashboard → 你的服务 → "Metrics"
- 免费额度：750 小时/月
- 查看是否超出额度

### Vercel (前端)
- Dashboard → 你的项目 → "Analytics"
- 免费额度：100GB 带宽/月
- 查看流量使用情况

### Turso (数据库)
- Dashboard → 你的数据库
- 免费额度：9GB 存储 + 10亿行读取/月
- 查看存储和请求量

---

## 🎉 部署成功检查清单

- [ ] Turso 数据库已创建并获取连接信息
- [ ] Render 后端服务已部署
- [ ] Render 环境变量已配置（特别是 TURSO_* 和 JWT_SECRET）
- [ ] 后端健康检查通过 (`/health` 返回正常)
- [ ] Vercel 前端项目已部署
- [ ] Vercel 环境变量已配置（VITE_API_URL）
- [ ] 前端页面可以访问
- [ ] CORS_ORIGIN 已更新为前端 URL
- [ ] 前端可以正常调用后端 API
- [ ] 自动登录功能正常
- [ ] 书签增删改查功能正常

---

## 📞 获取帮助

如果遇到问题：
1. 查看 Render 和 Vercel 的部署日志
2. 检查浏览器控制台错误
3. 验证环境变量是否正确配置
4. 确认数据库连接正常

**部署愉快！** 🚀
