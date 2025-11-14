# 用户等级勋章系统

## 📋 功能概述

完整的用户等级勋章系统，包含：
1. **8级勋章系统** - 根据贡献度显示不同等级和炫酷边框
2. **贡献度积分** - 自动追踪用户活动并计算积分
3. **阅读时长统计** - 追踪用户实际阅读时间
4. **Books Read修正** - 只计算真正阅读过章节的小说
5. **完整Profile页面** - 展示用户信息、等级、统计数据和活动记录

## 🎖️ 等级系统

### 等级列表

| 等级 | 名称 | 所需积分 | 边框样式 | 特效 |
|------|------|----------|----------|------|
| Lv1 | 新手读者 | 0-50 | 灰色简单边框 | 无 |
| Lv2 | 活跃读者 | 51-150 | 绿色渐变 | 无 |
| Lv3 | 资深读者 | 151-300 | 蓝色渐变 | 阴影 |
| Lv4 | 书评达人 | 301-600 | 紫色渐变 | 阴影 |
| Lv5 | 文学鉴赏家 | 601-1000 | 粉色渐变 | 光晕+脉冲 |
| Lv6 | 传奇评论家 | 1001-2000 | 黄橙渐变 | 光晕+脉冲 |
| Lv7 | 殿堂级书友 | 2001-5000 | 红橙黄渐变 | 强光晕+脉冲 |
| Lv8 | 终极书虫 | 5001+ | 紫粉红渐变 | 最强光晕+脉冲 |

### 贡献度计算规则

```typescript
发表评论: +3分
发表评分: +5分
回复评论: +2分
发出点赞: +1分
```

## 🔧 技术实现

### 数据库字段

**User表新增字段**：
```prisma
contributionPoints  Int @default(0)  // 贡献度分数
totalReadingMinutes Int @default(0)  // 总阅读时长（分钟）
```

**ReadingSession表**（新增）：
```prisma
model ReadingSession {
  id        String   @id @default(cuid())
  userId    String
  chapterId Int
  startTime DateTime @default(now())
  endTime   DateTime?
  duration  Int      @default(0)
  createdAt DateTime @default(now())
}
```

### 核心组件

#### 1. UserBadge组件
显示带等级边框的圆形头像：

```tsx
import UserBadge from '@/components/user/UserBadge'

<UserBadge
  user={{
    name: user.name,
    avatar: user.avatar,
    contributionPoints: user.contributionPoints,
  }}
  size="xl"  // sm | md | lg | xl
  showLevel={true}
/>
```

#### 2. 阅读时长追踪Hook
自动追踪章节阅读时间：

```tsx
import { useReadingTimeTracker } from '@/hooks/useReadingTimeTracker'

// 在ChapterReader组件中
useReadingTimeTracker(chapter.id)
```

**工作原理**：
- 用户进入章节页面时开始计时
- 每分钟发送一次心跳到服务器
- 用户离开页面时保存最后的阅读时间
- 只追踪登录用户

#### 3. 贡献度自动更新
每次用户活动时自动更新积分：

```typescript
import { updateUserContribution } from '@/lib/contribution'

// 发表评论后
await updateUserContribution(userId, 'comment')  // +3分

// 发表评分后
await updateUserContribution(userId, 'rating')   // +5分

// 回复评论后
await updateUserContribution(userId, 'reply')    // +2分

// 点赞后
await updateUserContribution(userId, 'like')     // +1分
```

### API Endpoints

#### 获取用户Profile
```
GET /api/profile/[userId]
```

返回：
- 用户基本信息
- 贡献度和等级
- 统计数据
- 书架（最近10本）
- 阅读历史（最近10本）
- 评分记录（最近10条）

#### 阅读时长心跳
```
POST /api/reading/heartbeat
Body: { chapterId: number, minutes: number }
```

## 📄 Profile页面

访问路径: `/profile/[userId]`

### 页面结构

**顶部用户信息区**：
- 圆形头像 + 等级勋章边框
- 用户名
- 等级名称和进度条
- 4个关键统计：贡献度、已读小说、总阅读时长、发表评分
- 额外统计：评论、点赞、回复、书架、获赞

**Tab内容区**：
1. **作品** - 用户创作的小说（如果是作家）
2. **书架** - 收藏的小说，网格布局
3. **浏览记录** - 阅读历史，显示读到第几章
4. **点评记录** - 用户的评分和评论

## 🎯 Books Read统计修正

**修正前**：
- 只要进入小说详情页就算"读过"
- 数据不准确

**修正后**：
- 只有在阅读器里真正阅读过章节才算"读过"
- 基于`readingHistory`表统计
- 更准确地反映用户阅读情况

## 🚀 部署说明

### 1. 运行数据库迁移

```bash
npx prisma migrate deploy
```

这会添加：
- User表的`contributionPoints`和`totalReadingMinutes`字段
- ReadingSession表

### 2. 可选：重新计算现有用户的贡献度

如果你有现有用户数据，可以运行批量重新计算：

```typescript
import { recalculateUserContribution } from '@/lib/contribution'

// 重新计算单个用户
await recalculateUserContribution(userId)

// 或者批量处理所有用户
const users = await prisma.user.findMany({ select: { id: true } })
for (const user of users) {
  await recalculateUserContribution(user.id)
}
```

## 🎨 样式说明

**全局CSS动画**（`/src/app/globals.css`）：
```css
@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.02); }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}
```

高等级徽章会自动应用脉冲动画和光晕效果。

## 📝 待办事项

以下功能可以后续添加：

1. ✅ 基础等级系统
2. ✅ 贡献度积分
3. ✅ 阅读时长追踪
4. ✅ Profile页面
5. ⏳ 在评论/评分API中自动调用`updateUserContribution`
6. ⏳ 用户头像旁边显示小勋章（全站统一）
7. ⏳ 等级排行榜
8. ⏳ 成就系统
9. ⏳ 每日登录奖励

## 🐛 已知问题

无

## 📚 参考代码

关键文件位置：
- 等级配置: `/src/lib/user-level.ts`
- UserBadge组件: `/src/components/user/UserBadge.tsx`
- 阅读追踪Hook: `/src/hooks/useReadingTimeTracker.ts`
- 贡献度工具: `/src/lib/contribution.ts`
- Profile API: `/src/app/api/profile/[userId]/route.ts`
- Profile页面: `/src/app/profile/[userId]/page.tsx`
- 阅读心跳API: `/src/app/api/reading/heartbeat/route.ts`
