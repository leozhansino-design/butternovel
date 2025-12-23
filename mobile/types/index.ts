// Re-export API types
export type {
  Novel,
  ParagraphComment,
  Rating,
  LibraryItem,
} from "../lib/api";

// Additional types

export interface Genre {
  id: string;
  name: string;
  nameEn: string;
}

// Available genres for short novels
export const GENRES: Genre[] = [
  { id: "romance", name: "浪漫", nameEn: "Romance" },
  { id: "fantasy", name: "奇幻", nameEn: "Fantasy" },
  { id: "thriller", name: "悬疑", nameEn: "Thriller" },
  { id: "scifi", name: "科幻", nameEn: "Sci-Fi" },
  { id: "horror", name: "恐怖", nameEn: "Horror" },
  { id: "mystery", name: "推理", nameEn: "Mystery" },
  { id: "drama", name: "剧情", nameEn: "Drama" },
  { id: "comedy", name: "喜剧", nameEn: "Comedy" },
  { id: "action", name: "动作", nameEn: "Action" },
  { id: "sliceoflife", name: "日常", nameEn: "Slice of Life" },
  { id: "historical", name: "历史", nameEn: "Historical" },
  { id: "supernatural", name: "灵异", nameEn: "Supernatural" },
  { id: "youngadult", name: "青春", nameEn: "Young Adult" },
  { id: "lgbtq", name: "LGBTQ+", nameEn: "LGBTQ+" },
  { id: "fanfiction", name: "同人", nameEn: "Fan Fiction" },
  { id: "other", name: "其他", nameEn: "Other" },
];

// Character limits for short novels
export const SHORT_NOVEL_LIMITS = {
  MIN_CHARS: 15000,
  MAX_CHARS: 50000,
};

// Rating scores (2, 4, 6, 8, 10 -> 1-5 stars)
export const RATING_SCORES = [2, 4, 6, 8, 10] as const;
export type RatingScore = (typeof RATING_SCORES)[number];

export function starToScore(stars: number): RatingScore {
  return (stars * 2) as RatingScore;
}

export function scoreToStar(score: RatingScore): number {
  return score / 2;
}
