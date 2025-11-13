# 如何验证 Redis 缓存是否成功集成

## 方法 1: 查看应用日志（推荐）

### 在 Vercel 查看实时日志

1. **访问 Vercel Dashboard**
   - 打开 https://vercel.com/dashboard
   - 选择你的项目 `butternovel`
   - 点击 **Deployments** 标签
   - 选择最新的部署

2. **查看函数日志**
   - 点击 **Functions** 标签
   - 选择任意一个函数（如 `page`）
   - 查看实时日志

3. **查找缓存相关日志**

   **Redis 可用的日志标识**:
   ```
   ✓ Redis 连接成功
   ✓ Redis 已就绪
   ✓ 缓存命中: home:featured
   ✓ 数据已缓存: home:featured (TTL: 3600s)
   ✓ 缓存已清除: novel:my-novel-slug
   ```

   **Redis 不可用的日志标识**:
   ```
   ✗ Redis 连接错误: ...
   ✗ 缓存未命中，查询数据库: home:featured
   ✗ 缓存操作失败，回退到数据库查询
   ```

4. **验证缓存工作流程**
   - 第一次访问首页 → 日志显示 "✗ 缓存未命中，查询数据库"
   - 第二次访问首页 → 日志显示 "✓ 缓存命中: home:featured"

---

## 方法 2: 测试缓存功能

### 测试首页缓存

1. **清空浏览器缓存**（Ctrl + Shift + Delete）

2. **访问网站首页两次**
   ```bash
   # 第一次访问（缓存未命中）
   curl https://your-domain.vercel.app/

   # 等待 1-2 秒

   # 第二次访问（应该缓存命中）
   curl https://your-domain.vercel.app/
   ```

3. **对比响应时间**
   - 第一次: ~300-500ms（查询数据库）
   - 第二次: ~30-50ms（从 Redis 获取）✓

4. **使用浏览器开发者工具**
   - 打开 Chrome DevTools（F12）
   - 切换到 **Network** 标签
   - 访问首页
   - 查看 `page` 请求的响应时间
   - 刷新页面，对比第二次的响应时间

---

## 方法 3: 测试缓存清除机制

### 验证内容更新后缓存立即清除

1. **访问首页**（触发缓存）
   ```
   https://your-domain.vercel.app/
   ```

2. **Admin 后台创建新小说**
   - 登录 Admin: `https://your-domain.vercel.app/admin/login`
   - 创建一部新小说

3. **立即刷新首页**
   - 应该在 1 秒内看到新小说 ✓
   - 查看 Vercel 日志，应该显示:
     ```
     ✓ Cache cleared for newly created novel
     ✗ 缓存未命中，查询数据库: home:featured
     ```

4. **再次访问首页**
   - 日志应显示缓存重建:
     ```
     ✓ 数据已缓存: home:featured (TTL: 3600s)
     ```

---

## 方法 4: 性能对比测试

### 使用 Lighthouse 测试性能

1. **打开 Chrome 无痕模式**（避免缓存干扰）

2. **运行 Lighthouse**
   - 打开 Chrome DevTools (F12)
   - 切换到 **Lighthouse** 标签
   - 选择 **Performance**
   - 点击 **Analyze page load**

3. **对比性能指标**

   **Redis 可用时**:
   - First Contentful Paint (FCP): ~0.5s
   - Largest Contentful Paint (LCP): ~1.0s
   - Total Blocking Time (TBT): ~50ms

   **Redis 不可用时**:
   - FCP: ~1.5s
   - LCP: ~2.5s
   - TBT: ~200ms

---

## 方法 5: 直接连接 Redis 查看数据（高级）

### 如果使用 Upstash Redis

1. **登录 Upstash Dashboard**
   - https://console.upstash.com/

2. **选择你的 Redis 数据库**

3. **使用 Data Browser**
   - 点击 **Data Browser** 标签
   - 执行 Redis 命令:
     ```redis
     # 查看所有缓存键
     KEYS *

     # 查看首页缓存
     GET "home:featured"

     # 查看小说缓存
     KEYS "novel:*"

     # 查看缓存统计
     INFO stats
     ```

