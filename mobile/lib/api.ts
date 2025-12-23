import * as SecureStore from "expo-secure-store";

// API base URL - change this to your production URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";

// Get stored token
async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

// Store token
export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

// Remove token
export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

// API client
async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============ API Functions ============

// Shorts / Stories
export async function getShorts(params?: {
  page?: number;
  limit?: number;
  genre?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.genre) searchParams.set("genre", params.genre);

  return apiClient<{
    novels: Novel[];
    pagination: { total: number; page: number; limit: number };
  }>(`/api/shorts?${searchParams}`);
}

export async function getShortById(id: number) {
  return apiClient<Novel>(`/api/shorts/${id}`);
}

export async function likeShort(id: number, isLiked: boolean) {
  return apiClient<{ success: boolean }>(`/api/shorts/${id}/recommend`, {
    method: "POST",
    body: JSON.stringify({ isLiked }),
  });
}

// Paragraph Comments
export async function getParagraphComments(params: {
  novelId: number;
  chapterId: number;
  paragraphIndex: number;
}) {
  const searchParams = new URLSearchParams({
    novelId: String(params.novelId),
    chapterId: String(params.chapterId),
    paragraphIndex: String(params.paragraphIndex),
  });
  return apiClient<{ comments: ParagraphComment[] }>(
    `/api/paragraph-comments?${searchParams}`
  );
}

export async function createParagraphComment(data: {
  novelId: number;
  chapterId: number;
  paragraphIndex: number;
  content: string;
  parentId?: string;
}) {
  return apiClient<{ comment: ParagraphComment }>("/api/paragraph-comments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function likeParagraphComment(commentId: string) {
  return apiClient<{ success: boolean }>(
    `/api/paragraph-comments/${commentId}/like`,
    { method: "POST" }
  );
}

export async function unlikeParagraphComment(commentId: string) {
  return apiClient<{ success: boolean }>(
    `/api/paragraph-comments/${commentId}/like`,
    { method: "DELETE" }
  );
}

// Ratings
export async function rateNovel(novelId: number, score: number, review?: string) {
  return apiClient<{ rating: Rating }>(`/api/novels/${novelId}/rate`, {
    method: "POST",
    body: JSON.stringify({ score, review }),
  });
}

export async function getNovelRatings(novelId: number) {
  return apiClient<{ ratings: Rating[]; average: number; count: number }>(
    `/api/novels/${novelId}/ratings`
  );
}

export async function getUserRating(novelId: number) {
  return apiClient<{ rating: Rating | null }>(`/api/novels/${novelId}/user-rating`);
}

// Follow
export async function followUser(userId: string) {
  return apiClient<{ success: boolean }>("/api/user/follow", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function unfollowUser(userId: string) {
  return apiClient<{ success: boolean }>("/api/user/follow", {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });
}

export async function getFollowStatus(userId: string) {
  return apiClient<{ isFollowing: boolean }>(`/api/user/follow-status?userId=${userId}`);
}

// Library / Bookshelf
export async function getLibrary() {
  return apiClient<{ items: LibraryItem[] }>("/api/library");
}

export async function addToLibrary(novelId: number) {
  return apiClient<{ success: boolean }>("/api/library", {
    method: "POST",
    body: JSON.stringify({ novelId }),
  });
}

export async function removeFromLibrary(novelId: number) {
  return apiClient<{ success: boolean }>("/api/library", {
    method: "DELETE",
    body: JSON.stringify({ novelId }),
  });
}

// Search
export async function searchNovels(query: string, limit = 20) {
  return apiClient<{ results: Novel[] }>(
    `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
}

// ============ Types ============

export interface Novel {
  id: number;
  title: string;
  description?: string;
  content?: string;
  genre: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  likeCount: number;
  viewCount: number;
  commentCount: number;
  rating?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParagraphComment {
  id: string;
  novelId: number;
  chapterId: number;
  paragraphIndex: number;
  content: string;
  likeCount: number;
  replyCount: number;
  userId: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  parentId?: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  score: number;
  review?: string;
  likeCount: number;
  userId: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  novelId: number;
  createdAt: string;
}

export interface LibraryItem {
  id: string;
  novelId: number;
  novel: Novel;
  progress: number;
  lastReadAt: string;
  createdAt: string;
}
