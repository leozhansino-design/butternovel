import { create } from "zustand";
import type { User, ShortNovelListItem } from "@/types";

interface AppState {
  // User
  user: User | null;
  isAuthenticated: boolean;

  // Reading
  currentNovelId: number | null;
  readingProgress: Record<number, number>; // novelId -> percentage

  // Library
  bookshelf: number[]; // novelId array
  likedNovels: number[]; // novelId array

  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  setCurrentNovelId: (id: number | null) => void;
  updateReadingProgress: (novelId: number, progress: number) => void;
  addToBookshelf: (novelId: number) => void;
  removeFromBookshelf: (novelId: number) => void;
  toggleLike: (novelId: number) => void;
  isLiked: (novelId: number) => boolean;
  isInBookshelf: (novelId: number) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  currentNovelId: null,
  readingProgress: {},
  bookshelf: [],
  likedNovels: [],

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: () => set({
    user: null,
    isAuthenticated: false,
    bookshelf: [],
    likedNovels: [],
    readingProgress: {},
  }),

  setCurrentNovelId: (id) => set({ currentNovelId: id }),

  updateReadingProgress: (novelId, progress) => set((state) => ({
    readingProgress: {
      ...state.readingProgress,
      [novelId]: progress,
    },
  })),

  addToBookshelf: (novelId) => set((state) => ({
    bookshelf: state.bookshelf.includes(novelId)
      ? state.bookshelf
      : [...state.bookshelf, novelId],
  })),

  removeFromBookshelf: (novelId) => set((state) => ({
    bookshelf: state.bookshelf.filter((id) => id !== novelId),
  })),

  toggleLike: (novelId) => set((state) => ({
    likedNovels: state.likedNovels.includes(novelId)
      ? state.likedNovels.filter((id) => id !== novelId)
      : [...state.likedNovels, novelId],
  })),

  isLiked: (novelId) => get().likedNovels.includes(novelId),

  isInBookshelf: (novelId) => get().bookshelf.includes(novelId),
}));
