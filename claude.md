# ButterNovel - Claude Development Reference

> **Quick Reference**: Read before every development session

**Last Updated**: 2025-12-24
**Current Phase**: Mobile App Development (Flutter)
**Target Platforms**: Google Play + App Store
**Mobile Branch**: `claude/setup-expo-mobile-app-psVwF`
**Production URL**: `https://www.butternovel.com`
**Deadline**: 2 weeks (Target: 2025-01-07)

---

## Table of Contents

1. [Development Progress](#1-development-progress)
2. [2-Week Roadmap](#2-2-week-roadmap)
3. [Mobile App (Flutter)](#3-mobile-app-flutter)
4. [API Reference](#4-api-reference)
5. [Database Models](#5-database-models)
6. [Development Workflow](#6-development-workflow)

---

## 1. Development Progress

### Completed
- [x] Flutter project setup with Android configuration
- [x] 5 Tab navigation (For You, Following, +, Bookshelf, Profile)
- [x] For You page with TikTok-style vertical scroll
- [x] API integration with www.butternovel.com
- [x] CORS configuration for mobile API
- [x] Basic UI for all screens
- [x] Dark theme with blue accent (#3b82f6)

### In Progress
- [ ] Short novel detail/reading screen
- [ ] User authentication

### Pending
- [ ] Like/Save functionality
- [ ] Bookshelf with saved stories
- [ ] Following page with followed authors
- [ ] Profile page with user data
- [ ] Create story functionality
- [ ] Search functionality
- [ ] App store submission

---

## 2. 2-Week Roadmap

### Week 1 (Dec 24 - Dec 31)
| Day | Tasks |
|-----|-------|
| Day 1-2 | Reading screen, story detail view |
| Day 3-4 | User authentication (login/register) |
| Day 5-6 | Like, save, and bookshelf functionality |
| Day 7 | Following page, author profiles |

### Week 2 (Jan 1 - Jan 7)
| Day | Tasks |
|-----|-------|
| Day 8-9 | Profile page, settings |
| Day 10-11 | Create story, publish flow |
| Day 12 | Search functionality |
| Day 13 | Testing, bug fixes |
| Day 14 | Build release, submit to stores |

---

## 3. Mobile App (Flutter)

### 3.1 Tech Stack

| Technology | Purpose |
|------------|---------|
| Flutter 3.x | Cross-platform framework |
| Provider | State management |
| http | HTTP requests |
| Google Fonts | Typography |
| shared_preferences | Local storage |

### 3.2 Bottom Navigation (5 Tabs)

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ For You │Following│    +    │Bookshelf│ Profile │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

- Tab bar has **text only**, no icons
- Center **+** is a large blue button

### 3.3 For You Page (TikTok-style)

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
└─────────────────────────────────┘
     ↑ Swipe up/down to navigate
```

### 3.4 Theme Colors

- **Primary**: `#3b82f6` (Blue)
- **Background**: Black (#000000)
- **Text**: White/Grey

### 3.5 Getting Started

```bash
cd flutter_app
flutter pub get
flutter run -d chrome      # Browser testing
flutter run -d android     # Android device
flutter run -d ios         # iOS device (Mac only)
```

### 3.6 API Configuration

Edit `lib/services/api_service.dart`:

```dart
// Production (use www to avoid 308 redirect)
static const String baseUrl = 'https://www.butternovel.com';

// Local development
// static const String baseUrl = 'http://localhost:3000';
```

---

## 4. API Reference

### 4.1 Mobile API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/mobile/shorts` | GET | Short novels list |
| `/api/mobile/shorts/[id]` | GET | Short novel details |

**Query filters**: `isShortNovel=true, isPublished=true, isBanned=false`

### 4.2 Authentication API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth authentication |
| `/api/auth/register` | POST | Email registration |

### 4.3 Short Novel API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/shorts/[id]/recommend` | POST | Like/Unlike |
| `/api/shorts/[id]/recommend-status` | GET | Check like status |

### 4.4 Paragraph Comments API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/paragraph-comments` | GET/POST | Get/Post comments |
| `/api/paragraph-comments/[id]/replies` | GET/POST | Get/Post replies |
| `/api/paragraph-comments/[id]/like` | POST/DELETE | Like/Unlike |

### 4.5 Rating API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/novels/[id]/rate` | POST | Submit rating |
| `/api/novels/[id]/ratings` | GET | Get ratings list |
| `/api/novels/[id]/user-rating` | GET | Get current user rating |

### 4.6 Library API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/library` | GET/POST/DELETE | Library operations |
| `/api/library/check` | GET | Check if in library |

### 4.7 Follow API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/user/follow` | POST/DELETE | Follow/Unfollow |
| `/api/user/follow-status` | GET | Check follow status |

---

## 5. Database Models

### 5.1 Novel Model (Key Fields)

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

### 5.2 Short Novel Genres (16 total)

```
sweet-romance, billionaire-romance, face-slapping, revenge,
rebirth, regret, healing-redemption, true-fake-identity,
substitute, age-gap, entertainment-circle, group-pet,
lgbtq, quick-transmigration, survival-apocalypse, system
```

---

## 6. Development Workflow

### 6.1 Branch Convention

- **Mobile development branch**: `claude/setup-expo-mobile-app-psVwF`
- All mobile changes push to this branch
- Merge to master when complete

### 6.2 Flutter Commands

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

### 6.3 App Store Submission

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
6. **Use www.butternovel.com**: Avoid 308 redirect issues

---

**Making short stories accessible everywhere**
