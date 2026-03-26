# Railway 部署用 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 tsx 用于迁移）
RUN npm ci

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 清理开发依赖（可选，减小镜像大小）
RUN npm prune --production

# 重新安装 tsx（迁移需要）
RUN npm install tsx @libsql/client

# 暴露端口 (Railway 自动设置 PORT 环境变量)
EXPOSE 3001

# 启动命令：先迁移数据库，再启动服务
CMD ["sh", "-c", "npx tsx src/db/migrate-sqlite.ts && node dist/index.js"]
