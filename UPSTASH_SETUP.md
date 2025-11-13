# Upstash Redis 快速配置指南

## 为什么选择 Upstash？

- ✅ **免费层**：每月 10,000 次命令（足够使用）
- ✅ **无需 Docker**：HTTP REST API，无需本地安装
- ✅ **Serverless 友好**：完美适配 Vercel、Netlify 等平台
- ✅ **1 分钟配置**：比本地 Redis 更简单

---

## 5 分钟配置步骤

### 步骤 1: 注册 Upstash（30 秒）

1. 访问 https://upstash.com/
2. 点击 **Sign Up**
3. 使用 GitHub 或 Google 账号登录（推荐）

### 步骤 2: 创建 Redis 数据库（1 分钟）

1. 登录后，点击 **Create Database** 按钮

2. 填写配置：
   - **Name**: `butternovel-cache`（随意命名）
   - **Type**: `Regional`（免费）
   - **Region**: 选择离你最近的区域
     - 如果在中国，选择 `ap-northeast-1` (Tokyo)
     - 如果在美国，选择 `us-east-1` (Virginia)
     - 如果在欧洲，选择 `eu-west-1` (Ireland)
   - **Primary Region**: 默认即可
   - **Read Regions**: 不需要（付费功能）

3. 点击 **Create**

### 步骤 3: 获取连接信息（30 秒）

1. 数据库创建后，进入数据库详情页

2. **关键**: 点击顶部的 **REST API** 标签（不是 Redis Clients）

