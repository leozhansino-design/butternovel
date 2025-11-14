# User Badge System - Deployment Guide

## 问题诊断

如果你看不到 badge 系统的任何效果（profile 页面显示和原来一样），原因是：

**数据库迁移还没有运行！**

虽然所有代码都已经实现并提交，但数据库中还没有 badge 系统需要的字段。

## 必须运行的数据库迁移

### 1. 创建并运行迁移

在**生产环境**运行以下命令：

```bash
npx prisma migrate deploy
```

如果在开发环境，运行：

```bash
npx prisma migrate dev --name add_user_badge_system
```

### 2. 验证迁移成功

迁移会添加以下字段到 `User` 表：
- `contributionPoints` (Int, default 0) - 贡献度分数
- `level` (Int, default 1) - 用户等级 (1-8)
- `totalReadingTime` (Int, default 0) - 总阅读时长（分钟）

迁移还会创建两个新表：
- `ContributionLog` - 贡献度记录
- `ReadingSession` - 阅读时长记录

### 3. 重启应用

迁移完成后，重启你的 Next.js 应用：

```bash
# 如果使用 PM2
pm2 restart all

# 如果使用 Vercel/其他平台
# 重新部署或重启服务
```

## 已实现的功能清单

✅ **Badge 系统核心**
- `/src/lib/badge-system.ts` - 8个等级配置、视觉效果
- `/src/lib/contribution.ts` - 贡献度计算逻辑
- `/src/components/badge/UserBadge.tsx` - Badge 显示组件

✅ **Profile 页面**
- `/src/app/profile/page.tsx` - 自己的 profile（需要登录）
- `/src/app/profile/[userId]/page.tsx` - 公开 profile（查看其他用户）
- `/src/components/profile/UserProfile.tsx` - 完整的 profile UI
- `/src/components/profile/PublicUserProfile.tsx` - 公开 profile UI
- `/src/components/profile/RatingsTab.tsx` - 评分记录 tab

✅ **导航集成**
- `UserMenu` 中的 "Profile" 链接到 `/profile`
- Rating 列表中的头像和名字可点击，链接到用户 profile

✅ **API 路由**
- `GET /api/profile` - 获取自己的 profile 数据（含 badge 信息）
- `GET /api/profile/ratings?userId=xxx` - 获取用户评分记录
- `POST /api/chapter-progress` - 标记章节完成，奖励贡献度
- `POST /api/reading-time` - 记录阅读时长
- 所有 rating API 都返回用户的 contributionPoints 和 level

✅ **阅读统计修复**
- Books Read 现在只统计至少完成一个章节的小说
- 不再是进入详情页就算"读过"

✅ **贡献度系统**
- 评分：+10 分
- 评论：+5 分
- 回复评论：+3 分
- 完成章节：+1 分

## 测试功能

迁移完成后，测试以下功能：

### 1. Profile 页面
- 访问 `/profile` 应该显示你的 profile（带 badge 边框的头像）
- 显示统计数据：书架、章节已读、评分数、阅读时长

### 2. Rating 头像
- 在任何小说的 rating 列表中
- 头像应该有彩色边框（根据等级不同）
- 点击头像或用户名应该跳转到该用户的 profile

### 3. 贡献度获取
- 给小说评分应该获得 +10 贡献度
- 评论应该获得 +5 贡献度
- 回复评论应该获得 +3 贡献度
- 读完一个章节应该获得 +1 贡献度

### 4. 等级升级
- 达到以下分数会自动升级：
  - Lv1: 0-50 分
  - Lv2: 51-150 分
  - Lv3: 151-300 分
  - Lv4: 301-600 分
  - Lv5: 601-1000 分
  - Lv6: 1001-2000 分
  - Lv7: 2001-5000 分
  - Lv8: 5000+ 分

## 如果还是看不到效果

1. **清除浏览器缓存**
2. **硬刷新页面** (Ctrl+Shift+R 或 Cmd+Shift+R)
3. **检查浏览器控制台**是否有错误
4. **检查数据库**确认字段已添加：
   ```sql
   SELECT id, name, contributionPoints, level, totalReadingTime 
   FROM "User" 
   LIMIT 5;
   ```

## 已提交的 Commits

所有功能都已经提交到分支 `claude/user-badge-profile-system-01WdKLeobt2BaMV23pGWt66J`：

- `0982ddf` - feat: Implement user badge and profile system
- `e1a7659` - fix: Correct prisma import path in contribution.ts
- `c89df74` - fix: Add missing levelData prefix to badgeStyle reference
- `bb22222` - feat: Add profile pages and integrate badge system
- `14564da` - fix: Add credentials:'include' to all admin API fetch calls

## 联系支持

如果按照上述步骤操作后还是有问题，请检查：
- 数据库连接是否正常
- Prisma Client 是否已重新生成（`npx prisma generate`）
- 应用是否已重启
