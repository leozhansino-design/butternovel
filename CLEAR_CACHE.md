# 清除 Redis 缓存指南

## 何时需要清除缓存？

在以下情况下，你可能需要手动清除 Redis 缓存：

1. **更新代码后**：如果你更新了缓存格式或序列化逻辑
2. **数据损坏**：Vercel 日志显示 JSON 解析错误或 BigInt 序列化错误
3. **测试验证**：想要测试缓存未命中和重新生成的行为
4. **内容迁移**：数据库结构发生重大变更

## 清除方法

### 方法 1：使用 npm 脚本（推荐）

**前提条件**：
- 已配置 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 环境变量
- 在 `.env.local` 文件中（本地）或 Vercel 环境变量中（生产）

**运行命令**：
```bash
npm run cache:clear
```

**输出示例**：
```
🔌 连接到 Upstash Redis...
✓ Redis 连接成功

📊 查找所有缓存键...
✓ 找到 15 个缓存键

缓存键列表：
  1. home:featured
  2. home:all-categories
  3. home:category:fantasy
  4. home:category:romance
  ...

🗑️  清除所有缓存...
✅ 缓存清除完成！
✓ 已删除 15 个缓存键
```

---

### 方法 2：使用 Upstash Dashboard

1. **登录 Upstash**
   - 访问 https://console.upstash.com/
   - 使用你的账号登录

2. **选择数据库**
   - 在左侧菜单选择你的 Redis 数据库
   - 例如：`butternovel-cache`

3. **清除数据**
   - 点击顶部 "Data Browser" 标签
   - 点击右上角红色的 "Flush Database" 按钮
   - 确认清除操作

---

### 方法 3：本地运行 TypeScript 脚本

如果你想直接运行脚本（不通过 npm）：

```bash
npx tsx scripts/clear-redis-cache.ts
```

这与 `npm run cache:clear` 效果相同，但需要确保环境变量已设置。

---

## 验证缓存已清除

**方法 1：查看 Upstash Dashboard**
1. 访问 Upstash Dashboard
2. 进入 "Data Browser" 标签
3. 应该看到：`No keys found`

**方法 2：查看 Vercel 日志**

清除缓存后，访问网站首页，查看 Vercel Runtime Logs：

```
✗ 缓存未命中，查询数据库: home:featured
✓ 数据已缓存: home:featured (TTL: 3600s)
```

第一次访问应该显示"缓存未命中"，第二次访问应该显示"缓存命中"。

---

## 常见错误和解决方案

### 错误 1: "未找到环境变量"

**错误信息**:
```
❌ 错误：未找到 UPSTASH_REDIS_REST_URL 或 UPSTASH_REDIS_REST_TOKEN 环境变量
```

**解决方法**:
1. 检查 `.env.local` 文件是否包含这两个变量
2. 或在命令前临时设置环境变量：
```bash
UPSTASH_REDIS_REST_URL="https://..." UPSTASH_REDIS_REST_TOKEN="AXX..." npm run cache:clear
```

---

### 错误 2: "Redis 连接测试失败"

**可能原因**:
- Token 或 URL 配置错误
- Upstash 数据库已被删除
- 网络连接问题

**解决方法**:
1. 访问 Upstash Dashboard 验证数据库存在
2. 重新复制 REST API URL 和 Token
3. 更新 `.env.local` 或 Vercel 环境变量
4. 重试清除命令

---

### 错误 3: "没有找到缓存数据"

**信息**:
```
✓ 没有找到缓存数据
```

**说明**:
这不是错误！说明：
- Redis 中没有任何缓存数据（已经是干净的）
- 或者网站还没有访问过（缓存尚未生成）

---

## BigInt 序列化问题（已修复）

### 问题描述

**旧版本日志错误**:
```
✗ 数据序列化失败 (home:category:horror): TypeError: Do not know how to serialize a BigInt
✗ 缓存数据解析失败 (home:all-categories): SyntaxError: Unexpected token 'o', "[object Obj"... is not valid JSON
```

### 原因

- Prisma 返回的 `_count` 等字段是 BigInt 类型
- JavaScript 的 `JSON.stringify()` 不支持 BigInt 序列化
- 导致缓存数据格式损坏

### 解决方案

**最新代码已修复**（commit `fix: Handle BigInt serialization in cache`）:

在 `src/lib/cache.ts` 中添加了 `safeStringify` 函数：

```typescript
function safeStringify(data: any): string {
  return JSON.stringify(data, (key, value) => {
    // 将 BigInt 转换为 Number
    if (typeof value === 'bigint') {
      return Number(value);
    }
    return value;
  });
}
```

### 如何修复旧部署

如果你在修复前已经部署，请：

1. **拉取最新代码**
```bash
git pull origin claude/implement-redis-caching-011CV5MvqKcTMUrXydgN712B
```

2. **清除损坏的缓存**
```bash
npm run cache:clear
```

3. **重新部署到 Vercel**
- Vercel 会自动检测新 commit 并部署
- 或手动点击 "Redeploy"

4. **验证修复**

访问网站并查看 Vercel 日志，应该看到：
```
✓ Redis 客户端已初始化 (Upstash REST API)
✗ 缓存未命中，查询数据库: home:featured
✓ 数据已缓存: home:featured (TTL: 3600s)
✓ 缓存命中: home:featured
```

**不应该**再看到以下错误：
- ❌ `Do not know how to serialize a BigInt`
- ❌ `Unexpected token 'o', "[object Obj"...`

---

## 自动化清除（可选）

如果你经常需要清除缓存，可以创建一个 GitHub Action 或 Vercel Cron Job：

**示例：每天凌晨清除缓存**

创建 `.github/workflows/clear-cache.yml`:

```yaml
name: Clear Redis Cache Daily

on:
  schedule:
    - cron: '0 0 * * *'  # 每天 UTC 00:00
  workflow_dispatch:  # 允许手动触发

jobs:
  clear-cache:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run cache:clear
        env:
          UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
          UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
```

---

## 总结

✅ **推荐使用**：`npm run cache:clear`（最简单）
✅ **生产环境**：Upstash Dashboard "Flush Database"（无需本地环境）
✅ **自动化**：设置 GitHub Action 或 Vercel Cron Job

🚫 **不推荐**：手动删除单个键（容易遗漏）

有问题？查看：
- [REDIS_CACHE.md](./REDIS_CACHE.md) - 完整缓存系统说明
- [UPSTASH_SETUP.md](./UPSTASH_SETUP.md) - Upstash 配置指南
- [HOW_TO_VERIFY_REDIS.md](./HOW_TO_VERIFY_REDIS.md) - 验证方法
