// lib/tags.ts
// 🦋 ButterNovel - Tags Utility Functions

/**
 * 标准化标签名称
 * - 转换为小写
 * - 移除首尾空格
 * - 将多个空格替换为单个连字符
 * - 移除特殊字符（只保留字母、数字、连字符）
 *
 * @param input - 原始标签输入
 * @returns 标准化后的标签名称
 *
 * @example
 * normalizeTag("  High School  ") // "high-school"
 * normalizeTag("Romance!") // "romance"
 * normalizeTag("love") // "love"
 */
export function normalizeTag(input: string): string {
  return input
    .trim()                           // 移除首尾空格
    .toLowerCase()                    // 转小写
    .replace(/\s+/g, '-')            // 空格转连字符
    .replace(/[^a-z0-9-]/g, '')      // 移除特殊字符
    .replace(/-+/g, '-')             // 多个连字符合并为一个
    .replace(/^-|-$/g, '');          // 移除首尾连字符
}

/**
 * 生成标签的URL slug
 * 使用与normalizeTag相同的逻辑
 *
 * @param name - 标签名称
 * @returns URL slug
 */
export function generateTagSlug(name: string): string {
  return normalizeTag(name);
}

/**
 * 验证标签名称是否有效
 * - 长度在1-30字符之间
 * - 不能包含空格（应该使用连字符）
 * - 只能包含字母、数字和连字符
 *
 * @param tag - 标签名称
 * @returns 是否有效
 */
export function isValidTag(tag: string): boolean {
  if (!tag || tag.length === 0 || tag.length > 30) {
    return false;
  }

  // 不允许空格（用户应该按空格键添加标签）
  if (tag.includes(' ')) {
    return false;
  }

  // 只允许字母、数字和连字符
  const validPattern = /^[a-z0-9-]+$/;
  return validPattern.test(tag);
}

/**
 * 计算小说热度分数
 *
 * 公式:
 * hotScore = viewCount * 0.1
 *          + bookmarkCount * 5
 *          + totalChapters * 2
 *          - daysSinceCreated * 0.5
 *          - daysSinceUpdated * 1
 *
 * @param novel - 小说数据
 * @returns 热度分数
 */
export function calculateHotScore(novel: {
  viewCount: number;
  bookmarkCount: number;
  totalChapters?: number;
  createdAt: Date;
  updatedAt: Date;
}): number {
  const now = Date.now();
  const daysSinceCreated = (now - novel.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceUpdated = (now - novel.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

  const chapterCount = novel.totalChapters ?? 0;

  const score =
    novel.viewCount * 0.1 +
    novel.bookmarkCount * 5 +
    chapterCount * 2 -
    daysSinceCreated * 0.5 -
    daysSinceUpdated * 1;

  return Math.max(0, score); // 分数不能为负
}

/**
 * 批量标准化标签并去重
 *
 * @param tags - 标签列表
 * @returns 标准化并去重后的标签列表
 */
export function normalizeTags(tags: string[]): string[] {
  const normalized = tags
    .map(normalizeTag)
    .filter(tag => tag.length > 0 && tag.length <= 30);

  // 去重（使用Set）
  return Array.from(new Set(normalized));
}

/**
 * 验证标签列表
 * - 最多20个标签
 * - 每个标签必须有效
 *
 * @param tags - 标签列表
 * @returns { valid: boolean, errors: string[] }
 */
export function validateTags(tags: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (tags.length > 20) {
    errors.push('最多只能添加20个标签');
  }

  const invalidTags = tags.filter(tag => !isValidTag(tag));
  if (invalidTags.length > 0) {
    errors.push(`无效的标签: ${invalidTags.join(', ')}`);
  }

  // 检查重复
  const uniqueTags = new Set(tags.map(normalizeTag));
  if (uniqueTags.size < tags.length) {
    errors.push('存在重复的标签');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Tags输入限制常量
 */
export const TAG_LIMITS = {
  MAX_TAGS: 20,           // 每本小说最多20个标签
  MAX_TAG_LENGTH: 30,     // 单个标签最大长度
  MIN_TAG_LENGTH: 1,      // 单个标签最小长度
} as const;

/**
 * 常用标签示例（用于UI提示）
 */
export const POPULAR_TAGS_EXAMPLES = [
  'romance',
  'fantasy',
  'mystery',
  'sci-fi',
  'adventure',
  'thriller',
  'historical',
  'contemporary',
  'young-adult',
  'paranormal',
] as const;
