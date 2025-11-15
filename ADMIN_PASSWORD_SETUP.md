# 🔐 Admin Password Setup Guide

## 安全改进说明

之前的admin密码是硬编码在源代码中的，存在安全风险：
- ❌ 密码hash暴露在Git仓库中
- ❌ Demo密码显示在登录页面UI中
- ❌ 无法动态修改密码

**现在已修复为数据库存储方式：**
- ✅ 密码存储在数据库的`admin_profile`表中
- ✅ 移除了UI中的demo密码提示
- ✅ 生产环境强制要求设置`ADMIN_JWT_SECRET`环境变量
- ✅ 可以随时通过脚本更新密码

---

## 🚀 完整设置流程

### 步骤1: 更新数据库Schema

首先，需要应用数据库迁移来添加`password`字段到`admin_profile`表：

```bash
# 方法A：使用Prisma CLI（推荐）
npx prisma db push

# 方法B：手动执行SQL迁移
# 连接到你的PostgreSQL数据库，执行以下SQL：
# ALTER TABLE "AdminProfile" ADD COLUMN IF NOT EXISTS "password" TEXT;
```

### 步骤2: 设置Admin密码

运行密码设置脚本：

```bash
node scripts/set-admin-password.js
```

**脚本会引导你完成以下操作：**
1. ✅ 检查admin profile是否存在
2. 🔑 输入新密码（要求：至少8位，包含大小写字母和数字）
3. 🔑 确认密码
4. 🔐 自动使用bcrypt加密
5. 💾 更新到数据库

**示例输出：**
```
╔═══════════════════════════════════════╗
║   🔐 Admin Password Setup Utility    ║
║         ButterNovel Platform          ║
╚═══════════════════════════════════════╝

📋 Step 1: Checking admin profile...
✓ Found admin profile: admin@butternovel.com
   Display Name: ButterPicks

📋 Step 2: Set new password
Password requirements:
  • At least 8 characters long
  • Contains uppercase and lowercase letters
  • Contains at least one number

Enter new password: ********
Confirm password: ********

📋 Step 3: Hashing password...
✓ Password hashed successfully

📋 Step 4: Updating database...
✓ Password updated in database

╔═══════════════════════════════════════╗
║        ✅ Success!                    ║
║   Password updated successfully       ║
╚═══════════════════════════════════════╝

You can now login with:
  Email: admin@butternovel.com
  Password: [your new password]
```

### 步骤3: 设置环境变量（生产环境必须）

在`.env`文件中添加JWT密钥：

```bash
# 生成一个安全的随机密钥（至少32字符）
ADMIN_JWT_SECRET="your-super-secret-jwt-key-min-32-characters-change-this"
```

**生成随机密钥的方法：**
```bash
# 方法1: 使用Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法2: 使用OpenSSL
openssl rand -hex 32

# 方法3: 在线生成
# https://randomkeygen.com/
```

### 步骤4: 测试登录

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问admin登录页面：
   ```
   http://localhost:3000/admin/login
   ```

3. 使用新密码登录：
   - Email: `admin@butternovel.com`
   - Password: `[你设置的新密码]`

---

## 📝 密码要求

为了安全，新密码必须满足以下要求：

- ✅ 至少8个字符
- ✅ 包含至少1个小写字母 (a-z)
- ✅ 包含至少1个大写字母 (A-Z)
- ✅ 包含至少1个数字 (0-9)

**推荐密码示例格式：**
- `MySecure2024Pass!`
- `ButterNovel@2024`
- `Admin!Secure99`

---

## 🔄 更新密码

如果需要更改密码，只需重新运行设置脚本：

```bash
node scripts/set-admin-password.js
```

脚本会覆盖旧密码，设置新密码。

---

## 🛠 故障排查

### 问题1: 数据库连接失败

**错误信息：**
```
❌ Error: P1001: Can't reach database server
```

**解决方法：**
1. 检查`.env`文件中的`DATABASE_URL`是否正确
2. 确保数据库服务正在运行
3. 检查网络连接和防火墙设置

### 问题2: Admin profile不存在

**错误信息：**
```
❌ Error: Admin profile not found in database!
```

**解决方法：**
手动在数据库中创建admin profile：

```sql
INSERT INTO "AdminProfile" (email, "displayName", "createdAt", "updatedAt")
VALUES (
  'admin@butternovel.com',
  'ButterPicks',
  NOW(),
  NOW()
);
```

### 问题3: 登录时提示"Password not configured"

**原因：** 数据库中的`password`字段为空

**解决方法：** 运行密码设置脚本
```bash
node scripts/set-admin-password.js
```

### 问题4: JWT错误（生产环境）

**错误信息：**
```
❌ CRITICAL: ADMIN_JWT_SECRET not set in production!
```

**解决方法：** 在生产环境的`.env`文件中设置`ADMIN_JWT_SECRET`

---

## 🔒 安全最佳实践

1. **定期更换密码**
   - 建议每3-6个月更换一次admin密码
   - 使用密码管理器（如1Password、LastPass）存储

2. **JWT Secret保护**
   - 永远不要将`ADMIN_JWT_SECRET`提交到Git
   - 确保`.env`文件在`.gitignore`中
   - 生产环境使用强随机密钥（至少32字符）

3. **访问控制**
   - 限制admin登录页面的IP访问（在Nginx/Cloudflare配置）
   - 考虑添加双因素认证(2FA)
   - 监控登录失败次数，实施速率限制

4. **数据库安全**
   - 定期备份数据库
   - 限制数据库访问权限
   - 使用SSL/TLS连接数据库

---

## 📚 相关文件

### 修改的文件：
- `prisma/schema.prisma` - 添加password字段到AdminProfile
- `src/app/api/admin/login/route.ts` - 从数据库读取admin账号
- `src/components/admin/AdminLoginForm.tsx` - 移除demo密码提示

### 新增的文件：
- `scripts/set-admin-password.js` - 密码设置工具
- `prisma/migrations/add_admin_password_field.sql` - 数据库迁移文件
- `ADMIN_PASSWORD_SETUP.md` - 本设置指南

---

## 📞 支持

如果遇到问题：
1. 检查本文档的"故障排查"部分
2. 查看终端错误信息
3. 检查数据库连接和admin_profile表是否存在

---

**最后更新：** 2025-11-15
**版本：** 1.0.0
