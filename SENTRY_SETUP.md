# Sentry 错误追踪设置指南

## 简介

Sentry 已集成到项目中，用于生产环境的错误监控和性能追踪。

**重要提示**: Sentry **仅在生产环境启用**，开发环境会自动禁用，不会产生任何开销。

## 快速开始

### 1. 创建 Sentry 项目

1. 访问 [sentry.io](https://sentry.io/) 并注册账号
2. 创建新项目，选择 **Next.js** 作为平台
3. 记录以下信息：
   - **DSN**: 形如 `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
   - **Organization**: 你的组织名称
   - **Project**: 你的项目名称

### 2. 配置环境变量

在 `.env` 或 `.env.local` 文件中添加（已在 `.env.example` 中有示例）：

```bash
# Sentry DSN（必需）
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"

# 组织和项目名称（用于上传 source maps）
SENTRY_ORG="your-org-name"
SENTRY_PROJECT="your-project-name"

# Auth Token（用于上传 source maps，可选）
SENTRY_AUTH_TOKEN="your-auth-token"
```

### 3. 生成 Auth Token（可选，用于 Source Maps）

Source Maps 可以帮助你在 Sentry 中查看原始代码位置，而不是压缩后的代码。

1. 访问 Sentry Dashboard -> Settings -> Account -> API -> Auth Tokens
2. 点击 "Create New Token"
3. 权限选择：`project:releases` 和 `org:read`
4. 复制 token 并添加到环境变量 `SENTRY_AUTH_TOKEN`

## 功能特性

### ✅ 已启用的功能

- **错误追踪**: 自动捕获未处理的异常和 Promise 拒绝
- **性能监控**: 追踪页面加载和 API 请求性能
- **会话重放**: 错误发生时重放用户操作（10% 采样率）
- **Prisma 集成**: 追踪数据库查询性能
- **敏感信息过滤**: 自动移除 cookies、密钥、密码等敏感数据

### 🔒 隐私保护

配置文件已自动过滤以下敏感信息：
- Cookies
- Authorization headers
- 环境变量中的 SECRET、KEY、PASSWORD、TOKEN
- 用户密码和个人信息

### 🎯 忽略的错误

以下错误不会上报到 Sentry（避免噪音）：
- 浏览器扩展错误
- 网络连接错误
- 取消的请求（AbortError）
- 数据库连接临时中断

## 调整采样率

在生产环境中，可以调整以下采样率以控制成本：

### sentry.client.config.ts

```typescript
tracesSampleRate: 0.1, // 性能追踪：10% 的事务
sessionSampleRate: 0.05, // 会话重放：5% 的正常会话
```

### sentry.server.config.ts

```typescript
tracesSampleRate: 0.2, // 服务器性能追踪：20%
```

**建议采样率**:
- 小型项目（<10K 用户）: 0.3-1.0
- 中型项目（10K-100K 用户）: 0.1-0.3
- 大型项目（>100K 用户）: 0.01-0.1

## 验证配置

### 开发环境测试

开发环境默认禁用 Sentry，如需测试，临时修改配置：

```typescript
// sentry.client.config.ts
enabled: true, // 改为 true
```

然后在代码中触发测试错误：

```typescript
throw new Error('Sentry test error')
```

### 生产环境验证

部署后，访问 Sentry Dashboard 查看：
- **Issues**: 错误列表
- **Performance**: 性能监控
- **Replays**: 会话重放

## 手动捕获错误

在代码中手动上报错误：

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  // 你的代码
} catch (error) {
  Sentry.captureException(error)
}
```

添加上下文信息：

```typescript
Sentry.setUser({ id: user.id, email: user.email })
Sentry.setTag('page', 'checkout')
Sentry.setContext('order', { orderId: '12345' })
```

## 卸载 Sentry

如果不需要 Sentry，可以完全移除：

```bash
npm uninstall @sentry/nextjs
```

然后删除以下文件：
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`
- `SENTRY_SETUP.md`

并恢复 `next.config.ts` 为原始配置。

## 成本估算

Sentry 免费计划：
- **5,000 errors/month**
- **10,000 performance units/month**
- **50 session replays/month**

超出后需要升级付费计划，或降低采样率。

## 故障排除

### 错误未上报到 Sentry

1. 检查环境变量是否正确配置
2. 确认 `NODE_ENV=production`
3. 检查浏览器控制台是否有 Sentry 相关错误
4. 验证 DSN 是否正确

### Source Maps 未上传

1. 检查 `SENTRY_AUTH_TOKEN` 是否配置
2. 检查 `SENTRY_ORG` 和 `SENTRY_PROJECT` 是否正确
3. 查看构建日志中的 Sentry 上传信息

### 过多的错误上报

调整忽略规则：

```typescript
// sentry.client.config.ts
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'Non-Error promise rejection captured',
  // 添加更多需要忽略的错误
],
```

## 参考资料

- [Sentry Next.js 官方文档](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry 采样配置](https://docs.sentry.io/platforms/javascript/configuration/sampling/)
- [隐私与合规](https://docs.sentry.io/product/data-management-settings/scrubbing/)
