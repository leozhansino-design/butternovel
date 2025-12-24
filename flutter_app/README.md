# ButterNovel Flutter App

A Flutter mobile app for reading short novels, with TikTok-style vertical scrolling.

## Features

- **5 Tab Navigation**: For You, Following, Create (+), Bookshelf, Profile
- **TikTok-style Feed**: Full-screen vertical swipe to browse short stories
- **Dark Theme**: Blue (#3b82f6) accent color
- **API Integration**: Connects to ButterNovel backend

## Tech Stack

- **Framework**: Flutter 3.x
- **State Management**: Provider
- **HTTP Client**: http package
- **UI**: Material Design 3 with custom dark theme

## Getting Started

### Prerequisites

- Flutter SDK 3.5+
- Android Studio / VS Code with Flutter plugin

### Installation

```bash
cd flutter_app
flutter pub get
flutter run
```

### Run on Different Platforms

```bash
# Chrome (Web)
flutter run -d chrome

# Android device/emulator
flutter run -d android

# iOS simulator (Mac only)
flutter run -d ios
```

## Project Structure

```
flutter_app/
├── lib/
│   ├── main.dart              # App entry point
│   ├── models/                # Data models
│   │   └── short_novel.dart
│   ├── providers/             # State management
│   │   ├── shorts_provider.dart
│   │   └── user_provider.dart
│   ├── screens/               # App screens
│   │   ├── main_screen.dart
│   │   ├── for_you_screen.dart
│   │   ├── following_screen.dart
│   │   ├── create_screen.dart
│   │   ├── bookshelf_screen.dart
│   │   ├── profile_screen.dart
│   │   └── short_detail_screen.dart
│   ├── services/              # API services
│   │   └── api_service.dart
│   └── widgets/               # Reusable widgets
│       └── short_novel_card.dart
└── pubspec.yaml               # Dependencies
```

## API Endpoints

The app uses these backend endpoints:

- `GET /api/mobile/shorts` - Fetch short novels list
- `GET /api/mobile/shorts/[id]` - Fetch short novel details

## Configuration

Update the API base URL in `lib/services/api_service.dart`:

```dart
static const String baseUrl = 'https://your-domain.com';
```

## Building for Release

### Android APK
```bash
flutter build apk --release
```

### iOS (requires Mac)
```bash
flutter build ios --release
```
