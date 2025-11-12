# 数据库请求激增问题总结

## 问题
- 400 次访问产生了 105,140 次数据库请求
- 平均每次访问 = 263 次请求（异常高）

## 根本原因
数据库 suspend → 所有查询失败 → 重试机制 → 更多失败请求 → 恶性循环

## 已采取措施
1. ✅ 降低重试次数：3次 → 2次
2. ✅ 增加重试延迟：1秒 → 2秒  
3. ✅ 构建时跳过预渲染（generateStaticParams 返回空数组）
4. ✅ 构建时跳过环境变量验证

## 下一步行动

### 立即执行
1. **恢复数据库** - 最重要！
   - 登录 Vercel/Neon/Supabase
   - 找到被 suspend 的数据库
   - 点击 Resume 按钮

2. **清理预览部署**
   - 登录 Vercel Dashboard
   - 删除旧的预览部署
   - 减少不必要的重复构建

3. **监控数据库使用**
   - 数据库恢复后观察请求量
   - 检查是否还有异常高的请求

### 长期优化

1. **添加请求缓存** (数据库恢复后)
   ```typescript
   // 考虑使用 React Cache 或 Next.js unstable_cache
   import { cache } from 'react'
   
   export const getCategoriesWithCache = cache(async () => {
     return await prisma.category.findMany()
   })
   ```

2. **减少首页查询数量**
   - 当前：10 个独立查询（1个分类 + 1个featured + 8个分类小说）
   - 优化：合并为 1-2 个查询

3. **添加失败计数器**
   ```typescript
   // 如果连续失败太多次，停止重试一段时间
   let consecutiveFailures = 0
   const MAX_FAILURES = 10
   
   if (consecutiveFailures > MAX_FAILURES) {
     throw new Error('Database temporarily unavailable')
   }
   ```

4. **只在生产环境使用重试**
   ```typescript
   const maxRetries = process.env.NODE_ENV === 'production' ? 2 : 0
   ```

## 估算正常请求量

**正常情况下（数据库健康）**：
- 首页加载：10 queries × 1 次成功 = 10 次
- 400 次访问 × 10 queries = 4,000 次请求 ✅ 正常

**异常情况（数据库挂起）**：
- 首页加载：10 queries × 2 重试 × 多次部署 = 爆炸💥
