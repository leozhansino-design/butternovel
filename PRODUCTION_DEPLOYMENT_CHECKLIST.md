# 🚀 生产环境部署检查清单 (Production Deployment Checklist)

## ⚠️ 重要提示
由于您直接部署到生产环境（不在开发环境测试），此清单确保所有修复都已正确应用且符合生产级标准。

---

## 📋 部署前必检项目 (Pre-Deployment Checks)

### 1. 环境变量设置 (Environment Variables)

#### 必须设置的环境变量 ✅
```bash
# 数据库连接
DATABASE_URL="postgresql://..."  # Neon/Supabase PostgreSQL URL
DIRECT_URL="postgresql://..."    # Direct connection URL (for migrations)

# NextAuth配置
NEXTAUTH_URL="https://your-domain.com"  # 生产域名
NEXTAUTH_SECRET="[生成32+字符的随机字符串]"

# Admin JWT密钥 (新增要求!)
ADMIN_JWT_SECRET="[生成32+字符的随机字符串]"

# OAuth (如果使用)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
FACEBOOK_CLIENT_ID="..."
FACEBOOK_CLIENT_SECRET="..."

# Cloudinary (图片上传)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Redis (缓存 - 可选)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

#### 生成安全密钥的方法：
```bash
# 方法1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法2: OpenSSL
openssl rand -hex 32

# 方法3: 在线生成
# https://randomkeygen.com/
```

---

### 2. 数据库迁移 (Database Migration)

#### 应用Admin密码字段迁移：
```bash
# 连接到生产数据库，执行以下SQL
psql $DATABASE_URL

-- 添加password字段到AdminProfile表
ALTER TABLE "AdminProfile" ADD COLUMN IF NOT EXISTS "password" TEXT;

-- 验证字段已添加
\d "AdminProfile"
```

**或者使用Prisma（如果可用）:**
```bash
npx prisma db push
```

---

### 3. 设置Admin密码 (Admin Password Setup)

#### 第一次部署 - 创建密码：
```bash
# 在服务器上运行密码设置脚本
node scripts/set-admin-password.js
```

#### 脚本会提示：
- 输入新密码（至少8字符，包含大小写字母和数字）
- 确认密码
- 自动使用bcrypt加密并存储到数据库

#### 验证密码已设置：
```sql
SELECT email, password IS NOT NULL as has_password, LENGTH(password) as hash_length
FROM "AdminProfile"
WHERE email = 'admin@butternovel.com';

-- 预期结果:
-- email                 | has_password | hash_length
-- admin@butternovel.com | t            | 60
```

---

### 4. 代码修复验证 (Code Fix Verification)

#### 检查所有关键修复已应用：

##### ✅ Prisma单例模式修复
**文件**: `src/lib/prisma.ts`

检查关键代码：
```typescript
// 第91行应该是:
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 第26行应该是:
databaseUrl.searchParams.set('connection_limit', isBuildTime ? '2' : '10')
```

##### ✅ Profile页面优化
**文件**: `src/app/profile/[userId]/page.tsx`

检查关键代码：
```typescript
// 第42行应该有Promise.all:
const [user, booksReadRecords, followCounts] = await Promise.all([
  // ...
])

// 第73行应该有groupBy:
withRetry(() => prisma.readingHistory.groupBy({
  // ...
}))
```

##### ✅ Reading History分页
**文件**: `src/app/api/public/user/[userId]/history/route.ts`

检查关键代码：
```typescript
// 第20行应该有limit:
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

// 第75行应该返回pagination:
return NextResponse.json({
  novels,
  pagination: {
    page,
    limit,
    total: totalCount,
    // ...
  }
})
```

##### ✅ 错误处理增强
**文件**: `src/app/api/auth/register/route.ts`

检查关键代码：
```typescript
// 第73-100行应该有Prisma错误处理:
if (error && typeof error === 'object' && 'code' in error) {
  const prismaError = error as { code: string; meta?: unknown }
  if (prismaError.code === 'P1001') {
    // 连接失败处理
  }
  // ...
}
```

##### ✅ TypeScript编译修复
**文件**: `src/app/api/chapter-progress/route.ts`

检查关键代码：
```typescript
// 第84行应该有类型检查:
if (contributionResult && typeof contributionResult === 'object' && 'levelUp' in contributionResult && contributionResult.levelUp) {
  // ...
}
```

---

### 5. 构建测试 (Build Test)

#### 在部署前本地验证构建：
```bash
# 安装依赖
npm install

