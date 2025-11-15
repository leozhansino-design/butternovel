# ✅ Admin Password Security Fix - Testing Checklist

## 预测试准备 (Pre-Testing Setup)

在测试之前，需要完成以下设置：

### 1. 应用数据库迁移
```bash
# 方法A: 使用Prisma
npx prisma db push

# 方法B: 手动执行SQL（如果方法A失败）
# 连接到PostgreSQL，执行：
# ALTER TABLE "AdminProfile" ADD COLUMN IF NOT EXISTS "password" TEXT;
```

### 2. 设置Admin密码
```bash
node scripts/set-admin-password.js
```

按提示输入新密码（要求：至少8位，包含大小写字母和数字）

### 3. 配置环境变量
在 `.env` 文件中添加：
```bash
ADMIN_JWT_SECRET="[生成一个至少32字符的随机字符串]"
```

生成随机密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 测试清单

### ✅ 测试1: 数据库迁移成功
- [ ] `admin_profile`表中存在`password`列
- [ ] 列类型为`TEXT`（允许NULL）
- [ ] 现有admin记录未被破坏

**验证SQL：**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'AdminProfile' AND column_name = 'password';
```

**预期结果：**
```
column_name | data_type | is_nullable
password    | text      | YES
```

---

### ✅ 测试2: 密码设置脚本
- [ ] 脚本正常运行无错误
- [ ] 密码强度验证工作正常
- [ ] 密码确认匹配验证工作正常
- [ ] bcrypt hash成功生成
- [ ] 数据库更新成功

**验证：**
```bash
# 运行脚本
node scripts/set-admin-password.js

# 检查数据库中的password字段
# 应该是一个以$2b$10$开头的bcrypt hash
```

**验证SQL：**
```sql
SELECT email, password IS NOT NULL as has_password, LENGTH(password) as hash_length
FROM "AdminProfile"
WHERE email = 'admin@butternovel.com';
```

**预期结果：**
```
email                   | has_password | hash_length
admin@butternovel.com   | t            | 60
```

---

### ✅ 测试3: 登录API - 成功登录
- [ ] 使用正确的email和密码可以登录
- [ ] 返回200状态码
- [ ] 返回正确的admin信息（email, name, role）
- [ ] 设置了`admin-token` cookie
- [ ] Cookie有正确的属性（httpOnly, secure, sameSite）

**测试步骤：**
```bash
# 启动开发服务器
npm run dev

# 使用curl测试（替换YOUR_PASSWORD为你设置的密码）
curl -v -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@butternovel.com","password":"YOUR_PASSWORD"}'
```

**预期响应：**
```json
{
  "success": true,
  "admin": {
    "email": "admin@butternovel.com",
    "name": "ButterPicks",
    "role": "super_admin"
  }
}
```

**预期Cookie：**
- Name: `admin-token`
- HttpOnly: `true`
- Max-Age: `604800` (7天)

---

### ✅ 测试4: 登录API - 错误密码
- [ ] 使用错误密码返回401
- [ ] 错误消息为"Invalid email or password"
- [ ] 不泄露具体错误原因（是邮箱错误还是密码错误）

**测试步骤：**
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@butternovel.com","password":"WrongPassword123"}'
```

**预期响应：**
```json
{
  "error": "Invalid email or password"
}
```

HTTP状态码: `401`

---

### ✅ 测试5: 登录API - 不存在的邮箱
- [ ] 使用不存在的邮箱返回401
- [ ] 错误消息与密码错误相同（安全性）

**测试步骤：**
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"SomePassword123"}'
```

**预期响应：**
```json
{
  "error": "Invalid email or password"
}
```

---

### ✅ 测试6: 登录API - 密码未设置
- [ ] 如果数据库中password为NULL，返回特殊错误
- [ ] 提示用户联系管理员

**测试步骤：**
```sql
-- 临时清空密码
UPDATE "AdminProfile" SET password = NULL WHERE email = 'admin@butternovel.com';
```

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@butternovel.com","password":"AnyPassword123"}'
```

**预期响应：**
```json
{
  "error": "Password not configured. Please contact system administrator."
}
```

**记得恢复密码：**
```bash
node scripts/set-admin-password.js
```

---

### ✅ 测试7: UI - Demo密码已移除
- [ ] 访问 `/admin/login` 页面
- [ ] 页面不显示"Demo Credentials"部分
- [ ] 不显示任何密码提示

**测试步骤：**
1. 浏览器访问 `http://localhost:3000/admin/login`
2. 检查页面HTML源代码
3. 搜索 "mySecretPassword123" - 应该找不到
4. 搜索 "Demo Credentials" - 应该找不到

