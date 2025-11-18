# ButterNovel 测试计划

**生成时间**: 2025-11-18
**当前测试覆盖率**: ~5% (仅 validators 有基础测试)
**目标覆盖率**: 60%+

---

## 📊 测试优先级分类

### 🔴 优先级 - 核心功能（立即测试）

#### 1. 安全与验证
- ✅ `src/lib/validators.ts` - 数据验证 (已有测试)
- 🔥 `src/lib/rate-limit.ts` - 速率限制（新添加，核心安全）
- 🔥 `src/lib/api-error-handler.ts` - 错误处理

#### 2. 核心工具函数
- 🔥 `src/lib/utils.ts` - 通用工具函数
- 🔥 `src/lib/format.ts` - 格式化工具（被广泛使用）
- 🔥 `src/lib/db-retry.ts` - 数据库重试逻辑（关键）
- 🔥 `src/lib/pagination.ts` - 分页逻辑

#### 3. 核心 API 路由
- 🔥 `src/app/api/search/route.ts` - 搜索 API
- 🔥 `src/app/api/novels/[id]/route.ts` - 小说详情 API
- 🔥 `src/app/api/auth/[...nextauth]/route.ts` - 认证 API

**预计工作量**: 2-3 小时
**测试文件数**: 10 个

---

### 🟡 次优先级 - 重要功能（尽快测试）

#### 4. 业务逻辑
- 🟡 `src/lib/badge-system.ts` - 徽章系统
- 🟡 `src/lib/contribution.ts` - 贡献系统
- 🟡 `src/lib/tags.ts` - 标签处理
- 🟡 `src/lib/image-utils.ts` - 图片处理

#### 5. SEO 与元数据
- 🟡 `src/lib/metadata.ts` - SEO 元数据（新添加）
- 🟡 `src/app/sitemap.ts` - 动态 Sitemap
- 🟡 `src/app/robots.ts` - Robots.txt

#### 6. API 响应
- 🟡 `src/lib/api-response.ts` - API 响应格式
- 🟡 `src/app/api/categories/route.ts` - 分类 API
- 🟡 `src/app/api/novels/[id]/chapters/route.ts` - 章节列表 API

**预计工作量**: 3-4 小时
**测试文件数**: 10 个

---

### 🟢 不急 - 辅助功能（稍后测试）

#### 7. 第三方集成
- 🟢 `src/lib/cloudinary.ts` - Cloudinary 集成
- 🟢 `src/lib/redis.ts` - Redis 集成（可选）

#### 8. 高级功能
- 🟢 `src/lib/view-tracker.ts` - 浏览量追踪
- 🟢 `src/lib/cache.ts` - 缓存逻辑
- 🟢 `src/lib/novel-queries.ts` - 复杂查询
- 🟢 `src/lib/batch-upload-utils.ts` - 批量上传

#### 9. 管理员功能
- 🟢 `src/lib/admin-auth.ts` - 管理员认证
- 🟢 `src/lib/admin-middleware.ts` - 管理员中间件
- 🟢 `src/app/api/admin/*` - 管理员 API 路由

**预计工作量**: 4-5 小时
**测试文件数**: 15 个

---

## 📋 详细测试清单

### 🔴 优先级测试

#### ✅ validators.ts (已完成)
```
✅ novelCreateSchema - 小说创建验证
✅ chapterCreateSchema - 章节创建验证
✅ ratingSchema - 评分验证
✅ commentSchema - 评论验证
```

#### 🔥 rate-limit.ts (新添加，必测)
```
⏳ MemoryRateLimiter.check() - 速率检查
⏳ rateLimit() - 速率限制函数
⏳ getIdentifier() - 标识符获取
⏳ 滑动窗口算法正确性
⏳ 自动清理过期记录
⏳ 并发安全性
```

#### 🔥 utils.ts
```
⏳ cn() - className 合并
⏳ slugify() - URL slug 生成
⏳ truncate() - 文本截断
⏳ sanitizeHtml() - HTML 清理
⏳ parseSearchParams() - 搜索参数解析
```

#### 🔥 format.ts
```
⏳ formatDate() - 日期格式化
⏳ formatNumber() - 数字格式化
⏳ formatViewCount() - 浏览量格式化 (1K, 1M)
⏳ timeAgo() - 相对时间 (2 hours ago)
⏳ formatDuration() - 时长格式化
```

#### 🔥 db-retry.ts
```
⏳ withRetry() - 重试逻辑
⏳ exponentialBackoff - 指数退避
⏳ 最大重试次数
⏳ 可重试错误识别
⏳ 错误日志记录
```

#### 🔥 pagination.ts
```
⏳ getPaginationParams() - 分页参数解析
⏳ getPaginationMetadata() - 分页元数据
⏳ 边界条件（page=0, limit过大）
⏳ 总页数计算
```

#### 🔥 api-error-handler.ts
```
⏳ handleApiError() - 错误处理
⏳ Prisma 错误映射
⏳ Zod 验证错误
⏳ 自定义错误类型
⏳ 错误响应格式
```

---

### 🟡 次优先级测试

#### 🟡 badge-system.ts
```
⏳ calculateUserBadges() - 徽章计算
⏳ 阅读徽章条件
⏳ 写作徽章条件
⏳ 互动徽章条件
```

#### 🟡 contribution.ts
```
⏳ calculateContribution() - 贡献值计算
⏳ 写作贡献
⏳ 阅读贡献
⏳ 互动贡献
```

