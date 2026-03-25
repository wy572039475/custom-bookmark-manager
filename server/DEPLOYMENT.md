# 后端部署指南

本文档介绍如何将 Bookmark Server 部署到生产环境。

## 目录

- [前置要求](#前置要求)
- [快速部署](#快速部署)
- [详细配置](#详细配置)
- [SSL/HTTPS 配置](#sslhttps-配置)
- [常见问题](#常见问题)

---

## 前置要求

- Docker 和 Docker Compose
- 一个域名（推荐）
- Turso 数据库账号（免费）

---

## 快速部署

### 1. 准备环境变量

```bash
# 复制生产环境配置模板
cp .env.production.example .env

# 编辑配置文件，填写真实的值
nano .env
```

**必须修改的配置项：**

| 配置项 | 说明 |
|--------|------|
| `TURSO_DATABASE_URL` | Turso 数据库连接地址 |
| `TURSO_AUTH_TOKEN` | Turso 认证令牌 |
| `JWT_SECRET` | JWT 密钥（至少 64 位随机字符） |
| `CORS_ORIGIN` | 前端域名（如 `https://yourdomain.com`） |

生成 JWT 密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 构建并启动

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 3. 验证部署

```bash
# 健康检查
curl http://localhost:3001/health

# 预期输出
{"status":"ok","timestamp":"2024-..."}
```

---

## 详细配置

### Docker Compose 配置

`docker-compose.yml` 已配置好，支持以下功能：

- 自动重启（`restart: unless-stopped`）
- 健康检查
- 日志轮转（最大 10MB，保留 3 个文件）
- 环境变量注入

### 环境变量说明

```bash
# 服务器配置
PORT=3001                    # 服务端口
NODE_ENV=production          # 环境模式

# 数据库配置
TURSO_DATABASE_URL=          # Turso 数据库 URL
TURSO_AUTH_TOKEN=            # Turso 认证令牌

# JWT 配置
JWT_SECRET=                  # JWT 签名密钥
JWT_EXPIRES_IN=7d           # Token 有效期

# CORS 配置
CORS_ORIGIN=                 # 允许的前端域名

# 迁移配置（可选）
RUN_MIGRATION=true          # 启动时运行数据库迁移
```

---

## SSL/HTTPS 配置

### 方式一：使用 Nginx + Certbot（推荐）

1. **安装 Nginx 和 Certbot**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install nginx certbot python3-certbot-nginx
```

2. **配置 Nginx**

```bash
# 复制配置文件
sudo cp deploy/nginx.conf /etc/nginx/sites-available/bookmark-server

# 修改域名
sudo nano /etc/nginx/sites-available/bookmark-server
# 将 yourdomain.com 替换为你的实际域名

# 启用配置
sudo ln -s /etc/nginx/sites-available/bookmark-server /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

3. **获取 SSL 证书**

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

4. **设置自动续期**

```bash
sudo certbot renew --dry-run
```

### 方式二：使用 Caddy（自动 HTTPS）

```bash
# 安装 Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

创建 Caddyfile：

```
yourdomain.com {
    reverse_proxy localhost:3001
}
```

---

## 常见问题

### Q: 端口被占用怎么办？

```bash
# 查看端口占用
lsof -i :3001

# 修改 docker-compose.yml 中的端口映射
ports:
  - "3002:3001"  # 使用其他端口
```

### Q: 数据库连接失败？

1. 检查 `TURSO_DATABASE_URL` 格式是否正确
2. 检查 `TURSO_AUTH_TOKEN` 是否有效
3. 运行测试脚本：`npm run test:turso`

### Q: CORS 错误？

确保 `CORS_ORIGIN` 配置正确：

```bash
# 单个域名
CORS_ORIGIN=https://yourdomain.com

# 多个域名
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Q: 如何查看日志？

```bash
# Docker 日志
docker-compose logs -f

# 或者
docker logs -f bookmark-server
```

### Q: 如何更新部署？

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 安全建议

1. **不要将 `.env` 文件提交到 Git**
2. **定期更换 JWT_SECRET**
3. **使用强密码和长密钥**
4. **配置防火墙，只开放必要端口**
5. **定期更新依赖包**

---

## 文件结构

```
server/
├── .env                    # 本地环境变量（不提交）
├── .env.example            # 开发环境模板
├── .env.production.example # 生产环境模板
├── .dockerignore           # Docker 忽略文件
├── Dockerfile              # Docker 构建文件
├── docker-compose.yml      # Docker Compose 配置
├── scripts/
│   └── start.sh            # 启动脚本
└── deploy/
    └── nginx.conf          # Nginx 配置
```
