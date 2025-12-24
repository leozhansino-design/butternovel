# ButterNovel - Claude Development Reference

> **Quick Reference**: Read before every development session

**Last Updated**: 2025-12-24
**Current Phase**: Mobile App Development (Flutter)
**Target Platforms**: Google Play + App Store
**Mobile Branch**: `claude/setup-expo-mobile-app-psVwF`
**Production URL**: `https://butternovel.com`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Mobile App (Flutter)](#2-mobile-app-flutter)
3. [API Reference](#3-api-reference)
4. [Database Models](#4-database-models)
5. [Development Workflow](#5-development-workflow)

---

## 1. Project Overview

### 1.1 Product Vision

**ButterNovel Mobile** - Short Novel Reading & Creation App

**Core Features**:
| Feature | Description |
|---------|-------------|
| Short Only | 15,000-50,000 characters |
| No Covers | Pure text card display |
| TikTok-style | For You vertical scroll |
| Everyone Creates | One account = Reader + Author |
| Comments | Paragraph comments + Book ratings |

### 1.2 Repository Structure

```
butternovel/                 # Main repository
├── src/                     # Next.js Web code
├── prisma/                  # Database Schema
├── flutter_app/             # Flutter Mobile App
│   ├── lib/
│   │   ├── main.dart        # Entry point
│   │   ├── models/          # Data models
│   │   ├── providers/       # State management
│   │   ├── screens/         # Screens
│   │   ├── services/        # API services
│   │   └── widgets/         # Components
│   └── pubspec.yaml         # Dependencies
├── mobile/                  # (Old) Expo project, deprecated
└── claude.md                # This document
```

---

## 2. Mobile App (Flutter)

### 2.1 Tech Stack

| Technology | Purpose |
|------------|---------|
| Flutter 3.x | Cross-platform framework |
| Provider | State management |
| http | HTTP requests |
| Google Fonts | Typography |
| shared_preferences | Local storage |

### 2.2 Bottom Navigation (5 Tabs)

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ For You │Following│    +    │Bookshelf│ Profile │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

- Tab bar has **text only**, no icons
- Center **+** is a large blue button

### 2.3 For You Page (TikTok-style)

```
┌─────────────────────────────────┐
│  For You              [Search]  │  ← Header with search
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
│                     ♡ 89        │  ← Side actions
│                     💬 0        │
│                     🔖 Save     │
│                     ↗ Share    │
└─────────────────────────────────┘
     ↑ Swipe up/down to navigate
```

### 2.4 Theme Colors

- **Primary**: `#3b82f6` (Blue)
- **Background**: Black (#000000)
- **Text**: White/Grey

### 2.5 Getting Started

```bash
cd flutter_app
flutter pub get
flutter run -d chrome      # Browser testing
flutter run -d android     # Android device
flutter run -d ios         # iOS device (Mac only)
```

### 2.6 API Configuration

Edit `lib/services/api_service.dart`:

```dart
// Production
static const String baseUrl = 'https://butternovel.com';

// Local development
// static const String baseUrl = 'http://localhost:3000';
```

---

## 3. API Reference

### 3.1 Mobile API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/mobile/shorts` | GET | Short novels list |
| `/api/mobile/shorts/[id]` | GET | Short novel details |

**Query filters**: `isShortNovel=true, isPublished=true, isBanned=false`

### 3.2 Authentication API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth authentication |
| `/api/auth/register` | POST | Email registration |

### 3.3 Short Novel API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/shorts/[id]/recommend` | POST | Like/Unlike |
| `/api/shorts/[id]/recommend-status` | GET | Check like status |

### 3.4 Paragraph Comments API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/paragraph-comments` | GET/POST | Get/Post comments |
| `/api/paragraph-comments/[id]/replies` | GET/POST | Get/Post replies |
| `/api/paragraph-comments/[id]/like` | POST/DELETE | Like/Unlike |

### 3.5 Rating API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/novels/[id]/rate` | POST | Submit rating |
| `/api/novels/[id]/ratings` | GET | Get ratings list |
| `/api/novels/[id]/user-rating` | GET | Get current user rating |

### 3.6 Library API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/library` | GET/POST/DELETE | Library operations |
| `/api/library/check` | GET | Check if in library |

### 3.7 Follow API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/user/follow` | POST/DELETE | Follow/Unfollow |
| `/api/user/follow-status` | GET | Check follow status |

---

## 4. Database Models

### 4.1 Novel Model (Key Fields)

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

### 4.2 Short Novel Genres (16 total)

```
sweet-romance, billionaire-romance, face-slapping, revenge,
rebirth, regret, healing-redemption, true-fake-identity,
substitute, age-gap, entertainment-circle, group-pet,
lgbtq, quick-transmigration, survival-apocalypse, system
```

---

## 5. Development Workflow

### 5.1 Branch Convention

- **Mobile development branch**: `claude/setup-expo-mobile-app-psVwF`
- All mobile changes push to this branch
- Merge to master when complete

### 5.2 Flutter Commands

```bash
# Get dependencies
flutter pub get

# Run (select device)
flutter run

# Hot reload
r  # Press r while running

# Build release
flutter build apk --release    # Android
flutter build ios --release    # iOS
```

### 5.3 App Store Submission

#### Google Play
```
1. Register developer account ($25)
2. flutter build appbundle --release
3. Create app in Play Console
4. Upload AAB file
5. Submit for review
```

#### App Store
```
1. Register developer account ($99/year)
2. flutter build ios --release
3. Create app in App Store Connect
4. Upload with Xcode
5. Submit for review
```

---

## Important Reminders

1. **Apple Sign-In Required**: Mandatory for iOS App Store
2. **Theme Color Blue**: #3b82f6, no yellow
3. **Tab Bar No Icons**: Text only, center + is large button
4. **No MD Files**: Don't create markdown files unless requested
5. **English UI**: All app text should be in English

---

**Making short stories accessible everywhere**