#### 🟡 tags.ts
```
⏳ parseTags() - 标签解析
⏳ validateTags() - 标签验证
⏳ normalizeTags() - 标签规范化
⏳ 多行标签支持
```

#### 🟡 metadata.ts (新添加，必测)
```
⏳ generateNovelMetadata() - 小说元数据
⏳ generateChapterMetadata() - 章节元数据
⏳ generateCategoryMetadata() - 分类元数据
⏳ generateSearchMetadata() - 搜索元数据
⏳ generateNovelJsonLd() - 结构化数据
```

#### 🟡 image-utils.ts
```
⏳ getImageDimensions() - 图片尺寸
⏳ validateImageUrl() - 图片 URL 验证
⏳ optimizeImage() - 图片优化
```

#### 🟡 api-response.ts
```
⏳ successResponse() - 成功响应
⏳ errorResponse() - 错误响应
⏳ paginatedResponse() - 分页响应
⏳ 响应格式一致性
```

---

### 🟢 不急测试

#### 🟢 cloudinary.ts
```
⏳ uploadImage() - 图片上传（Mock）
⏳ deleteImage() - 图片删除（Mock）
⏳ 错误处理
```

#### 🟢 view-tracker.ts
```
⏳ trackView() - 浏览量追踪
⏳ 防重复计数
⏳ IP 限制
```

#### 🟢 cache.ts
```
⏳ getCached() - 缓存获取
⏳ setCached() - 缓存设置
⏳ invalidateCache() - 缓存失效
```

---

## 🎯 API 路由测试（集成测试）

### 🔴 优先级 API

1. **搜索 API** - `GET /api/search`
   - ⏳ 关键词搜索
   - ⏳ 分类筛选
   - ⏳ 分页
   - ⏳ 速率限制
   - ⏳ 相关性排序

2. **小说详情 API** - `GET /api/novels/[id]`
   - ⏳ 正常获取
   - ⏳ 未找到 (404)
   - ⏳ 已删除小说
   - ⏳ ISR 缓存

3. **认证 API** - `POST /api/auth/[...nextauth]`
   - ⏳ 登录成功
   - ⏳ 登录失败
   - ⏳ 注册成功
   - ⏳ 注册失败（重复邮箱）

### 🟡 次优先级 API

4. **分类 API** - `GET /api/categories`
   - ⏳ 获取所有分类
   - ⏳ 缓存验证

5. **章节列表 API** - `GET /api/novels/[id]/chapters`
   - ⏳ 分页获取
   - ⏳ 仅已发布章节

6. **评分 API** - `POST /api/novels/[id]/rating`
   - ⏳ 有效评分
   - ⏳ 重复评分
   - ⏳ 速率限制

---

## 📈 测试覆盖率目标

| 模块 | 当前 | 目标 | 优先级 |
|------|------|------|--------|
| lib/validators | 60% | 90% | 🔴 |
| lib/rate-limit | 0% | 90% | 🔴 |
| lib/utils | 0% | 80% | 🔴 |
| lib/format | 0% | 80% | 🔴 |
| lib/db-retry | 0% | 85% | 🔴 |
| lib/pagination | 0% | 80% | 🔴 |
| lib/api-error-handler | 0% | 75% | 🔴 |
| lib/metadata | 0% | 70% | 🟡 |
| lib/badge-system | 0% | 70% | 🟡 |
| lib/tags | 0% | 75% | 🟡 |
| API Routes | 0% | 50% | 🟡 |
| Components | 0% | 30% | 🟢 |

**总体目标**: 从 5% 提升到 **60%+**

---

## 🛠️ 测试技术栈

### 单元测试
- **框架**: Jest
- **工具**: @testing-library/react
- **断言**: expect (Jest)
- **Mock**: jest.fn(), jest.mock()

### 集成测试
- **API 测试**: Supertest (待安装)
- **数据库**: Mock Prisma Client
- **认证**: Mock NextAuth

### E2E 测试（未来）
- **框架**: Playwright / Cypress
- **范围**: 关键用户流程

---

## ⏱️ 实施时间表

### 第 1 阶段：优先级测试（2-3 天）
- Day 1: rate-limit, utils, format
- Day 2: db-retry, pagination, api-error-handler
- Day 3: 核心 API 路由测试

### 第 2 阶段：次优先级测试（3-4 天）
- Day 4-5: badge-system, contribution, tags, metadata
- Day 6-7: 次优先级 API 测试

### 第 3 阶段：不急测试（按需）
- 根据项目进展安排

---

## 📝 测试命名规范

### 文件命名
```
src/__tests__/lib/rate-limit.test.ts
src/__tests__/lib/utils.test.ts
src/__tests__/api/search.test.ts
```

### 测试用例命名
```typescript
describe('MemoryRateLimiter', () => {
  describe('check()', () => {
    it('should allow requests within limit', () => {})
    it('should block requests exceeding limit', () => {})
    it('should reset after interval', () => {})
  })
})
```

---

## ✅ 成功标准

1. **覆盖率**: 达到 60%+ 代码覆盖率
2. **关键路径**: 100% 覆盖核心业务逻辑
3. **边界条件**: 所有边界情况都有测试
4. **CI/CD**: 所有测试在 PR 前通过
5. **文档**: 每个测试文件包含清晰说明

---

## 🚀 立即开始

**当前任务**:
1. ✅ 制定测试计划
2. ⏳ 实施优先级测试（rate-limit, utils, format）
3. ⏳ 实施次优先级测试（metadata, badge-system, tags）

**下一步**: 立即开始编写优先级测试代码！