4. **验证缓存内容**
   - 应该看到键名如: `home:featured`, `home:all-categories`, `novel:my-novel-123`
   - 点击键查看缓存的 JSON 数据

### 如果使用本地 Redis

```bash
# 连接到 Redis
docker exec -it redis redis-cli

# 查看所有键
KEYS *

# 输出示例:
1) "home:featured"
2) "home:all-categories"
3) "home:category:romance"
4) "novel:my-first-novel-1234567890"

# 查看首页缓存内容
GET "home:featured"

# 查看缓存统计
INFO stats
```

---

## 方法 6: 检查环境变量（Vercel）

### 验证 Redis 环境变量已配置

1. **访问 Vercel Dashboard**
   - 打开项目设置
   - 点击 **Settings** → **Environment Variables**

2. **检查以下变量是否存在**:
   ```
   REDIS_HOST          (Upstash 主机地址)
   REDIS_PORT          (6379 或 Upstash 端口)
   REDIS_PASSWORD      (如果有)
   REDIS_DB            (0)
   ```

3. **如果缺少变量**:
   - 点击 **Add New**
   - 添加所有 Redis 相关环境变量
   - 重新部署项目

---

## 快速验证清单

### ✅ Redis 成功集成的标志

- [ ] Vercel 日志显示 "✓ Redis 连接成功"
- [ ] 第二次访问首页速度明显更快（< 100ms）
- [ ] Admin 创建小说后，首页立即显示新内容（< 1 秒）
- [ ] Upstash Dashboard 显示有活跃的连接和数据
- [ ] 日志中看到 "✓ 缓存命中" 消息

### ❌ Redis 未成功集成的标志

- [ ] 日志显示 "✗ Redis 连接错误"
- [ ] 所有请求都显示 "✗ 缓存未命中，查询数据库"
- [ ] 响应时间没有明显改善
- [ ] Upstash Dashboard 显示 0 连接或 0 命令

---

## 常见问题排查

### Q: 日志显示 "Redis 连接错误"

**检查清单**:
1. Vercel 环境变量是否正确配置？
2. `REDIS_HOST` 是否包含完整地址？
3. `REDIS_PASSWORD` 是否正确？
4. 网络是否允许连接到 Redis（防火墙/白名单）？

**解决方法**:
- 重新检查 Upstash Dashboard 的连接信息
- 复制正确的 `REDIS_HOST` 和 `REDIS_PASSWORD`
- 重新部署项目

### Q: 缓存命中率很低

**可能原因**:
1. TTL 设置太短
2. 频繁的内容更新导致缓存清除
3. 多个部署实例导致缓存分散

**解决方法**:
- 检查 `src/lib/cache.ts` 中的 `CacheTTL` 设置
- 考虑延长 TTL（如首页改为 2 小时）

### Q: 内容更新后没有立即清除缓存

**检查清单**:
1. Admin API 是否正确调用缓存清除函数？
2. 日志是否显示 "✓ Cache cleared"？
3. Redis 连接是否正常？

**解决方法**:
- 查看 Vercel 函数日志
- 确认缓存清除代码正确执行
- 手动清除缓存测试: `docker exec -it redis redis-cli FLUSHDB`

---

## 推荐监控方式

### 日常监控

1. **每天查看 Vercel 日志** - 确认缓存命中率
2. **每周检查 Upstash Dashboard** - 查看存储使用量和命令统计
3. **每月运行 Lighthouse** - 对比性能指标

### 性能基线

**记录以下指标作为基线**:
- 首页平均响应时间: ___ms
- 缓存命中率: ___%
- 数据库查询次数: ___/分钟

定期对比，确保性能持续优化。

---

**最快验证方法**: 访问首页两次，查看 Vercel 函数日志，第二次应该显示 "✓ 缓存命中" ✓