---

### ✅ 测试8: UI - 完整登录流程
- [ ] 输入正确的email和密码
- [ ] 点击"Sign In"按钮
- [ ] 成功重定向到 `/admin` 页面
- [ ] 可以正常访问admin功能

**测试步骤：**
1. 访问 `http://localhost:3000/admin/login`
2. 输入：
   - Email: `admin@butternovel.com`
   - Password: `[你设置的密码]`
3. 点击"Sign In"
4. 验证重定向到admin dashboard
5. 尝试上传小说 - 应该正常工作

---

### ✅ 测试9: 生产环境JWT Secret强制
- [ ] 设置 `NODE_ENV=production`
- [ ] 不设置 `ADMIN_JWT_SECRET`
- [ ] 登录应该失败并返回500错误

**测试步骤：**
```bash
# 临时设置环境变量
NODE_ENV=production npm run dev

# 尝试登录（ADMIN_JWT_SECRET未设置）
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@butternovel.com","password":"YOUR_PASSWORD"}'
```

**预期响应：**
```json
{
  "error": "Server configuration error"
}
```

**终端日志应显示：**
```
❌ CRITICAL: ADMIN_JWT_SECRET not set in production!
```

---

### ✅ 测试10: Admin上传功能不受影响
- [ ] 登录admin账号
- [ ] 尝试上传新小说
- [ ] 小说成功创建，authorId为User.id
- [ ] 前台可以正常显示
- [ ] 点击ButterPicks作者名，能正常跳转到作者页面

**测试步骤：**
1. 登录admin
2. 访问 `/admin/upload`
3. 上传一本测试小说
4. 检查数据库：
   ```sql
   SELECT id, title, authorId, authorName
   FROM "Novel"
   ORDER BY "createdAt" DESC
   LIMIT 1;
   ```
5. 前台访问小说详情页
6. 点击作者名"ButterPicks"
7. 验证跳转到作者页面且显示正常

---

## 🔒 安全验证

### ✅ 安全检查1: 源代码中无密码泄露
- [ ] `src/app/api/admin/login/route.ts` 中没有硬编码的密码
- [ ] `src/components/admin/AdminLoginForm.tsx` 中没有显示密码

**验证：**
```bash
# 搜索敏感信息
grep -r "mySecretPassword123" src/
grep -r '$2b$10$Uv8oQom' src/
grep -r "Demo Credentials" src/

# 应该都没有结果
```

---

### ✅ 安全检查2: 环境变量保护
- [ ] `.env` 文件在 `.gitignore` 中
- [ ] `ADMIN_JWT_SECRET` 未提交到Git

**验证：**
```bash
# 检查.gitignore
grep ".env" .gitignore

# 检查Git历史（不应该有ADMIN_JWT_SECRET）
git log -p | grep "ADMIN_JWT_SECRET"
```

---

### ✅ 安全检查3: 密码hash安全
- [ ] 使用bcrypt算法（不是MD5/SHA1）
- [ ] bcrypt rounds >= 10
- [ ] 密码hash长度为60字符

**验证SQL：**
```sql
SELECT
  email,
  LEFT(password, 7) as hash_prefix,
  LENGTH(password) as hash_length
FROM "AdminProfile"
WHERE email = 'admin@butternovel.com';
```

**预期结果：**
```
email                 | hash_prefix | hash_length
admin@butternovel.com | $2b$10$     | 60
```

---

## 📊 测试总结

完成测试后，请填写：

- [ ] 所有10个功能测试通过
- [ ] 所有3个安全检查通过
- [ ] Admin上传功能正常
- [ ] 前台显示功能正常
- [ ] 无新的TypeScript错误
- [ ] 无新的运行时错误

**测试环境：**
- Node版本: `_______`
- npm版本: `_______`
- 数据库: PostgreSQL `_______`
- 测试日期: `_______`

**发现的问题：**
```
（记录任何测试中发现的问题）
```

**测试人员签名：** `_______`

---

## 🚀 部署前检查

在部署到生产环境前：

- [ ] 已在.env中设置强随机的ADMIN_JWT_SECRET（至少32字符）
- [ ] 已应用数据库迁移
- [ ] 已设置安全的admin密码（至少12字符，包含特殊字符）
- [ ] 已备份数据库
- [ ] 已测试密码重置流程
- [ ] 已移除所有测试数据

---

**文档版本：** 1.0.0
**最后更新：** 2025-11-15
