# Redis 缓存优化指南

## 问题诊断

### 当前情况

**Preview 环境（claude 分支）**：
- 每次刷新首页消耗 **17 Redis reads**
- 这是**正常的 Preview 行为** ✓

**为什么 Preview 环境每次都读取 Redis？**

Vercel Preview 部署的特点：
1. **不使用 Edge 缓存**：Preview 主要用于测试，不启用完整的 CDN 缓存
2. **ISR 受限**：`revalidate = 3600` 在 Preview 中不完全生效
3. **每次请求触发 Serverless Function**：因此每次刷新都执行服务器代码 → 读取 Redis

### 生产环境的预期行为

**生产部署（main 分支）**：

```
用户 A 访问首页（缓存冷启动）
  → Serverless Function 执行
  → 读取 Redis（17 reads）或查询数据库
  → 生成 HTML
  → 缓存到 Edge（全球 CDN）
  → 返回给用户 A

用户 B、C、D...（3600 秒内）
  → 直接从 Edge Cache 返回 HTML
  → ✅ 0 Redis commands
  → ✅ 0 数据库查询
  → ⚡ 超快响应（< 50ms）

3600 秒后，用户 E 访问
  → Serverless Function 执行（后台重新生成）
  → 读取 Redis（17 reads）
  → 更新 Edge Cache
  → 循环继续...
```

**结论**：生产环境下，**大部分流量不会触发 Redis 读取**。

---

## 为什么仍需优化？

虽然生产环境有 Edge Cache，但以下场景仍会消耗 Redis commands：

### 场景 1：缓存重新生成（每小时 1 次）

```
每小时：17 reads + 17 writes = 34 commands
每天：34 × 24 = 816 commands
```

### 场景 2：并发冷启动

如果缓存过期后，多个请求同时到达：
```
请求 1、2、3 同时触发重新生成
→ 每个都读取 17 keys
→ 17 × 3 = 51 reads
```

### 场景 3：多地区部署

Vercel Edge Cache 分布在多个区域，每个区域可能独立缓存：
```
美国、欧洲、亚洲各 1 次冷启动
→ 17 × 3 = 51 reads
```

### 场景 4：高流量网站

如果每天 1000 次缓存重新生成（例如有很多更新）：
```
1000 × 17 = 17,000 reads/天
超过免费额度 10,000 commands
```

---

## 优化方案对比

### 优化前（当前架构）

**缓存键结构**：
```
home:featured              (1 key)
home:all-categories        (1 key)
home:category:fantasy      (1 key)
home:category:romance      (1 key)
...（15 个分类）
---
总计：17 个独立的 Redis 键
```

**每次渲染消耗**：
```
首页渲染 1 次 = 17 reads

如果缓存全部未命中：
17 reads + 17 writes = 34 commands
```

**优点**：
- ✅ 粒度细：可以单独更新某个分类
- ✅ 灵活性高：每个部分独立缓存

**缺点**：
- ❌ Commands 消耗高：17 reads per 渲染
- ❌ 缓存失效复杂：需要清除多个键
- ❌ 网络往返多：17 次 Redis 请求

---

### 优化后（推荐方案）

**缓存键结构**：
```
home:all-data  (1 key，包含所有首页数据)
```

**数据结构**：
```json
{
  "featured": [...24 novels],
  "categories": [...15 categories],
  "categoryNovels": {
    "fantasy": [...10 novels],
    "romance": [...10 novels],
    ...
  },
  "timestamp": 1699999999999
}
```

**每次渲染消耗**：
```
首页渲染 1 次 = 1 read

如果缓存未命中：
1 read + 1 write = 2 commands
```

**优点**：
- ✅ **Commands 减少 94%**：17 reads → 1 read
- ✅ 缓存失效简单：只需清除 1 个键
- ✅ 网络往返少：1 次 Redis 请求
- ✅ 数据一致性：所有数据来自同一时间点

**缺点**：
- ❌ 粒度粗：更新任何部分都需要重新生成整个缓存
- ❌ 缓存体积大：约 50-100 KB JSON

**权衡**：
- 对于首页这种 **整体更新** 的场景，粗粒度缓存更合适
- 首页通常作为一个整体展示，不需要部分更新
- 缓存体积 100 KB 对 Redis 来说很小

---

## 性能对比

### Redis Commands 消耗

| 场景 | 优化前 | 优化后 | 节省 |
|------|--------|--------|------|
| 首页渲染 1 次 | 17 reads | 1 read | **-94%** |
| 缓存未命中（写入）| 34 commands | 2 commands | **-94%** |
| 每小时重新生成 | 34 commands | 2 commands | **-94%** |
| 每天（24 次重新生成）| 816 commands | 48 commands | **-94%** |
| **1000 访客/天** | **17,000 commands** | **1,000 commands** | **-94%** |

### 免费额度使用率

**Upstash 免费层**：10,000 commands/天

| 每天访客数 | 优化前 commands | 优化后 commands | 是否够用 |
|-----------|----------------|----------------|----------|
| 100 | 1,700 | 100 | ✅ 够用 |
| 500 | 8,500 | 500 | ✅ 够用（优化前接近上限）|
| 1,000 | **17,000** ❌ | 1,000 | ✅ 够用 |
| 5,000 | 85,000 ❌ | 5,000 | ✅ 够用 |
| 10,000 | 170,000 ❌ | 10,000 | ⚠️ 刚好 |

**结论**：优化后可支持 **10 倍流量**。

---

## 实施步骤

### 1. 备份当前代码

```bash
git add -A
git commit -m "backup: Before Redis optimization"
```

### 2. 替换首页文件