# 生成Prisma Client
npx prisma generate

# 构建应用
npm run build

# 预期结果: ✓ Compiled successfully
```

#### 如果构建失败：
1. 检查错误信息
2. 确保所有环境变量已设置（可使用dummy值）
3. 确保node_modules已完全安装
4. 检查TypeScript错误（仅src/目录）

---

## 🔧 部署后验证 (Post-Deployment Verification)

### 1. Admin功能测试

#### 测试1: Admin登录
```bash
# URL: https://your-domain.com/admin/login
# 使用你设置的密码登录
# 预期: 成功登录并重定向到/admin
```

#### 测试2: Admin上传小说
```bash
# 1. 登录admin账号
# 2. 访问 /admin/upload
# 3. 上传一本测试小说
# 预期:
#   - 小说成功创建
#   - authorId为User.id（非AdminProfile.id）
#   - 前台可见
```

#### 测试3: 切换小说状态
```bash
# 1. 在Dashboard切换状态(Ongoing → Completed)
# 2. 刷新页面
# 预期: 状态保持为Completed（不会回退）
```

---

### 2. 用户功能测试

#### 测试4: 邮箱注册
```bash
# URL: https://your-domain.com/register
# 1. 填写邮箱、密码、姓名
# 2. 点击"Create Account"
# 预期:
#   - 不会卡在"Creating..."
#   - 成功创建账号
#   - 自动登录
```

#### 测试5: Profile页面加载
```bash
# 1. 登录任意用户
# 2. 访问其profile页面
# 预期:
#   - 页面快速加载(<1秒)
#   - 无"Max client connections"错误
#   - 所有tabs正常切换
```

#### 测试6: Reading History
```bash
# 1. 访问profile页面
# 2. 点击"Reading History" tab
# 预期:
#   - 显示分页的阅读历史
#   - 每页最多20条
#   - 有分页控件
```

#### 测试7: 开始阅读
```bash
# 1. 点击任意小说的"Start Reading"
# 预期:
#   - 章节页面正常加载
#   - 无Server Component错误
#   - 评论功能正常
```

---

### 3. 性能监控

#### 监控数据库连接数：
```sql
-- 在Neon/Supabase控制台查看
SELECT COUNT(*) FROM pg_stat_activity
WHERE datname = 'your_database_name';

-- 预期: 连接数 ≤ 10（单个应用实例）
-- 如果>20: 检查Prisma单例是否正确配置
```

#### 监控应用日志：
```bash
# 检查以下日志（不应频繁出现）
grep "[Database] WARNING" logs
grep "[Database] CRITICAL" logs
grep "P1001" logs  # 连接失败
grep "P1008" logs  # 超时

# 正常的日志
grep "\[Profile Page\]" logs
grep "\[Reading History API\]" logs
grep "\[Chapter Progress\]" logs
```

---

## 🚨 常见部署问题 (Common Deployment Issues)

### 问题1: "ADMIN_JWT_SECRET not set in production"

**症状**: Admin登录失败，返回500错误

**解决**:
```bash
# 在生产环境设置环境变量
ADMIN_JWT_SECRET="[32+字符随机字符串]"

# 重启应用
```

---

### 问题2: "Password not configured"

**症状**: Admin登录失败，提示密码未配置

**解决**:
```bash
# 运行密码设置脚本
node scripts/set-admin-password.js

