import type { ShortNovelListItem, ShortNovel } from "@/types";

// API base URL - update this for production
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export async function fetchShorts(): Promise<ShortNovelListItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/mobile/shorts`);

  if (!response.ok) {
    throw new Error("Failed to fetch shorts");
  }

  const data = await response.json();
  return data.data || [];
}

export async function fetchShortById(id: number): Promise<ShortNovel> {
  const response = await fetch(`${API_BASE_URL}/api/mobile/shorts/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch short novel");
  }

  const data = await response.json();
  return data.data;
}

export async function likeShort(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/shorts/${id}/like`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to like short");
  }
}

export async function saveToBookshelf(novelId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/library`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ novelId }),
  });

  if (!response.ok) {
    throw new Error("Failed to save to bookshelf");
  }
}
