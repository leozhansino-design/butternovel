# ButterNovel React Native 开发执行手册

> 从零到上架的完整步骤指南

## 目录

1. [环境准备](#第一步-环境准备)
2. [项目初始化](#第二步-项目初始化)
3. [开发流程](#第三步-开发流程)
4. [测试策略](#第四步-测试策略)
5. [构建发布](#第五步-构建发布)
6. [商店上架](#第六步-商店上架)

---

## 第一步: 环境准备

### 1.1 开发者账号注册 (第1天)

```bash
# ⚠️ 优先完成，审核需要时间！

# Apple Developer Program
# 费用: $99/年
# 网址: https://developer.apple.com/programs/
# 审核时间: 24-48小时

# Google Play Console
# 费用: $25 一次性
# 网址: https://play.google.com/console
# 审核时间: 即时
```

### 1.2 开发环境安装

#### macOS (推荐，可同时开发 iOS + Android)

```bash
# 1. 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装 Node.js (LTS版本)
brew install node@20

# 3. 安装 Watchman (文件监控)
brew install watchman

# 4. 安装 CocoaPods (iOS 依赖管理)
sudo gem install cocoapods

# 5. 安装 Xcode (从 App Store)
# - 打开 Xcode > Settings > Locations > Command Line Tools

# 6. 安装 Android Studio
# - 下载: https://developer.android.com/studio
# - 安装 SDK: Android 14 (API 34)
# - 配置环境变量:
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc

# 7. 安装 EAS CLI (Expo 构建工具)
npm install -g eas-cli

# 8. 登录 Expo
npx expo login
```

#### Windows (仅 Android)

```powershell
# 1. 安装 Node.js LTS
# 下载: https://nodejs.org/

# 2. 安装 Android Studio
# - 下载: https://developer.android.com/studio
# - 安装 SDK: Android 14 (API 34)

# 3. 配置环境变量
# ANDROID_HOME = C:\Users\<用户名>\AppData\Local\Android\Sdk
# PATH 添加: %ANDROID_HOME%\platform-tools

# 4. 安装 EAS CLI
npm install -g eas-cli
```

### 1.3 验证环境

```bash
# 验证所有工具已安装
node --version      # 应显示 v20.x.x
npm --version       # 应显示 10.x.x
pod --version       # 应显示 1.x.x (macOS)
eas --version       # 应显示最新版本

# 验证 Android SDK
adb --version
```

---

## 第二步: 项目初始化

### 2.1 创建 Expo 项目

```bash
# 在 butternovel 项目根目录执行
cd /path/to/butternovel

# 创建 mobile 子目录
npx create-expo-app@latest mobile --template blank-typescript

# 进入项目
cd mobile
```

### 2.2 安装核心依赖

```bash
# 导航
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# 状态管理
npm install @tanstack/react-query zustand

# 表单验证 (复用现有逻辑)
npm install react-hook-form @hookform/resolvers zod

# 存储
npx expo install @react-native-async-storage/async-storage expo-secure-store

# 认证
npx expo install expo-auth-session expo-web-browser expo-crypto

# UI 组件
npx expo install react-native-reanimated react-native-gesture-handler
npm install nativewind tailwindcss
npx expo install lucide-react-native react-native-svg

# 图片
npx expo install expo-image expo-image-picker

# 推送通知
npx expo install expo-notifications expo-device expo-constants

# 其他
npx expo install expo-linking expo-status-bar expo-splash-screen
```

### 2.3 配置 NativeWind (Tailwind CSS)

```bash
# 初始化 Tailwind
npx tailwindcss init
```

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        butter: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',  // 主色
          600: '#ca8a04',
          700: '#a16207',
        }
      }
    },
  },
  plugins: [],
}
```

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

### 2.4 项目结构

```bash
# 创建目录结构
mkdir -p app/{auth,novel,reader,library,profile,settings}
mkdir -p components/{ui,forms,novel,reader}
mkdir -p lib/{api,hooks,utils,stores}
mkdir -p assets/{images,fonts}
```

```
mobile/
├── app/                      # 页面 (Expo Router)
│   ├── _layout.tsx          # 根布局
│   ├── index.tsx            # 首页
│   ├── (tabs)/              # Tab 导航
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # 发现
│   │   ├── library.tsx      # 书架
│   │   └── profile.tsx      # 我的
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── novel/
│   │   └── [slug].tsx       # 小说详情
│   ├── reader/
│   │   └── [chapter].tsx    # 阅读器
│   └── search.tsx
├── components/
│   ├── ui/                  # 基础组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Loading.tsx
│   ├── novel/
│   │   ├── NovelCard.tsx
│   │   ├── ChapterList.tsx
│   │   └── RatingStars.tsx
│   └── reader/
│       ├── ReaderView.tsx
│       └── ReaderSettings.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts        # API 客户端
│   │   ├── novels.ts        # 小说 API
│   │   ├── auth.ts          # 认证 API
│   │   └── library.ts       # 书架 API
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useNovel.ts
│   │   └── useLibrary.ts
│   ├── stores/
│   │   ├── authStore.ts     # 认证状态
│   │   └── readerStore.ts   # 阅读器设置
│   └── utils/
│       ├── format.ts        # 从 web 复制
│       └── validators.ts    # 从 web 复制
├── assets/
├── app.json
├── package.json
└── tsconfig.json
```

### 2.5 复制共享代码

```bash
# 从 web 项目复制可复用的代码
cp ../src/lib/validators.ts lib/utils/
cp ../src/lib/format.ts lib/utils/
cp ../src/lib/prisma-types.ts lib/utils/types.ts

# 注意: 需要移除 Next.js 特有的导入
```

### 2.6 配置 EAS Build

```bash
# 初始化 EAS
eas build:configure

# 这会创建 eas.json
```

```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 第三步: 开发流程

### 3.1 API 客户端层 (第1周)

```typescript
// lib/api/client.ts
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://butternovel.com/api';

class ApiClient {
  private token: string | null = null;

  async init() {
    this.token = await SecureStore.getItemAsync('auth-token');
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async setToken(token: string) {
    this.token = token;
    await SecureStore.setItemAsync('auth-token', token);
  }

  async clearToken() {
    this.token = null;
    await SecureStore.deleteItemAsync('auth-token');
  }

  // 便捷方法
  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
```

```typescript
// lib/api/novels.ts
import { api } from './client';

export interface Novel {
  id: number;
  title: string;
  slug: string;
  coverImage: string;
  blurb: string;
  rating: number;
  // ... 其他字段
}

export const novelsApi = {
  // 获取小说详情
  getNovel: (slug: string) =>
    api.get<{ success: boolean; data: Novel }>(`/novels/${slug}`),

  // 获取章节列表
  getChapters: (novelId: number) =>
    api.get<{ success: boolean; data: Chapter[] }>(`/novels/${novelId}/chapters`),

  // 获取章节内容
  getChapter: (novelId: number, chapterNumber: number) =>
    api.get<{ success: boolean; data: Chapter }>(
      `/novels/${novelId}/chapters/${chapterNumber}`
    ),

  // 搜索
  search: (query: string, page = 1) =>
    api.get<SearchResponse>(`/search?q=${query}&page=${page}`),

  // 分类
  getCategories: () =>
    api.get<{ success: boolean; data: Category[] }>('/categories'),

  // 评分
  rateNovel: (novelId: number, score: number, review?: string) =>
    api.post(`/novels/${novelId}/rate`, { score, review }),
};
```

### 3.2 认证模块 (第1周)

```typescript
// lib/stores/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const response = await api.post<{ token: string; user: User }>(
      '/auth/login',
      { email, password }
    );

    await api.setToken(response.token);
    set({ user: response.user, isAuthenticated: true });
  },

  register: async (email, password, name) => {
    const response = await api.post<{ token: string; user: User }>(
      '/auth/register',
      { email, password, name }
    );

    await api.setToken(response.token);
    set({ user: response.user, isAuthenticated: true });
  },

  logout: async () => {
    await api.clearToken();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      await api.init();
      const response = await api.get<{ user: User }>('/profile');
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
```

```typescript
// lib/hooks/useAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.checkAuth();
  }, []);

  return store;
}
```

### 3.3 核心页面开发顺序

#### 阶段 A: 基础框架 (第1-2周)

```
1. app/_layout.tsx       - 根布局 + 导航配置
2. app/(tabs)/_layout.tsx - Tab 导航
3. app/auth/login.tsx    - 登录页
4. app/auth/register.tsx - 注册页
5. components/ui/*       - 基础 UI 组件
```

#### 阶段 B: 发现模块 (第3-4周)

```
1. app/(tabs)/index.tsx  - 首页/发现
2. components/novel/NovelCard.tsx
3. components/novel/CategorySection.tsx
4. app/search.tsx        - 搜索页
5. app/category/[slug].tsx - 分类页
```

#### 阶段 C: 阅读模块 (第5-6周)

```
1. app/novel/[slug].tsx  - 小说详情
2. components/novel/ChapterList.tsx
3. app/reader/[chapter].tsx - 阅读器 ⭐核心
4. components/reader/ReaderView.tsx
5. components/reader/ReaderSettings.tsx
6. lib/stores/readerStore.ts - 阅读器设置
```

#### 阶段 D: 用户模块 (第7-8周)

```
1. app/(tabs)/library.tsx - 书架
2. app/(tabs)/profile.tsx - 个人中心
3. app/settings/*.tsx    - 设置页面
4. components/novel/RatingStars.tsx
5. 评论、点赞功能
```

### 3.4 关键组件示例

```tsx
// components/novel/NovelCard.tsx
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

interface NovelCardProps {
  novel: {
    slug: string;
    title: string;
    coverImage: string;
    rating: number;
  };
}

export function NovelCard({ novel }: NovelCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/novel/${novel.slug}`)}
      className="w-28 mr-3"
    >
      <Image
        source={{ uri: novel.coverImage }}
        className="w-28 h-40 rounded-lg"
        contentFit="cover"
      />
      <Text className="mt-2 text-sm font-medium" numberOfLines={2}>
        {novel.title}
      </Text>
      <Text className="text-xs text-gray-500">
        ⭐ {novel.rating.toFixed(1)}
      </Text>
    </Pressable>
  );
}
```

```tsx
// app/reader/[chapter].tsx
import { useState, useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { novelsApi } from '@/lib/api/novels';
import { useReaderStore } from '@/lib/stores/readerStore';
import { FormattedText } from '@/components/reader/FormattedText';

export default function ReaderScreen() {
  const { chapter: chapterNumber, novelId } = useLocalSearchParams();
  const { fontSize, bgColor, lineHeight } = useReaderStore();

  const { data, isLoading } = useQuery({
    queryKey: ['chapter', novelId, chapterNumber],
    queryFn: () => novelsApi.getChapter(
      Number(novelId),
      Number(chapterNumber)
    ),
  });

  if (isLoading) return <LoadingScreen />;

  const chapter = data?.data;

  return (
    <ScrollView
      className={`flex-1 ${bgColor}`}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text className={`font-bold mb-4 ${fontSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
        Chapter {chapter.chapterNumber}: {chapter.title}
      </Text>

      <FormattedText
        content={chapter.content}
        fontSize={fontSize}
        lineHeight={lineHeight}
      />
    </ScrollView>
  );
}
```

---

## 第四步: 测试策略

### 4.1 开发期间测试

```bash
# 启动开发服务器
cd mobile
npx expo start

# 选择运行方式:
# - 按 i: iOS 模拟器 (macOS)
# - 按 a: Android 模拟器
# - 按 w: Web 浏览器
# - 扫码: 真机 Expo Go
```

### 4.2 真机测试 (Development Build)

```bash
# 构建开发版本 (包含原生模块)
eas build --profile development --platform ios
eas build --profile development --platform android

# 安装到设备后，可热更新调试
```

### 4.3 内测分发

```bash
# 构建预览版 APK (Android)
eas build --profile preview --platform android
# 下载 APK 直接安装

# 构建预览版 (iOS - 需要 TestFlight)
eas build --profile preview --platform ios
eas submit --platform ios
# 在 TestFlight 中邀请测试者
```

### 4.4 自动化测试

```bash
# 安装测试依赖
npm install -D jest @testing-library/react-native

# 运行测试
npm test
```

```typescript
// __tests__/components/NovelCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { NovelCard } from '@/components/novel/NovelCard';

describe('NovelCard', () => {
  it('renders novel title', () => {
    const novel = { slug: 'test', title: 'Test Novel', coverImage: '', rating: 4.5 };
    const { getByText } = render(<NovelCard novel={novel} />);
    expect(getByText('Test Novel')).toBeTruthy();
  });

  it('navigates on press', () => {
    // ... 导航测试
  });
});
```

### 4.5 测试检查清单

```markdown
## 功能测试
- [ ] 登录/注册流程
- [ ] Google/Apple 登录
- [ ] 首页加载
- [ ] 小说详情显示
- [ ] 章节阅读
- [ ] 阅读设置保存
- [ ] 书架添加/删除
- [ ] 搜索功能
- [ ] 评分提交
- [ ] 推送通知

## 兼容性测试
- [ ] iOS 15+
- [ ] Android 10+
- [ ] 不同屏幕尺寸
- [ ] 横竖屏切换
- [ ] 深色模式

## 性能测试
- [ ] 首屏加载 < 3s
- [ ] 页面切换流畅
- [ ] 长列表滚动流畅
- [ ] 内存使用正常

## 网络测试
- [ ] 弱网环境
- [ ] 离线提示
- [ ] 请求超时处理
```

---

## 第五步: 构建发布

### 5.1 准备发布资源

```bash
# 应用图标 (需要 1024x1024 PNG)
# 放置于 assets/icon.png

# 启动画面 (需要 1284x2778 PNG)
# 放置于 assets/splash.png
```

```json
// app.json
{
  "expo": {
    "name": "ButterNovel",
    "slug": "butternovel",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#f5f1e8"
    },
    "ios": {
      "bundleIdentifier": "com.butternovel.app",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "用于上传头像",
        "NSPhotoLibraryUsageDescription": "用于选择头像图片"
      }
    },
    "android": {
      "package": "com.butternovel.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#f5f1e8"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### 5.2 构建生产版本

```bash
# 构建 iOS (需要 Apple Developer 账号)
eas build --profile production --platform ios

# 构建 Android (AAB 格式)
eas build --profile production --platform android

# 同时构建两个平台
eas build --profile production --platform all
```

### 5.3 查看构建状态

```bash
# 查看构建列表
eas build:list

# 查看构建详情
eas build:view
```

---

## 第六步: 商店上架

### 6.1 iOS App Store

#### 准备材料

```markdown
必需材料:
- [ ] 应用名称: ButterNovel
- [ ] 副标题: Free Novels Online
- [ ] 描述 (4000字以内)
- [ ] 关键词 (100字符)
- [ ] 隐私政策 URL
- [ ] 支持 URL
- [ ] 营销 URL (可选)
- [ ] 截图:
  - 6.7" (iPhone 15 Pro Max): 1290 x 2796
  - 6.5" (iPhone 14 Plus): 1284 x 2778
  - 5.5" (iPhone 8 Plus): 1242 x 2208
  - iPad Pro 12.9": 2048 x 2732
- [ ] 应用预览视频 (可选)
- [ ] 分类: 图书
- [ ] 年龄分级: 问卷
- [ ] App Privacy: 数据收集声明
```

#### 提交流程

```bash
# 1. 使用 EAS 提交
eas submit --platform ios

# 或者手动:
# 1. 登录 App Store Connect
# 2. 创建新 App
# 3. 填写信息
# 4. 上传构建 (Transporter 或 Xcode)
# 5. 提交审核
```

#### 审核常见问题

```markdown
1. ❌ 需要 Sign in with Apple
   ✅ 解决: 添加 Apple 登录选项

2. ❌ 隐私政策不完整
   ✅ 解决: 详细说明数据收集和使用

3. ❌ 内容审核问题 (成人内容)
   ✅ 解决: 正确设置年龄分级，添加内容过滤

4. ❌ 崩溃或功能不完整
   ✅ 解决: 充分测试后再提交

5. ❌ 元数据问题 (截图不符)
   ✅ 解决: 截图必须反映真实功能
```

### 6.2 Google Play Store

#### 准备材料

```markdown
必需材料:
- [ ] 应用名称 (30字符)
- [ ] 简短描述 (80字符)
- [ ] 完整描述 (4000字符)
- [ ] 截图:
  - 手机: 至少2张, 16:9 或 9:16
  - 平板 7": 至少1张 (可选)
  - 平板 10": 至少1张 (可选)
- [ ] 高分辨率图标: 512 x 512
- [ ] 置顶大图: 1024 x 500
- [ ] 隐私政策 URL
- [ ] 类别: 图书与工具书
- [ ] 内容分级: 问卷
- [ ] 目标受众和内容
- [ ] 数据安全声明
```

#### 提交流程

```bash
# 1. 使用 EAS 提交
eas submit --platform android

# 或者手动:
# 1. 登录 Google Play Console
# 2. 创建应用
# 3. 填写商品详情
# 4. 上传 AAB 文件
# 5. 设置发布轨道 (内测 > 公测 > 正式)
# 6. 提交审核
```

#### 发布轨道策略

```markdown
建议流程:
1. 内部测试 (Internal testing)
   - 最多 100 个测试者
   - 无需审核，立即可用

2. 封闭测试 (Closed testing)
   - 邀请制测试
   - 需要审核 (通常 < 3天)

3. 开放测试 (Open testing)
   - 任何人可加入
   - 需要审核

4. 正式版 (Production)
   - 分阶段发布 (10% > 50% > 100%)
```

### 6.3 隐私政策模板

```markdown
# ButterNovel 隐私政策

最后更新: [日期]

## 信息收集

我们收集以下信息:
- 账户信息: 邮箱、用户名、头像
- 使用数据: 阅读历史、书架、评分
- 设备信息: 设备型号、操作系统版本

## 信息使用

我们使用您的信息来:
- 提供个性化阅读体验
- 同步阅读进度
- 发送通知 (可选)

## 信息共享

我们不会出售您的个人信息。

## 数据安全

我们采用行业标准安全措施保护您的数据。

## 联系我们

privacy@butternovel.com
```

---

## 时间线总结

```
Week 1-2:   环境准备 + 项目初始化 + API 层
Week 3-4:   首页 + 发现 + 搜索
Week 5-6:   阅读器 (核心功能)
Week 7-8:   书架 + 用户中心
Week 9:     评分评论 + 通知
Week 10-11: 测试 + Bug 修复
Week 12:    构建 + 准备上架材料
Week 13:    提交审核
Week 14:    审核修复 + 正式上线

总计: 14 周 (约 3.5 个月)
```

---

## 常用命令速查

```bash
# 开发
npx expo start                    # 启动开发服务器
npx expo start --clear            # 清除缓存启动
npx expo start --tunnel           # 使用隧道 (远程调试)

# 构建
eas build --profile development   # 开发版
eas build --profile preview       # 预览版
eas build --profile production    # 生产版
eas build:list                    # 查看构建列表

# 提交
eas submit --platform ios         # 提交到 App Store
eas submit --platform android     # 提交到 Google Play

# 更新 (OTA)
eas update --branch production    # 推送 OTA 更新

# 其他
eas device:create                 # 注册测试设备 (iOS)
eas credentials                   # 管理证书和密钥
```
