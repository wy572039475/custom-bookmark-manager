# 🚀 Render 部署指南（已配置好数据库）

## ✅ 已完成的配置

### Turso 数据库配置

✅ **数据库 URL**: `libsql://bookmark-db-wy572039475.aws-ap-northeast-1.turso.io`
✅ **Auth Token**: 已配置
✅ **数据库状态**: 已创建所有表
  - users
  - devices
  - device_fingerprints
  - categories
  - bookmarks

### 生产环境配置

✅ **JWT 密钥**: 已生成安全密钥
✅ **CORS**: 已配置（部署后需更新）
✅ **环境变量**: 已配置

---

## 📋 部署步骤（3 步）

### 第 1 步：推送代码到 GitHub

```bash
cd "c:\Users\wuyan-v\Desktop\项目\自定义书签管理系统"

# 1. 初始化 Git（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "Ready for Render deployment"

# 4. 在 GitHub 创建新仓库：custom-bookmark-system

# 5. 添加远程仓库（替换为你的用户名）
git remote add origin https://github.com/你的用户名/custom-bookmark-system.git

# 6. 推送代码
git push -u origin main
```

### 第 2 步：部署后端到 Render

1. 访问 https://dashboard.render.com
2. 点击 **New +** → **Web Service**
3. 连接 GitHub 仓库 `custom-bookmark-system`
4. 配置后端服务：

   **基本信息**
   - **Name**: `custom-bookmark-backend`
   - **Region**: `Singapore`（推荐）
   - **Branch**: `main`

   **构建与运行**
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `sh scripts/migrate-and-start.sh`

   **环境变量**（重要！）
   
   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `NODE_ENV` | `production` | 生产环境 |
   | `PORT` | `3001` | 服务端口 |
   | `TURSO_DATABASE_URL` | `libsql://bookmark-db-wy572039475.aws-ap-northeast-1.turso.io` | 你的数据库 URL |
   | `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0MzIwNTUsImlkIjoiMDE5ZDI0NjQtMzQwMS03ZTc2LTlhYzMtZmExZjZmMGFmMGIyIiwicmlkIjoiMGQ1MmJjZDgtOGE5Ny00OTIwLWIzZjgtOTIxYWRlYTYyNTcwIn0.HaW1n7ahpwM4C5xIX-NRnG2wFGaJA_bC9LJGZLQibulY-Gt7gQKRxaTs3pu9tYBmhH3VZsP1x_oYxM8yvdvUBQ` | 你的 Token |
   | `JWT_SECRET` | `8104b1ff135be9acb9b1866e58df2c0ca2a10163fa0e0e5c18d1649b802689c4` | JWT 密钥 |
   | `JWT_EXPIRES_IN` | `7d` | Token 有效期 |
   | `CORS_ORIGIN` | `https://custom-bookmark-frontend.onrender.com` | 前端 URL（先填这个） |
   | `USE_LOCAL_SQLITE` | `false` | 使用 Turso 云数据库 |

   **实例**
   - **Instance Type**: `Standard`（免费版）
   - **Instances**: `1`

5. 点击 **Create Web Service**
6. 等待部署完成（约 3-5 分钟）

### 第 3 步：部署前端到 Render

1. 在 Render Dashboard 点击 **New +** → **Static Site**
2. 选择相同的 GitHub 仓库
3. 配置前端服务：

   **基本信息**
   - **Name**: `custom-bookmark-frontend`
   - **Region**: `Singapore`（与后端相同）
   - **Branch**: `main`

   **构建配置**
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

   **环境变量**
   
   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `VITE_API_URL` | `https://custom-bookmark-backend.onrender.com/api` | 后端 API 地址（先填这个） |

4. 点击 **Create Static Site**
5. 等待部署完成（约 2-3 分钟）

---

## 🔧 部署后配置

### 1. 更新 CORS 配置

等前后端都部署完成后：

