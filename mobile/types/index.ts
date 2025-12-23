export interface ShortNovel {
  id: number;
  title: string;
  slug: string;
  blurb: string;
  coverImage: string | null;
  authorName: string;
  authorId: string;
  shortNovelGenre: string | null;
  readingPreview: string | null;
  viewCount: number;
  likeCount: number;
  wordCount: number;
  createdAt: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  chapters: Array<{
    id: number;
    title: string;
    chapterNumber: number;
    content: string;
    wordCount: number;
  }>;
}

export interface ShortNovelListItem {
  id: number;
  title: string;
  slug: string;
  blurb: string;
  coverImage: string | null;
  authorName: string;
  shortNovelGenre: string | null;
  readingPreview: string | null;
  viewCount: number;
  likeCount: number;
  wordCount: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
