import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://butternovel.vercel.app";

async function getToken() {
  try {
    return await SecureStore.getItemAsync("access_token");
  } catch {
    return null;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

// API functions
export const getShorts = (params?: { page?: number; genre?: string }) =>
  apiClient<{ data: Novel[] }>(`/api/shorts?${new URLSearchParams(params as any)}`);

export const rateNovel = (novelId: number, score: number, review?: string) =>
  apiClient(`/api/novels/${novelId}/rate`, { method: "POST", body: JSON.stringify({ score, review }) });

// Types
export interface Novel {
  id: number;
  title: string;
  blurb: string;
  authorName: string;
  shortNovelGenre: string;
  likeCount: number;
  averageRating?: number;
}