```bash
# 备份当前版本
cp src/app/page.tsx src/app/page.tsx.backup

# 使用优化版本
cp src/app/page-optimized.tsx.example src/app/page.tsx
```

### 3. 更新缓存失效逻辑

修改所有调用 `invalidateHomeCache()` 的地方：

**优化前**（`src/lib/cache.ts`）：
```typescript
export async function invalidateHomeCache(): Promise<void> {
  await invalidateMultiple([
    CacheKeys.HOME_FEATURED,
    CacheKeys.HOME_ALL_CATEGORIES,
    // ... 需要手动列出所有分类
  ]);
}
```

**优化后**（`src/lib/cache-optimized.ts`）：
```typescript
export async function invalidateHomePageCache(): Promise<void> {
  await invalidate('home:all-data'); // 只需清除 1 个键
}
```

更新以下文件中的缓存失效调用：
- `src/app/api/admin/novels/route.ts`
- `src/app/api/admin/novels/[id]/route.ts`
- `src/app/api/admin/chapters/route.ts`
- `src/app/api/admin/chapters/[id]/route.ts`

**查找所有需要修改的地方**：
```bash
grep -r "invalidateHomeCache\|invalidateNovelRelatedCache" src/app/api/
```

**全局替换**：
```typescript
// 修改前
import { invalidateHomeCache, invalidateNovelRelatedCache } from '@/lib/cache';
await invalidateHomeCache();

// 修改后
import { invalidateHomePageCache } from '@/lib/cache-optimized';
await invalidateHomePageCache();
```

### 4. 清除旧缓存

部署新版本后，清除 Upstash Redis 中的旧缓存键：

```bash
# 使用清除脚本
npm run cache:clear
```

或在 Upstash Dashboard → Data Browser → Flush Database

### 5. 测试验证

**测试 1：缓存写入**
```bash
# 清除缓存
npm run cache:clear

# 访问首页（第一次）
curl https://your-app.vercel.app/

# 检查 Upstash Dashboard
# 应该看到：1 个新 key: home:all-data
```

**测试 2：缓存读取**
```bash
# 访问首页（第二次）
curl https://your-app.vercel.app/

# 查看 Vercel Runtime Logs
# 应该看到：
# ✓ 缓存命中: home:all-data
```

**测试 3：缓存失效**
```bash
# 在 Admin 面板创建新小说

# 检查日志
# 应该看到：
# ✓ 首页缓存已清除 (home:all-data)

# 再次访问首页
# 应该看到新小说出现
```

### 6. 监控 Commands 消耗

访问 Upstash Dashboard → Metrics：

**优化前**（预期）：
```
每次首页刷新：+17 commands
每小时：~800 commands（假设 100 次访问）
```

**优化后**（预期）：
```
每次首页刷新：+1 command
每小时：~100 commands（假设 100 次访问）
减少：87.5%
```

---

## 回滚方案

如果优化后出现问题，可以快速回滚：

```bash
# 恢复原始首页
cp src/app/page.tsx.backup src/app/page.tsx

# 恢复缓存失效逻辑
git checkout src/app/api/

# 重新部署
git add -A
git commit -m "rollback: Restore original Redis caching"
git push
```

---

## 额外优化建议

### 1. 使用 Redis Pipeline（进阶）

如果需要保留多键架构但减少往返：

```typescript
// 使用 pipeline 批量读取
const pipeline = redis.pipeline();
pipeline.get('home:featured');
pipeline.get('home:all-categories');
categories.forEach(cat => {
  pipeline.get(`home:category:${cat.slug}`);
});
const results = await pipeline.exec();

// Commands: 17 reads → 1 pipeline command
```

**注意**：Upstash Redis REST API **不支持 pipeline**，只有 TCP 版本支持。

### 2. 压缩缓存数据

如果缓存体积过大（> 1 MB），可以使用压缩：

```typescript
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// 写入时压缩
const compressed = await gzipAsync(JSON.stringify(data));
await redis.set('home:all-data', compressed.toString('base64'));

// 读取时解压
const compressed = Buffer.from(cached, 'base64');
const decompressed = await gunzipAsync(compressed);
const data = JSON.parse(decompressed.toString());
```

**效果**：减少 60-80% 缓存体积。

### 3. 使用 Next.js unstable_cache

Next.js 内置的数据缓存层：

```typescript
import { unstable_cache } from 'next/cache';

const getHomePageData = unstable_cache(
  async () => {
    // 查询数据库
  },
  ['home-page-data'],
  {
    revalidate: 3600,
    tags: ['home']
  }
);
```

**优点**：
- 不需要外部 Redis
- 与 Next.js ISR 完美集成
- 自动管理缓存生命周期

**缺点**：
- 缓存存储在 Vercel 的边缘网络，不能跨项目共享
- 没有 Redis 灵活

---

## 总结

| 指标 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| Redis keys | 17 | 1 | -94% |
| Commands per 渲染 | 17 | 1 | -94% |
| 免费额度支持访客数 | 588/天 | 10,000/天 | +17x |
| 网络往返次数 | 17 | 1 | -94% |
| 缓存失效复杂度 | 高（17 keys）| 低（1 key）| 简化 |

**推荐**：
- ✅ 立即实施优化（特别是准备上生产环境之前）
- ✅ 节省 94% Redis commands
- ✅ 简化缓存管理
- ✅ 提高系统可扩展性

**风险**：
- ⚠️ 缓存粒度变粗（但对首页场景合适）
- ⚠️ 需要测试确保数据正确性

有问题随时在 GitHub Issues 反馈：
https://github.com/your-repo/butternovel/issues
