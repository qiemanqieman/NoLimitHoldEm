# 安装说明

## 环境要求

- Windows 11
- WSL Ubuntu 24 LTS
- Node.js 20 及以上
- pnpm 10 及以上

当前项目已在以下环境验证：

```text
Node.js v22.17.0
pnpm 10.33.0
```

## 安装 pnpm

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

## 安装依赖

进入项目目录后执行：

```bash
pnpm install
```

首次安装会同时准备 Husky Git Hook。

## 启动开发服务器

```bash
pnpm dev
```

默认监听：

```text
http://localhost:5173
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm test
pnpm format
```

## 生产构建

```bash
pnpm build
```

构建产物目录：

```text
dist/
```

## Docker 部署

```bash
docker build -t holdem-odds-lab .
docker run --rm -p 8080:80 holdem-odds-lab
```

## 常见问题

### 1. WSL 中浏览器无法访问开发服务器

- 确认使用 `pnpm dev`
- 确认 Vite 已监听 `0.0.0.0`
- 从 Windows 浏览器访问 `http://localhost:5173`

### 2. Husky 未生效

可手动执行：

```bash
pnpm prepare
```

### 3. 依赖安装超时

- 检查 WSL 网络代理配置
- 重试 `pnpm install`
- 必要时切换 npm registry 镜像

### 4. Worker 计算提示性能受限

- 表示浏览器 Worker 初始化异常
- 应用会自动回退到主线程计算
- 可检查浏览器控制台确认具体错误
