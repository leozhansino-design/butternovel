# Vercel 环境变量配置检查指南

## 问题诊断

### 错误现象
```
Can't reach database server at `db.prisma.io:5432`
Invalid `prisma.novel.findMany()` invocation
```

### 问题分析
- ✅ **代码没有问题** - master 分支和 claude 分支代码完全一致
- ✅ **Claude 分支部署正常** - 说明代码和数据库都是可用的
- ❌ **Master 分支部署失败** - 说明 Vercel 环境变量配置有问题

---

## 解决方案：检查 Vercel 环境变量

### 步骤 1：登录 Vercel Dashboard

1. 访问 https://vercel.com/
2. 登录你的账户
3. 选择 `butternovel` 项目

### 步骤 2：检查生产环境变量

1. 进入项目设置：**Settings** → **Environment Variables**
2. 检查 **Production** 环境是否配置了以下变量：

#### 必需的环境变量清单

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | Prisma Postgres 连接字符串 | `postgres://...@db.prisma.io:5432/postgres?sslmode=require` |
| `NEXTAUTH_SECRET` | NextAuth 密钥 | 随机生成的字符串 |
| `NEXTAUTH_URL` | 生产环境 URL | `https://your-domain.vercel.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth 客户端 ID | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 客户端密钥 | `GOCSPX-xxxxx` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary 云名称 | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API 密钥 | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API 密钥 | `xxxxxxxxxxxxx` |
| `ADMIN_JWT_SECRET` | 管理员 JWT 密钥 | 随机生成的字符串 |

### 步骤 3：重点检查 DATABASE_URL

**关键点：** `db.prisma.io` 是 **有效的** Prisma Postgres 地址，不是示例地址！

#### 正确的 DATABASE_URL 格式
```bash
postgres://[user]:[password]@db.prisma.io:5432/postgres?sslmode=require&connect_timeout=15
```

#### 如何获取正确的 DATABASE_URL

##### 方案 A：从 Vercel Storage 获取

1. 在 Vercel Dashboard 中，进入 **Storage** 标签
2. 找到你的 **Prisma Postgres** 数据库
3. 点击数据库，选择 **`.env.local` 标签**
4. 复制完整的 `DATABASE_URL`
5. 粘贴到 Environment Variables 的 Production 环境

##### 方案 B：从本地 .env 文件复制

如果你的本地开发环境运行正常：

```bash
# 查看你的本地 .env 文件
cat .env | grep DATABASE_URL

# 复制输出的值到 Vercel
```

### 步骤 4：确认环境变量作用域

⚠️ **重要：** 环境变量必须应用到正确的环境和分支

1. 在添加/编辑环境变量时，确保选中：
   - ✅ **Production** (生产环境)
   - ✅ **Preview** (预览环境，可选)
   - ✅ **Development** (开发环境，可选)

2. 确认变量应用到 `master` 分支：
   - Vercel 默认将 `main` 或 `master` 分支作为生产分支
   - 检查 **Settings** → **Git** → **Production Branch** 设置

### 步骤 5：重新部署

配置完环境变量后：

1. 回到 **Deployments** 标签
2. 找到最新的 master 分支部署
3. 点击 **Redeploy** (三个点菜单)
4. 选择 **Redeploy with existing Build Cache** 或 **Redeploy without Cache**

---

## 常见问题

### Q1: 为什么 claude 分支能工作，master 分支不能？

**A:** Vercel 对不同分支可以有不同的环境变量配置：

- Claude 分支使用 **Preview** 环境变量
- Master 分支使用 **Production** 环境变量
- 这两个环境的变量配置可能不同

**解决方法：**
1. 将 Preview 环境的变量复制到 Production 环境
2. 或者确保所有环境都配置了相同的变量

### Q2: 我的 DATABASE_URL 是 db.prisma.io，这正常吗？

**A:** ✅ **完全正常！** `db.prisma.io` 是 Vercel Prisma Postgres 的官方地址。

Vercel 提供两种 Postgres：
- **Vercel Postgres**: 使用 `*.vercel-storage.com`
- **Prisma Postgres**: 使用 `db.prisma.io` (通过 Prisma Accelerate)

两种都是有效的，你使用的是 Prisma Postgres。

### Q3: 如何确认数据库连接字符串是否正确？

**A:** 使用 Prisma CLI 测试：

```bash
# 在本地运行测试
npx prisma db execute --stdin <<< "SELECT 1" --url="你的DATABASE_URL"

# 如果成功，会输出：
# [1]
```

### Q4: 我已经配置了环境变量，但还是连接失败？

**A:** 检查以下几点：

1. **连接字符串完整性**
   ```bash
   # 必须包含：
   postgres://              # 协议
   [user]:[password]@       # 认证
   db.prisma.io:5432       # 主机和端口
   /postgres               # 数据库名
   ?sslmode=require        # SSL 模式
   ```

2. **密码特殊字符编码**
   - 如果密码包含特殊字符（`@`, `#`, `%` 等）
   - 需要进行 URL 编码
   - 例如：`@` → `%40`, `#` → `%23`

3. **连接参数**
   - 确保包含 `sslmode=require`
   - 建议添加 `connect_timeout=15`

4. **环境变量未生效**
   - 修改环境变量后必须重新部署
   - 仅修改代码的部署不会更新环境变量

---

## 验证修复

修复后，检查以下页面是否正常：

### 1. 首页
```
https://your-domain.vercel.app/
```
应该能看到小说列表

### 2. API 健康检查
```
https://your-domain.vercel.app/api/health
```
应该返回：
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

### 3. Library 页面
```
https://your-domain.vercel.app/
点击 "My Library" 按钮
```
应该能看到收藏的书籍，点击书籍应该跳转到正确的章节页面（不是 404）

### 4. Profile API
```
https://your-domain.vercel.app/api/profile
```
登录后应该返回用户信息（不是 503 错误）

---

## 快速检查清单

在 Vercel Dashboard 中完成以下检查：

- [ ] DATABASE_URL 已配置到 Production 环境
- [ ] DATABASE_URL 的值正确（包含 db.prisma.io:5432）
- [ ] 所有其他必需的环境变量都已配置
- [ ] Production Branch 设置为 `master` 或 `main`
- [ ] 环境变量修改后已重新部署
- [ ] 部署日志中没有 "Missing environment variables" 错误
- [ ] 部署日志中没有 "Can't reach database server" 错误

---

## 如果问题仍然存在

### 检查部署日志

1. 进入 **Deployments**
2. 点击失败的部署
3. 查看 **Build Logs** 和 **Function Logs**
4. 搜索关键词：
   - `DATABASE_URL`
   - `Missing environment`
   - `Can't reach database`
   - `P1001`

### 联系支持

如果以上步骤都无法解决问题，可能需要：

1. **检查 Prisma Postgres 状态**
   - 登录 Vercel Dashboard → Storage
   - 确认数据库状态为 "Active"

2. **重新生成数据库凭证**
   - 在 Storage 页面重新生成 DATABASE_URL
   - 更新 Vercel 环境变量

3. **检查 Vercel 区域设置**
   - 确保你的应用和数据库在同一区域
   - Settings → General → Region

---

## 总结

**问题根源：** Master 分支的 Vercel Production 环境变量没有正确配置 DATABASE_URL

**解决方法：**
1. 在 Vercel Dashboard 配置 Production 环境变量
2. 重新部署 master 分支
3. 验证部署成功

**记住：** `db.prisma.io` 是有效的 Prisma Postgres 地址，不需要修改！