# 或者直接在数据库中设置
# (需要先用bcrypt生成hash)
```

---

### 问题3: "Max client connections reached"

**症状**: 间歇性连接错误

**检查**:
1. Prisma单例是否正确：
   ```typescript
   export const prisma = globalForPrisma.prisma ?? createPrismaClient()
   ```
2. Connection pool配置：
   ```typescript
   connection_limit: 10  // 不应>10
   ```
3. 数据库连接数（在数据库控制台查看）

**解决**:
- 重启应用（清除旧连接）
- 检查是否有连接泄漏
- 考虑升级数据库计划

---

### 问题4: Profile页面加载慢

**症状**: Profile加载>2秒

**检查**:
1. 是否使用并行查询（Promise.all）
2. Reading History是否使用groupBy而非findMany
3. 是否有分页限制

**优化**:
- 检查 `src/app/profile/[userId]/page.tsx` 第42行
- 确保使用 `withRetry()` 包装查询

---

### 问题5: 邮箱注册卡死

**症状**: "Creating..." 永不结束

**检查日志**:
```bash
grep "\[Register API\]" logs
```

**可能原因**:
1. 数据库连接超时（P1008）
2. 数据库连接失败（P1001）
3. 邮箱重复（应该返回错误，不应卡死）

**解决**:
- 检查 `src/app/api/auth/register/route.ts` 的错误处理
- 查看详细错误日志

---

## 📊 性能基准 (Performance Benchmarks)

### 预期性能指标：

| 指标 | 目标值 | 关注阈值 |
|------|---------|----------|
| Profile页面加载 | <500ms | >1s |
| Reading History API | <200ms | >500ms |
| Novel状态更新 | <300ms | >1s |
| 邮箱注册 | <500ms | >2s |
| 章节页面加载 | <1s | >3s |
| 数据库连接数 | 5-10 | >15 |

### 监控工具：
- Vercel Analytics (如果使用Vercel)
- Neon/Supabase监控面板
- 应用日志分析

---

## 🔐 安全检查 (Security Checks)

### ✅ 已修复的安全问题：

1. **Admin密码硬编码** ✅
   - 之前: 密码hash在源代码中
   - 现在: 密码存储在数据库中

2. **Demo密码泄露** ✅
   - 之前: UI显示demo密码
   - 现在: UI不显示任何密码

3. **JWT密钥不安全** ✅
   - 之前: 有fallback默认值
   - 现在: 生产环境强制要求设置

4. **OAuth ID暴露** ✅
   - 之前: API返回googleId/facebookId
   - 现在: 只返回authMethod

### 🔍 定期安全审计：

```bash
# 检查.env文件未提交
git log -p | grep "ADMIN_JWT_SECRET"  # 应该无结果

# 检查敏感文件在.gitignore中
grep ".env" .gitignore  # 应该有

# 检查无硬编码密码
grep -r "password.*=" src/ | grep -v "password:" | grep -v "// password"
```

---

## 📚 相关文档 (Related Documentation)

- `DATABASE_CONNECTION_FIXES.md` - 数据库连接池修复详细说明
- `ADMIN_PASSWORD_SETUP.md` - Admin密码设置完整指南
- `TESTING_CHECKLIST.md` - 功能测试清单

---

## 🆘 支持与故障排除 (Support & Troubleshooting)

### 如果遇到问题：

1. **检查日志** - 查找具体错误信息
2. **验证环境变量** - 确保所有必需变量已设置
3. **检查数据库** - 验证迁移已应用
4. **查看文档** - 参考相关MD文档

### 紧急回滚方案：

```bash
# 如果新版本有问题，回滚到上一个提交
git revert HEAD
git push

# 或者回退到特定提交
git reset --hard <previous-commit-hash>
git push --force
```

---

## ✅ 部署确认清单 (Deployment Confirmation)

部署后，确认以下所有项目都 ✅：

- [ ] ADMIN_JWT_SECRET已设置
- [ ] Admin密码已设置（通过脚本）
- [ ] Database migration已应用（password字段存在）
- [ ] Admin登录成功
- [ ] Admin上传小说成功
- [ ] 小说状态更新保持
- [ ] 邮箱注册成功
- [ ] Profile页面加载正常
- [ ] Reading History分页显示
- [ ] 章节阅读无错误
- [ ] 数据库连接数正常(<15)
- [ ] 无"Max client connections"错误（观察10分钟）
- [ ] 所有日志正常（无CRITICAL错误）

---

**部署日期**: _______________
**部署人员**: _______________
**版本**: v2.1.0 (with database connection fixes)
**最后更新**: 2025-11-15

---

**🎉 如果所有检查通过，恭喜！您的应用已准备好服务生产流量！**
