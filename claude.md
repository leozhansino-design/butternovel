# ButterNovel - Claude 开发参考文档

> **快速参考**: 每次开发前必读

**最后更新**: 2025-12-23
**项目类型**: Monorepo (Web + Mobile)

---

## 📁 项目结构

```
butternovel/
├── web/                  # Next.js 网页版
│   ├── src/             # 源代码
│   ├── prisma/          # 数据库 Schema
│   ├── public/          # 静态资源
│   └── package.json
│
├── mobile/              # Expo 手机版 (iOS + Android)
│   ├── app/             # Expo Router 页面
│   ├── components/      # React Native 组件
│   ├── lib/             # API 工具
│   ├── stores/          # Zustand 状态
│   └── package.json
│
├── docs/                # 项目文档
└── claude.md            # 此文件
```

---

## 🌐 Web 端

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | PostgreSQL + Prisma |
| 认证 | NextAuth.js (Google OAuth) |
| 缓存 | Upstash Redis |
| 监控 | Sentry |
| 部署 | Vercel |

### 目录结构

```
web/
├── src/
│   ├── app/              # App Router 页面
│   │   ├── api/          # API 路由
│   │   ├── shorts/       # 短篇小说页面
│   │   └── ...
│   ├── components/       # React 组件
│   ├── lib/              # 工具库
│   │   ├── auth.ts       # 认证配置
│   │   ├── prisma.ts     # 数据库客户端
│   │   └── ...
│   └── types/            # TypeScript 类型
├── prisma/
│   └── schema.prisma     # 数据库模型
└── package.json
```

### 运行 Web

```bash
cd web
npm install
npm run dev
# 访问 http://localhost:3000
```

---

## 📱 Mobile 端

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Expo SDK 54 |
| 路由 | Expo Router 6 |
| 样式 | NativeWind (Tailwind) |
| 状态 | Zustand + React Query |
| 认证 | expo-auth-session |
| 存储 | expo-secure-store |

### 目录结构

```
mobile/
├── app/                  # Expo Router 页面
│   ├── (tabs)/          # Tab 导航
│   │   ├── index.tsx    # For You
│   │   ├── following.tsx
│   │   ├── create.tsx
│   │   ├── bookshelf.tsx
│   │   └── profile.tsx
│   ├── reader/[id].tsx  # 阅读器
│   └── auth.tsx         # 登录页
├── components/           # RN 组件
├── lib/
│   └── api.ts           # API 客户端
├── stores/
│   └── auth.ts          # 认证状态
└── package.json
```

### 运行 Mobile

```bash
cd mobile
npm install
npx expo start
# 用 Expo Go App 扫码测试
```

---

## 🔗 共享的后端

Web 和 Mobile **共用同一个后端**：

```
✅ 共享:
├── 数据库（同一个 PostgreSQL）
├── API 端点（web/src/app/api/*）
├── 用户账号
├── 小说数据
├── 评论/评分数据
└── 关注关系

❌ 不共享:
├── UI 组件
└── 样式代码
```

Mobile 通过 HTTP 调用 Web 的 API 端点。

---

## 📝 API 端点列表

### 认证

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 认证 |
| `/api/auth/register` | POST | 邮箱注册 |

### 短篇小说

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/shorts` | GET | 短篇列表 |
| `/api/shorts/[id]` | GET | 短篇详情 |
| `/api/shorts/[id]/recommend` | POST | 点赞/取消 |

### 段落评论

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/paragraph-comments` | GET/POST | 获取/发表评论 |
| `/api/paragraph-comments/[id]/replies` | GET/POST | 回复 |
| `/api/paragraph-comments/[id]/like` | POST/DELETE | 点赞 |

### 评分

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/novels/[id]/rate` | POST | 提交评分 |
| `/api/novels/[id]/ratings` | GET | 评分列表 |
| `/api/novels/[id]/user-rating` | GET | 用户评分 |

### 关注

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/user/follow` | POST/DELETE | 关注/取关 |
| `/api/user/follow-status` | GET | 关注状态 |

### 书架

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/library` | GET/POST/DELETE | 书架管理 |

---

## 🗄️ 数据库模型

### 核心模型

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  googleId  String?  @unique
}

model Novel {
  id              Int      @id
  title           String
  isShortNovel    Boolean  @default(false)
  shortNovelGenre String?
  wordCount       Int
  likeCount       Int
  averageRating   Float?
}

model Rating {
  id        String @id
  score     Int    // 2,4,6,8,10
  review    String?
  userId    String
  novelId   Int
  @@unique([userId, novelId])
}

model ParagraphComment {
  id             String @id
  novelId        Int
  chapterId      Int
  paragraphIndex Int
  content        String
  userId         String
}

model Follow {
  followerId  String
  followingId String
  @@unique([followerId, followingId])
}
```

---

## 📱 Mobile 核心功能

### 底部导航 (5 Tabs)

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ For You │Following│   ➕    │Bookshelf│ Profile │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

### 短篇规格

| 项目 | 说明 |
|------|------|
| 字数 | 15,000-50,000 字符 |
| 封面 | ❌ 不需要，纯文字卡片 |
| 评论 | ✅ 段落评论 |
| 评分 | ✅ 1-5 星 |

### 登录方式

- ✅ Google 登录
- ✅ Apple 登录 (iOS 必须)
- ✅ 邮箱密码

---

## 🛠️ 开发命令

### Web

```bash
cd web
npm run dev          # 开发
npm run build        # 构建
npm run lint         # 检查
npm run test         # 测试
npx prisma studio    # 数据库 GUI
```

### Mobile

```bash
cd mobile
npx expo start       # 开发
npx expo start -c    # 清除缓存启动
eas build            # 构建
eas submit           # 提交商店
```

---

## ⚠️ 开发规范

1. **不要创建多余的 md 文件** - 除非明确要求
2. **共用 API** - Mobile 调用 Web 的 API，不要重复实现
3. **类型共享** - 可以从 web 复制类型定义到 mobile
4. **测试** - 修改 API 后要同时测试 Web 和 Mobile

---

## 📋 开发阶段

```
Phase 1: ✅ 项目搭建
Phase 2: 认证系统 (Google + Apple)
Phase 3: For You 推荐
Phase 4: 阅读器 + 评论 + 评分
Phase 5: 创作功能
Phase 6: 关注系统
Phase 7: 书架 & 个人中心
Phase 8: 通知系统
Phase 9: 优化 & 上架
```

---

**线上地址**: https://butternovel.vercel.app
