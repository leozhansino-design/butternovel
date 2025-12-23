# ButterNovel Mobile App

A React Native mobile app for reading short novels, built with Expo SDK 54.

## Features

- TikTok-style vertical scroll for short novels
- 5 Tab navigation: For You, Following, Create (+), Bookshelf, Profile
- Dark theme with blue (#3b82f6) accent color
- Glassmorphism effects using expo-blur

## Tech Stack

- **Framework**: Expo SDK 54
- **Navigation**: Expo Router 4.1
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Effects**: expo-blur for glassmorphism

## Getting Started

1. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Update the API URL in `.env` to point to your backend server

4. Start the development server:
   ```bash
   npm start
   ```

5. Scan the QR code with Expo Go app on your phone

## Development

- `npm start` - Start the Expo development server
- `npm run ios` - Start on iOS simulator
- `npm run android` - Start on Android emulator
- `npm run web` - Start on web browser

## API Endpoints

The mobile app uses these API endpoints from the main ButterNovel backend:

- `GET /api/mobile/shorts` - Fetch list of short novels
- `GET /api/mobile/shorts/[id]` - Fetch short novel details

## Project Structure

```
mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # For You page
│   │   ├── following.tsx  # Following page
│   │   ├── create.tsx     # Create page (+)
│   │   ├── bookshelf.tsx  # Bookshelf page
│   │   └── profile.tsx    # Profile page
│   ├── short/[id].tsx     # Short novel detail
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── lib/                   # Utilities and API
├── store/                 # Zustand stores
└── types/                 # TypeScript types
```