1. 进入后端服务页面
2. 复制后端 URL（如 `https://custom-bookmark-backend.onrender.com`）
3. 进入前端服务页面
4. 复制前端 URL（如 `https://custom-bookmark-frontend.onrender.com`）
5. 回到后端服务 → **Settings** → **Environment**
6. 修改 `CORS_ORIGIN` 为实际的前端 URL
7. 点击 **Apply Changes**
8. 等待后端重新部署

### 2. 更新前端 API URL

1. 进入前端服务页面
2. **Settings** → **Environment**
3. 修改 `VITE_API_URL` 为实际的后端 API 地址
   - 格式：`https://你的后端URL.onrender.com/api`
4. 点击 **Apply Changes**
5. 等待前端重新部署

---

## 🧪 测试部署

### 1. 访问前端

打开浏览器访问你的前端 URL（如 `https://custom-bookmark-frontend.onrender.com`）

### 2. 测试功能

- ✅ 页面正常加载
- ✅ 设备指纹自动登录
- ✅ 创建第一个分类
- ✅ 添加书签
- ✅ 搜索功能
- ✅ 切换主题

### 3. 检查后端日志

进入后端服务页面 → **Logs** 标签，查看是否有错误。

### 4. 测试健康检查

访问：`https://你的后端URL.onrender.com/health`

预期返回：
```json
{"status":"ok","timestamp":"2024-..."}
```

---

## 💰 免费额度说明

### Render 免费套餐

| 资源 | 免费额度 |
|------|---------|
| CPU | 0.1 vCPU |
| 内存 | 512 MB |
| 每月免费时长 | 750 小时 |
| 带宽 | 100 GB/月 |
| 冷启动时间 | 30-50 秒 |
| 休眠时间 | 无访问 15 分钟后 |

### Turso 免费套餐

| 资源 | 免费额度 |
|------|---------|
| 存储 | 8 GB |
| 读取 | 1,000 亿行/月 |
| 写入 | 2,500 万行/月 |
| 数据库 | 无限 |

**总计费用：$0/月** ✅

---

## ⚠️ 重要提示

### 冷启动问题

免费套餐的服务会在无访问 15 分钟后自动休眠，下次访问时需要 30-50 秒启动。

**解决方案**（可选）：
- 使用 Cron-job 定期 ping 服务
- 升级到付费套餐（$7/月起，不休眠）

### 数据库连接

如果后端日志显示数据库连接失败：
1. 检查 `TURSO_DATABASE_URL` 和 `TURSO_AUTH_TOKEN` 是否正确
2. 确认 Turso 数据库状态
3. 查看 Render 日志详细信息

### CORS 错误

如果前端无法访问后端：
1. 确认后端的 `CORS_ORIGIN` 设置正确
2. 检查前端的 `VITE_API_URL` 是否正确
3. 等待后端重新部署完成

---

## 📞 获取帮助

### Render 文档
- [部署指南](https://render.com/docs/deploy-node-express-app)
- [环境变量](https://render.com/docs/environment-variables)
- [日志查看](https://render.com/docs/logs)

### Turso 文档
- [快速开始](https://docs.turso.tech/quickstart)
- [数据库管理](https://docs.turso.tech/manage)

### 本地测试脚本

```bash
# 测试 Turso 数据库连接
cd server
npx tsx test-turso-production.ts

# 运行数据库迁移
npm run db:migrate:turso
```

---

## ✅ 完成清单

- [x] Turso 数据库已配置
- [x] 数据库表已创建
- [x] JWT 密钥已生成
- [ ] 代码已推送到 GitHub
- [ ] 后端已部署到 Render
- [ ] 前端已部署到 Render
- [ ] CORS 已配置
- [ ] 前端 API URL 已配置
- [ ] 功能测试通过

---

## 🎉 部署完成后

恭喜！你的书签管理系统现在运行在云端了！

### 访问地址

- **前端**: `https://custom-bookmark-frontend.onrender.com`
- **后端**: `https://custom-bookmark-backend.onrender.com/api`

### 下一步

- 绑定自定义域名（可选）
- 设置定期备份
- 配置监控系统
- 分享给朋友使用

---

**准备就绪，开始部署吧！** 🚀