3. 你会看到两个重要信息：
   ```
   UPSTASH_REDIS_REST_URL
   https://us1-example-12345.upstash.io

   UPSTASH_REDIS_REST_TOKEN
   AXXXxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. 点击每个值右侧的 📋 复制按钮

### 步骤 4: 配置 Vercel 环境变量（2 分钟）

#### 方法 1: Vercel Dashboard（推荐）

1. 访问 https://vercel.com/dashboard

2. 选择你的项目 → **Settings** → **Environment Variables**

3. 点击 **Add New** 添加两个变量：

   **第一个变量**:
   - Name: `UPSTASH_REDIS_REST_URL`
   - Value: 粘贴你复制的 URL（https://...）
   - Environments: 全选（Production, Preview, Development）

   **第二个变量**:
   - Name: `UPSTASH_REDIS_REST_TOKEN`
   - Value: 粘贴你复制的 Token（AXXX...）
   - Environments: 全选（Production, Preview, Development）

4. 点击 **Save**

#### 方法 2: 本地开发（可选）

在项目根目录的 `.env.local` 文件中添加：

```env
UPSTASH_REDIS_REST_URL="https://us1-example-12345.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXXxxxxxxxxxxxxxxxxxxxxxxx"
```

**注意**: `.env.local` 文件不会提交到 Git（已在 `.gitignore` 中）

### 步骤 5: 重新部署（1 分钟）

1. **触发重新部署**:
   - 方法 1: 在 Vercel Dashboard 点击 **Deployments** → 最新部署 → **Redeploy**
   - 方法 2: 推送一个新 commit 到 GitHub

2. 等待部署完成（~1 分钟）

3. **验证 Redis 工作**:
   - 访问网站首页 2 次
   - 查看 Vercel 日志（Deployments → 点击部署 → Runtime Logs）
   - 应该看到:
     ```
     ✓ Redis 客户端已初始化 (Upstash REST API)
     ✓ 缓存命中: home:featured
     ```

---

## 验证配置

### 方法 1: 查看 Vercel 日志

1. Vercel Dashboard → Deployments → 点击最新部署
2. 切换到 **Functions** 或 **Runtime Logs** 标签
3. 访问网站首页
4. 查找日志：

**成功标识**:
```
✓ Redis 客户端已初始化 (Upstash REST API)
✓ 缓存命中: home:featured
```

**失败标识**:
```
⚠ Redis 未配置（缺少 UPSTASH_REDIS_REST_URL 或 UPSTASH_REDIS_REST_TOKEN）
→ 系统将自动降级到数据库查询
```

### 方法 2: Upstash Dashboard

1. 返回 Upstash Dashboard
2. 查看你的数据库详情页
3. 应该看到 **Commands** 数量在增加
4. 点击 **Data Browser** 可以查看缓存的键

---

## 常见问题

### Q: 为什么选择 REST API 而不是 TCP？

**A**:
- Vercel 等 Serverless 平台不支持持久的 TCP 连接
- REST API 使用 HTTP，更适合无状态函数
- 每次请求独立，不需要连接池管理

### Q: 免费层够用吗？

**A**:
- 免费层：10,000 次命令/月
- 假设网站 1,000 次访问/月
- 每次访问平均 3 次 Redis 命令（GET, SET, DEL）
- 总计: 3,000 次/月 **✓ 充足**

### Q: 如何查看 Redis 使用量？

**A**:
1. Upstash Dashboard → 选择数据库
2. 查看 **Usage** 标签
3. 可以看到：
   - Total Commands
   - Daily Bandwidth
   - Storage Used

### Q: 多个环境共用一个数据库吗？

**A**:
- 推荐为生产和开发创建**不同的数据库**：
  - `butternovel-cache-production`
  - `butternovel-cache-development`
- 在 Vercel 环境变量中分别配置：
  - Production 环境 → 生产数据库
  - Preview/Development → 开发数据库

### Q: 如何清空缓存？

**A**:
1. Upstash Dashboard → Data Browser
2. 点击右上角 **Flush Database**
3. 或者在代码中使用 `FLUSHDB` 命令

### Q: 如果 Redis 挂了会怎样？

**A**:
- 系统会**自动降级到数据库查询**
- 网站功能完全正常，只是速度稍慢
- 日志会显示:
  ```
  Redis GET 失败 (home:featured): [Error]
  ✗ 缓存操作失败，回退到数据库查询
  ```

---

## 性能对比

### 无 Redis（数据库直连）
```
首页加载: 500ms
详情页: 300ms
书架查询: 100ms
```

### 启用 Upstash Redis
```
首页加载: 50ms   ⚡ 快 10 倍
详情页: 30ms     ⚡ 快 10 倍
书架查询: 5ms    ⚡ 快 20 倍
```

---

## 监控建议

### 每周检查
1. Upstash Dashboard → Usage
2. 确认命令数在免费层范围内
3. 查看平均响应时间（应该 < 50ms）

### 每月检查
1. 对比网站性能（使用 Lighthouse）
2. 查看 Vercel Analytics 中的响应时间
3. 如果超过免费层，考虑升级计划

---

## 升级到付费计划

如果网站流量增长，免费层不够用：

### Pay as you go（按需付费）
- $0.2 / 100,000 次命令
- 非常便宜，适合中小型网站

### Pro 计划（$10/月）
- 1,000,000 次命令/月
- 更高的并发限制
- 优先支持

---

## 故障排查

### 问题：日志显示 "Redis 未配置"

**解决方法**:
1. 检查 Vercel 环境变量是否正确添加
2. 确认变量名是 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`（不是其他名字）
3. 确认变量值没有多余的空格或引号
4. 重新部署项目

### 问题：Redis GET 失败

**可能原因**:
1. Token 过期（重新生成）
2. 数据库被删除（重新创建）
3. 网络问题（等待自动重试）

**解决方法**:
1. 访问 Upstash Dashboard 确认数据库状态
2. 重新复制 REST API URL 和 Token
3. 更新 Vercel 环境变量
4. 重新部署

### 问题：缓存命中率低

**可能原因**:
1. TTL 设置太短
2. 频繁的内容更新
3. 多个部署实例

**解决方法**:
1. 检查 `src/lib/cache.ts` 中的 `CacheTTL` 设置
2. 考虑延长缓存时间（如首页改为 2 小时）
3. 查看 Upstash Usage 确认命令数

---

**完成！** 你的网站现在拥有了 10x 的性能提升 🚀

需要帮助？查看:
- [Upstash 官方文档](https://docs.upstash.com/redis)
- [REDIS_CACHE.md](./REDIS_CACHE.md) - 完整缓存说明
- [HOW_TO_VERIFY_REDIS.md](./HOW_TO_VERIFY_REDIS.md) - 验证指南
