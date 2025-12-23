import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn: (user: User, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  signIn: async (user, token) => {
    await SecureStore.setItemAsync("access_token", token);
    await SecureStore.setItemAsync("user_data", JSON.stringify(user));
    set({ user, isLoading: false });
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("user_data");
    set({ user: null, isLoading: false });
  },
}));
