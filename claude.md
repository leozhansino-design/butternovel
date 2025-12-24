# ButterNovel - Claude 开发参考文档

> **快速参考**: 每次开发前必读

**最后更新**: 2025-12-24
**当前阶段**: 📱 手机版 App 开发 (Flutter)
**目标平台**: Google Play + App Store
**移动端分支**: `claude/setup-expo-mobile-app-psVwF`

---

## 目录

1. [项目概述](#1-项目概述)
2. [移动端 App (Flutter)](#2-移动端-app-flutter)
3. [现有 API 详细列表](#3-现有-api-详细列表)
4. [数据库模型](#4-数据库模型)
5. [开发流程](#5-开发流程)

---

## 1. 项目概述

### 1.1 产品定位

**ButterNovel 手机版** - 短篇小说阅读与创作 App

**核心特点**:
| 特点 | 说明 |
|------|------|
| 只做短篇 | 15,000-50,000 字符 |
| 不要封面 | 纯文字卡片展示 |
| 抖音式推荐 | For You 垂直滑动 |
| 人人可创作 | 一个账号 = 读者 + 作者 |
| 保留评论 | 段落评论 + 书籍评分 |

### 1.2 仓库结构

```
butternovel/                 # 主仓库
├── src/                     # Next.js Web 端代码
├── prisma/                  # 数据库 Schema
├── flutter_app/             # 📱 Flutter 移动端 App
│   ├── lib/
│   │   ├── main.dart        # 入口
│   │   ├── models/          # 数据模型
│   │   ├── providers/       # 状态管理
│   │   ├── screens/         # 页面
│   │   ├── services/        # API 服务
│   │   └── widgets/         # 组件
│   └── pubspec.yaml         # 依赖配置
├── mobile/                  # (旧) Expo 项目，已弃用
└── claude.md                # 本文档
```

---

## 2. 移动端 App (Flutter)

### 2.1 技术栈

| 技术 | 用途 |
|------|------|
| Flutter 3.x | 跨平台框架 |
| Provider | 状态管理 |
| http | HTTP 请求 |
| Google Fonts | 字体 |
| shared_preferences | 本地存储 |

### 2.2 底部导航 (5 Tabs)

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ For You │Following│   ➕    │Bookshelf│ Profile │
│  推荐   │  关注   │  创作   │   书架   │   我的  │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

- Tab 栏**只有文字**，无图标
- 中间 **+** 是蓝色大号按钮

### 2.3 For You 页面 (TikTok 风格)

```
┌─────────────────────────────────┐
│        For You                  │  ← 顶部标题
├─────────────────────────────────┤
│                                 │
│   [Genre Tag]                   │
│                                 │
│   「Story Title」               │
│   By Author Name                │
│                                 │
│   Preview of the story content  │
│   showing first few lines...    │
│                                 │
│   1.2K views · 89 likes         │
│                                 │
│   [Read Full Story]  ♡  ↗       │
│                                 │
│                     ♡ 89        │  ← 右侧操作
│                     💬 0        │
│                     🔖 Save     │
│                     ↗ Share    │
└─────────────────────────────────┘
     ↑ 上滑下一个 / 下滑上一个
```

### 2.4 主题颜色

- **主色**: `#3b82f6` (蓝色)
- **背景**: 黑色 (#000000)
- **文字**: 白色/灰色

### 2.5 启动开发

```bash
cd flutter_app
flutter pub get
flutter run -d chrome      # 浏览器测试
flutter run -d android     # Android 设备
flutter run -d ios         # iOS 设备 (Mac)
```

### 2.6 API 配置

修改 `lib/services/api_service.dart`:

```dart
// 生产环境
static const String baseUrl = 'https://butternovel.vercel.app';

// 本地开发
// static const String baseUrl = 'http://localhost:3000';
```

---

## 3. 现有 API 详细列表

### 3.1 移动端专用 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/mobile/shorts` | GET | 短篇列表 |
| `/api/mobile/shorts/[id]` | GET | 短篇详情 |

**查询条件**: `isShortNovel=true, isPublished=true, isBanned=false`

### 3.2 认证 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 认证 |
| `/api/auth/register` | POST | 邮箱注册 |

### 3.3 短篇小说 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/shorts/[id]/recommend` | POST | 点赞/取消点赞 |
| `/api/shorts/[id]/recommend-status` | GET | 检查点赞状态 |

### 3.4 段落评论 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/paragraph-comments` | GET/POST | 获取/发表评论 |
| `/api/paragraph-comments/[id]/replies` | GET/POST | 获取/发表回复 |
| `/api/paragraph-comments/[id]/like` | POST/DELETE | 点赞/取消 |

### 3.5 评分 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/novels/[id]/rate` | POST | 提交评分 |
| `/api/novels/[id]/ratings` | GET | 获取评分列表 |
| `/api/novels/[id]/user-rating` | GET | 获取当前用户评分 |

### 3.6 书架 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/library` | GET/POST/DELETE | 书架操作 |
| `/api/library/check` | GET | 检查是否在书架 |

### 3.7 关注 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/user/follow` | POST/DELETE | 关注/取关 |
| `/api/user/follow-status` | GET | 检查关注状态 |

---

## 4. 数据库模型

### 4.1 Novel（小说）关键字段

```prisma
model Novel {
  id              Int      @id
  title           String
  blurb           String   @db.Text
  isShortNovel    Boolean  @default(false)
  shortNovelGenre String?
  readingPreview  String?  @db.Text
  wordCount       Int      @default(0)
  viewCount       Int      @default(0)
  likeCount       Int      @default(0)
  averageRating   Float?
  authorId        String
  authorName      String
  isPublished     Boolean  @default(false)
  isBanned        Boolean  @default(false)
}
```

### 4.2 短篇分类 (16个)

```
sweet-romance, billionaire-romance, face-slapping, revenge,
rebirth, regret, healing-redemption, true-fake-identity,
substitute, age-gap, entertainment-circle, group-pet,
lgbtq, quick-transmigration, survival-apocalypse, system
```

---

## 5. 开发流程

### 5.1 分支规范

- **移动端开发分支**: `claude/setup-expo-mobile-app-psVwF`
- 所有移动端更改都推送到这个分支
- 完成后合并到 master

### 5.2 Flutter 开发命令

```bash
# 获取依赖
flutter pub get

# 运行 (选择设备)
flutter run

# 热重载
r  # 在运行中按 r

# 构建发布版
flutter build apk --release    # Android
flutter build ios --release    # iOS
```

### 5.3 提交到应用商店

#### Google Play
```
1. 注册开发者账号 ($25)
2. flutter build appbundle --release
3. 在 Play Console 创建应用
4. 上传 AAB 文件
5. 提交审核
```

#### App Store
```
1. 注册开发者账号 ($99/年)
2. flutter build ios --release
3. 在 App Store Connect 创建应用
4. 用 Xcode 上传
5. 提交审核
```

---

## 重要提醒

1. **Apple 登录必须**: iOS 上架强制要求
2. **主题色蓝色**: #3b82f6，不要黄色
3. **Tab 栏无图标**: 只有文字，中间 + 是大号按钮
4. **推送时不创建 md 文件**: 除非明确要求

---

**📱 让短篇阅读触手可及**
