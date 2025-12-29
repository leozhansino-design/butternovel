# ButterNovel - Claude Development Reference

> **Quick Reference**: Read before every development session

**Last Updated**: 2025-12-29
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
- [x] **Android real device build & testing** (Dec 24)
- [x] App icon with ButterNovel logo
- [x] Reading screen with full content loading from API
- [x] UI refinement: title at top, tags next to author, actions at bottom
- [x] Preview text no-scroll (shows max content based on screen)
- [x] Removed For You header overlay (only search icon remains)
- [x] Improved reading screen loading UX (shows preview while loading full content)
- [x] View tracking API integration (same logic as web: 1 user/IP max 5 views/day)
- [x] Swipe indicator on action buttons row
- [x] Search icon moved to author row (to avoid blocking content)
- [x] **Dynamic preview text sizing** - LayoutBuilder calculates maxLines based on screen size
- [x] **Extended preview content** - API returns up to 5000 chars from first chapter (Dec 25)
- [x] **Genre screen** - List cards with horizontal genre filter chips (Dec 29)
- [x] **Search functionality** - Search page with keyword search
- [x] **Paragraph comments** - Comment bubbles inline with text, replies support
- [x] **Rating system** - Star rating with average display
- [x] **Reader settings** - Background color, font size, comment bubbles toggle
- [x] **Recommendations** - "You may also like" section after story
- [x] **User Authentication** - AuthProvider with login state management (Dec 29)
- [x] **Login Screen** - Email/password login with form validation
- [x] **Social Login UI** - Google and Apple sign-in buttons
- [x] **Login Modal Flow** - Like/Share/Bookshelf require login, navigate to LoginScreen
- [x] **Share functionality** - Native share sheet using share_plus
- [x] **Like toggle UI** - Heart icon toggles red/outline with count update

### In Progress
- [ ] **Google Sign-In** - Configured, testing after flutter clean (MissingPluginException fix)
- [ ] **Apple Sign-In** - Configured, needs iOS device testing

### Pending
- [ ] Like API integration (currently UI-only, needs backend persist)
- [ ] Bookshelf API integration (add/remove from library)
- [ ] Following page with followed authors
- [ ] Profile page with user data
- [ ] Create story functionality
- [ ] App store submission

---

## 2. 2-Week Roadmap

### Week 1 (Dec 24 - Dec 31) - MOSTLY COMPLETE
| Day | Tasks | Status |
|-----|-------|--------|
| Day 1-2 | Reading screen, story detail view | DONE |
| Day 3-4 | User authentication (login/register) | DONE |
| Day 5-6 | Like, save, and bookshelf functionality | IN PROGRESS |
| Day 7 | Following page, author profiles | PENDING |

### Week 2 (Jan 1 - Jan 7)
| Day | Tasks | Status |
|-----|-------|--------|
| Day 8-9 | Profile page, settings | PENDING |
| Day 10-11 | Create story, publish flow | PENDING |
| Day 12 | Search functionality | DONE |
| Day 13 | Testing, bug fixes | PENDING |
| Day 14 | Build release, submit to stores | PENDING |

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
| google_sign_in | Google authentication |
| google_sign_in_web | Google auth for web |
| sign_in_with_apple | Apple authentication |
| share_plus | Native share functionality |
| crypto | SHA256 for Apple Sign-In nonce |

### 3.2 Authentication Flow

```
User taps Like/Share/Bookshelf
         ↓
Check AuthProvider.isLoggedIn
         ↓
    ┌────┴────┐
    ↓         ↓
Not Logged   Logged In
    ↓         ↓
Navigate    Perform
to Login    Action
    ↓
Login Success → Pop(true) → Perform Action
```

**Key Files:**
- `lib/providers/auth_provider.dart` - Auth state management
- `lib/screens/login_screen.dart` - Login UI with social login
- `lib/widgets/short_novel_card.dart` - Home page with login check
- `lib/screens/short_detail_screen.dart` - Reader with login check

### 3.3 Google Sign-In Configuration

**For Web** (index.html):
```html
<meta name="google-signin-client_id" content="YOUR_CLIENT_ID">
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

**Google Cloud Console Setup:**
1. Add authorized JavaScript origins: `http://localhost:60990`
2. Add redirect URIs if needed
3. Run Flutter with fixed port: `flutter run -d chrome --web-port=60990`

### 3.4 Bottom Navigation (5 Tabs)

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ For You │Following│    +    │Bookshelf│ Profile │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

- Tab bar has **text only**, no icons
- Center **+** is a large blue button

### 3.5 For You Page (TikTok-style)

```
┌─────────────────────────────────┐
│  Story Title Here (2 lines max) │  ← Title at top
│  by Author Name [Tag]      🔍   │  ← Author + tag + search icon
│                                 │
│  Preview of the story content   │
│  dynamically fills available    │
│  space using LayoutBuilder      │
│  (calculates maxLines based on  │
│  actual screen height)...       │
│                                 │
│  1.2K views · 89 likes · chars  │
│                                 │
│ [Like][Comment][Save][Share][↕] │  ← Actions + swipe indicator
│  [      Start Reading         ] │  ← Primary action button
└─────────────────────────────────┘
     ↑ Swipe up/down to navigate
```

### 3.6 Reader Screen Actions

All actions require login:
- **Like** - Toggles heart, updates count (needs API persist)
- **Share** - Opens native share sheet with title/author
- **Start Reading/Bookshelf** - Adds to user's library (needs API)

### 3.7 Theme Colors

- **Primary**: `#3b82f6` (Blue)
- **Background**: Black (#000000)
- **Text**: White/Grey
- **Like Active**: Red

### 3.8 Getting Started

```bash
cd flutter_app
flutter pub get
flutter run -d chrome --web-port=60990  # Browser (fixed port for Google)
flutter run -d android                   # Android device
flutter run -d ios                       # iOS device (Mac only)
```

### 3.9 API Configuration

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

# Clean build (fixes MissingPluginException)
flutter clean
flutter pub get

# Run (select device)
flutter run
flutter run -d chrome --web-port=60990  # Fixed port for Google Sign-In

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
7. **Google Sign-In Port**: Use `--web-port=60990` for consistent port
8. **Login Required**: Like/Share/Bookshelf actions require login

---

## Deployment Reminder

**IMPORTANT**: When making changes to backend/API code (anything in `src/` folder), remind the user:

> **Deployment Required**: API changes need to be deployed to take effect.
>
> ```bash
> # Merge to master and deploy
> git checkout main
> git merge claude/setup-expo-mobile-app-psVwF
> git push origin main
> ```
>
> Then trigger deployment to production server.

**Backend files that require deployment**:
- `src/app/api/**/*.ts` - API routes
- `src/lib/**/*.ts` - Shared libraries
- `prisma/schema.prisma` - Database schema
- `next.config.js` - Next.js configuration

**Frontend-only changes (Flutter) don't require server deployment**, but need app rebuild.

---

## Known Issues

1. **Google Sign-In MissingPluginException**: Run `flutter clean && flutter pub get` to fix
2. **Port mismatch**: Use `--web-port=60990` to match Google Console config

---

**Making short stories accessible everywhere**
