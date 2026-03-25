# 🚀 快速部署到 Render.com

## 📝 部署前检查清单

- [ ] 已有 GitHub 账号
- [ ] 已有或准备注册 Render 账号
- [ ] 已有或准备注册 Turso 账号

---

## 🎯 三步快速部署

### 第 1 步：准备数据库（5 分钟）

1. 访问 https://turso.tech 并注册账号
2. 点击"Create Database"，创建名为 `bookmark-db` 的数据库
3. 复制以下信息（稍后使用）：
   - **Database URL**: `libsql://bookmark-db-xxx.turso.io`
   - **Auth Token**: 点击"Create Token"获取

### 第 2 步：推送代码到 GitHub（5 分钟）

1. 在 GitHub 创建新仓库 `custom-bookmark-system`
2. 在项目目录执行：

```bash
# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Deploy to Render"

# 添加远程仓库（替换为你的地址）
git remote add origin https://github.com/你的用户名/custom-bookmark-system.git

# 推送
git push -u origin main
```

### 第 3 步：在 Render 创建服务（10 分钟）

#### 3.1 部署后端

1. 登录 https://dashboard.render.com
2. 点击 **New +** → **Web Service**
3. 连接 GitHub 仓库
4. 配置：
   - Name: `custom-bookmark-backend`
   - Root Directory: `server`
   - Build Command: `npm run build`
   - Start Command: `sh scripts/migrate-and-start.sh`
5. 点击 **Advanced** → **Add Environment Variable**：
   - `TURSO_DATABASE_URL` = 复制的数据库 URL
   - `TURSO_AUTH_TOKEN` = 复制的 Auth Token
   - `CORS_ORIGIN` = `https://custom-bookmark-frontend.onrender.com`（稍后更新）
6. 点击 **Create Web Service**

#### 3.2 部署前端

1. 再次点击 **New +** → **Static Site**
2. 选择相同仓库
3. 配置：
   - Name: `custom-bookmark-frontend`
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. 点击 **Advanced** → **Add Environment Variable**：
   - `VITE_API_URL` = `https://custom-bookmark-backend.onrender.com/api`
5. 点击 **Create Static Site**

---

## 🔧 部署后配置

### 更新 CORS 设置

1. 等待后端部署完成（约 3-5 分钟）
2. 复制前端 URL（如 `https://custom-bookmark-frontend.onrender.com`）
3. 进入后端服务 → **Settings** → **Environment**
4. 修改 `CORS_ORIGIN` 为前端 URL
5. 点击 **Apply Changes**

### 测试部署

1. 打开前端 URL
2. 测试添加书签功能
3. 访问 `https://your-backend.onrender.com/health` 检查后端状态

---

## 💰 费用说明

### 完全免费！

| 服务 | 费用 |
|------|------|
| Render 后端 | 免费 |
| Render 前端 | 免费 |
| Turso 数据库 | 免费（8GB 存储） |

**总计**：**$0/月** ✅

### 免费套餐限制

- 服务无访问 15 分钟后自动休眠
- 下次访问有 30-50 秒冷启动时间
- 每月 100 GB 带流量
- 每月 1,000 亿次数据库读取

---

## 📞 需要帮助？

- 详细部署指南：查看 `RENDER-DEPLOYMENT.md`
- Render 文档：https://render.com/docs
- Turso 文档：https://docs.turso.tech

---

## ✅ 部署完成后

你的应用将可以通过以下地址访问：

- **前端**：`https://custom-bookmark-frontend.onrender.com`
- **后端**：`https://custom-bookmark-backend.onrender.com/api`

开始使用你的云端书签管理系统吧！🎉
