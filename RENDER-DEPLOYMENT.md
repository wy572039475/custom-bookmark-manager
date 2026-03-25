# 🚀 Render.com 免费部署指南

本指南将帮助你将自定义书签管理系统免费部署到 Render.com 平台。

---

## 📋 目录

- [前置准备](#前置准备)
- [步骤一：注册 Turso 数据库](#步骤一注册-turso-数据库)
- [步骤二：注册 Render 账号](#步骤二注册-render-账号)
- [步骤三：部署后端服务](#步骤三部署后端服务)
- [步骤四：部署前端服务](#步骤四部署前端服务)
- [步骤五：配置环境变量](#步骤五配置环境变量)
- [步骤六：测试部署](#步骤六测试部署)
- [常见问题](#常见问题)

---

## 前置准备

1. **GitHub 账号**：需要将代码推送到 GitHub
2. **邮箱**：注册 Render 和 Turso 使用
3. **支付卡**（可选）：Render 免费版不需要，但为了后续升级可以准备

---

## 步骤一：注册 Turso 数据库

Turso 是一个免费的 SQLite 云数据库，提供 8GB 存储空间。

### 1. 注册账号

访问 [https://turso.tech](https://turso.tech) 并注册账号。

### 2. 安装 Turso CLI

```bash
# 安装 Turso CLI
npm install -g turso

# 或使用包管理器
brew install tursodatabase/tap/turso  # macOS
```

### 3. 登录

```bash
turso auth signup
# 或者
turso auth login
```

### 4. 创建数据库

```bash
# 创建数据库
turso db create bookmark-db

# 查看数据库信息
turso db show bookmark-db
```

### 5. 创建认证令牌

```bash
# 创建 Auth Token
turso auth token create bookmark-db --never-expire
```

**重要提示**：保存以下信息，部署时会用到：
- `TURSO_DATABASE_URL`：类似 `libsql://bookmark-db-xxx.turso.io`
- `TURSO_AUTH_TOKEN`：一串长字符串

---

## 步骤二：注册 Render 账号

### 1. 注册

访问 [https://render.com](https://render.com) 并使用 GitHub 账号注册。

### 2. 创建团队（可选）

如果是个人项目，可以跳过此步骤。

---

## 步骤三：部署后端服务

### 1. 推送代码到 GitHub

```bash
# 初始化 Git（如果还没有）
cd "c:\Users\wuyan-v\Desktop\项目\自定义书签管理系统"
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit for Render deployment"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/custom-bookmark-system.git

# 推送
git push -u origin main
```

### 2. 在 Render 创建后端服务

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 点击 **New +** → **Web Service**
3. 连接 GitHub 仓库
4. 选择 `custom-bookmark-system` 仓库
5. 配置服务：

   **基本信息**
   - **Name**: `custom-bookmark-backend`
   - **Region**: 选择离你最近的区域（推荐 Singapore）
   - **Branch**: `main`

   **构建配置**
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `sh scripts/migrate-and-start.sh`

   **环境变量**（步骤五中详细配置）

   **实例**
   - **Instance Type**: `Standard`（免费版）
   - **Instances**: `1`

6. 点击 **Create Web Service**

3. 等待部署完成（约 3-5 分钟）

---

## 步骤四：部署前端服务

### 1. 创建静态站点服务

1. 在 Render Dashboard 点击 **New +** → **Static Site**
2. 连接相同的 GitHub 仓库
3. 配置服务：

   **基本信息**
   - **Name**: `custom-bookmark-frontend`
   - **Region**: 选择与后端相同的区域
   - **Branch**: `main`

   **构建配置**
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

   **环境变量**
   - `VITE_API_URL`: 先留空，部署后端后再配置

4. 点击 **Create Static Site**

5. 等待部署完成

---

## 步骤五：配置环境变量

### 后端环境变量

进入后端服务页面 → **Settings** → **Environment**

添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `3001` | 服务端口 |
| `TURSO_DATABASE_URL` | `libsql://your-db.turso.io` | Turso 数据库 URL（从步骤一获取） |
| `TURSO_AUTH_TOKEN` | `your-token` | Turso 认证令牌（从步骤一获取） |
| `JWT_SECRET` | 随机生成 | JWT 密钥（点击"Generate"按钮） |
| `JWT_EXPIRES_IN` | `7d` | Token 有效期 |
| `CORS_ORIGIN` | `https://your-frontend.onrender.com` | 前端 URL（步骤六获取） |
| `USE_LOCAL_SQLITE` | `false` | 不使用本地 SQLite |

**重要**：配置完成后，点击 **Apply Changes** 并等待后端服务重新部署。

### 前端环境变量

进入前端服务页面 → **Settings** → **Environment**

添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` | 后端 API 地址（从 Render 获取） |

**获取后端 URL**：
1. 进入后端服务页面
2. 复制顶部的 URL（类似 `https://custom-bookmark-backend.onrender.com`）
3. 添加 `/api` 后缀

**示例**：`https://custom-bookmark-backend.onrender.com/api`

---

## 步骤六：测试部署

### 1. 访问前端

打开前端 URL（类似 `https://custom-bookmark-frontend.onrender.com`）

### 2. 测试功能

- ✅ 页面正常加载
- ✅ 设备指纹自动登录
- ✅ 创建分类
- ✅ 添加书签
- ✅ 搜索功能
- ✅ 主题切换

### 3. 检查后端日志

进入后端服务页面 → **Logs**，查看是否有错误信息。

### 4. 测试健康检查

访问：`https://your-backend.onrender.com/health`

预期返回：
```json
{"status":"ok","timestamp":"2024-..."}
```

---

## 📊 Render 免费额度

### 免费套餐限制

| 资源 | 免费额度 |
|------|---------|
| 实例类型 | Standard |
| CPU | 0.1 vCPU |
| 内存 | 512 MB |
| 存储 | 500 MB（临时） |
| 带宽 | 100 GB/月 |
| 免费服务数量 | 无限 |
| 冷启动时间 | 约 30-50 秒 |

### Turso 免费额度

| 资源 | 免费额度 |
|------|---------|
| 存储 | 8 GB |
| 读取行数 | 1,000 亿行/月 |
| 写入行数 | 2,500 万行/月 |
| 数据库数量 | 无限 |

**注意**：免费套餐会自动休眠（无访问 15 分钟后），首次请求会有 30-50 秒的冷启动时间。

---

## 🔧 常见问题

### Q1: 部署后前端无法连接后端？

**解决方案**：
1. 检查前端的 `VITE_API_URL` 是否正确
2. 确保后端的 `CORS_ORIGIN` 包含前端 URL
3. 查看 Render 日志确认错误信息

### Q2: 数据库连接失败？

**解决方案**：
1. 验证 Turso Token 是否有效
2. 检查 `TURSO_DATABASE_URL` 格式是否正确
3. 确认后端服务已完成数据库迁移

### Q3: 服务频繁休眠/冷启动慢？

**原因**：免费套餐会自动休眠

**解决方案**：
1. 使用 Cron-job 定期 ping 服务（如每 14 分钟访问一次健康检查）
2. 升级到付费套餐（$7/月起）

### Q4: 构建失败？

**常见原因**：
1. Node 版本不匹配 → 添加 `.nvmrc` 文件指定版本
2. 依赖安装失败 → 检查 `package.json` 中的依赖
3. 构建命令错误 → 确认 `buildCommand` 和 `startCommand`

**查看日志**：进入服务页面 → **Events** 标签

### Q5: 如何更新代码？

1. 修改本地代码
2. 提交并推送到 GitHub
3. Render 自动检测到推送并重新部署

### Q6: 如何查看日志？

- **实时日志**：服务页面 → **Logs** 标签
- **部署历史**：服务页面 → **Events** 标签
- **环境变量**：服务页面 → **Settings** → **Environment**

### Q7: 如何绑定自定义域名？

1. 在域名提供商（如 Cloudflare、阿里云）添加 CNAME 记录
2. Render 服务页面 → **Settings** → **Custom Domains**
3. 添加域名并验证

---

## 🎉 完成！

恭喜你成功部署了自定义书签管理系统！

### 下一步

- [ ] 配置自定义域名（可选）
- [ ] 设置定期备份（可选）
- [ ] 监控服务状态
- [ ] 根据需求升级套餐（可选）

### 技术支持

- [Render 文档](https://render.com/docs)
- [Turso 文档](https://docs.turso.tech)
- [项目 GitHub Issues](https://github.com/your-repo/issues)

---

**最后更新**：2026-03-25
