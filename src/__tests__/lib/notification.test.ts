/**
 * 通知系统核心逻辑测试
 * 测试通知聚合、生成、格式化等功能
 */

import {
  createNotificationTitle,
  createNotificationContent,
  createNotificationLink,
  shouldAggregateNotification,
  getAggregationKey,
  formatActorNames,
  AGGREGATION_THRESHOLDS,
} from '@/lib/notification';
import { NotificationType } from '@prisma/client';

describe('Notification Core Logic', () => {
  describe('Aggregation Thresholds', () => {
    it('should have correct thresholds for each notification type', () => {
      expect(AGGREGATION_THRESHOLDS.RATING_LIKE).toBe(5);
      expect(AGGREGATION_THRESHOLDS.COMMENT_LIKE).toBe(5);
      expect(AGGREGATION_THRESHOLDS.RATING_REPLY).toBe(3);
      expect(AGGREGATION_THRESHOLDS.COMMENT_REPLY).toBe(3);
      expect(AGGREGATION_THRESHOLDS.NEW_FOLLOWER).toBe(5);
    });
  });

  describe('shouldAggregateNotification()', () => {
    it('should aggregate when count exceeds threshold for RATING_LIKE', () => {
      expect(shouldAggregateNotification('RATING_LIKE', 6)).toBe(true);
      expect(shouldAggregateNotification('RATING_LIKE', 5)).toBe(false);
      expect(shouldAggregateNotification('RATING_LIKE', 4)).toBe(false);
    });

    it('should aggregate when count exceeds threshold for RATING_REPLY', () => {
      expect(shouldAggregateNotification('RATING_REPLY', 4)).toBe(true);
      expect(shouldAggregateNotification('RATING_REPLY', 3)).toBe(false);
      expect(shouldAggregateNotification('RATING_REPLY', 2)).toBe(false);
    });

    it('should not aggregate for types without threshold', () => {
      expect(shouldAggregateNotification('AUTHOR_NEW_NOVEL', 100)).toBe(false);
      expect(shouldAggregateNotification('NOVEL_UPDATE', 50)).toBe(false);
    });
  });

  describe('getAggregationKey()', () => {
    it('should generate aggregation key for RATING_LIKE', () => {
      const key = getAggregationKey('RATING_LIKE', 'user123', {
        ratingId: 'rating456',
      });
      expect(key).toBe('RATING_LIKE:user123:rating456');
    });

    it('should generate aggregation key for COMMENT_REPLY', () => {
      const key = getAggregationKey('COMMENT_REPLY', 'user123', {
        commentId: 'comment789',
      });
      expect(key).toBe('COMMENT_REPLY:user123:comment789');
    });

    it('should generate aggregation key for NEW_FOLLOWER', () => {
      const key = getAggregationKey('NEW_FOLLOWER', 'user123', {});
      expect(key).toBe('NEW_FOLLOWER:user123');
    });

    it('should return null for non-aggregatable types', () => {
      const key = getAggregationKey('AUTHOR_NEW_NOVEL', 'user123', {
        novelId: 42,
      });
      expect(key).toBeNull();
    });
  });

  describe('formatActorNames()', () => {
    const actors = [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' },
      { id: '3', name: 'Charlie', email: 'charlie@example.com' },
      { id: '4', name: 'David', email: 'david@example.com' },
      { id: '5', name: 'Eve', email: 'eve@example.com' },
    ];

    it('should format 1 actor name', () => {
      const result = formatActorNames([actors[0]], 1);
      expect(result).toBe('Alice');
    });

    it('should format 2 actor names', () => {
      const result = formatActorNames(actors.slice(0, 2), 2);
      expect(result).toBe('Alice、Bob');
    });

    it('should format 3 actor names with count', () => {
      const result = formatActorNames(actors.slice(0, 3), 3);
      expect(result).toBe('Alice、Bob、Charlie 等3人');
    });

    it('should format when count exceeds actors array (aggregated)', () => {
      const result = formatActorNames(actors.slice(0, 3), 10);
      expect(result).toBe('Alice、Bob、Charlie 等10人');
    });

    it('should format 100+ actors', () => {
      const result = formatActorNames(actors.slice(0, 3), 150);
      expect(result).toBe('Alice、Bob、Charlie 等150人');
    });

    it('should handle actors without names (use email)', () => {
      const noNameActors = [
        { id: '1', name: null, email: 'alice@example.com' },
        { id: '2', name: null, email: 'bob@example.com' },
      ];
      const result = formatActorNames(noNameActors, 2);
      expect(result).toBe('alice@example.com、bob@example.com');
    });
  });

  describe('createNotificationTitle()', () => {
    describe('RATING_REPLY', () => {
      it('should create title for single reply', () => {
        const title = createNotificationTitle({
          type: 'RATING_REPLY',
          actorName: 'Alice',
          isAggregated: false,
        });
        expect(title).toBe('Alice 回复了你的评分');
      });

      it('should create title for aggregated replies', () => {
        const title = createNotificationTitle({
          type: 'RATING_REPLY',
          actorName: 'Alice、Bob 等5人',
          isAggregated: true,
        });
        expect(title).toBe('Alice、Bob 等5人 回复了你的评分');
      });
    });

    describe('RATING_LIKE', () => {
      it('should create title for single like', () => {
        const title = createNotificationTitle({
          type: 'RATING_LIKE',
          actorName: 'Bob',
          isAggregated: false,
        });
        expect(title).toBe('Bob 赞了你的评分');
      });

      it('should create title for 100+ likes', () => {
        const title = createNotificationTitle({
          type: 'RATING_LIKE',
          actorName: '100+ 人',
          isAggregated: true,
        });
        expect(title).toBe('100+ 人 赞了你的评分');
      });
    });

    describe('COMMENT_REPLY', () => {
      it('should create title for comment reply', () => {
        const title = createNotificationTitle({
          type: 'COMMENT_REPLY',
          actorName: 'Charlie',
          isAggregated: false,
        });
        expect(title).toBe('Charlie 回复了你的评论');
      });
    });

    describe('COMMENT_LIKE', () => {
      it('should create title for comment like', () => {
        const title = createNotificationTitle({
          type: 'COMMENT_LIKE',
          actorName: 'David',
          isAggregated: false,
        });
        expect(title).toBe('David 赞了你的评论');
      });
    });

    describe('AUTHOR_NEW_NOVEL', () => {
      it('should create title for new novel', () => {
        const title = createNotificationTitle({
          type: 'AUTHOR_NEW_NOVEL',
          actorName: 'Eve',
          novelTitle: 'The Truth Switch',
        });
        expect(title).toBe('Eve 发布了新书');
      });
    });

    describe('AUTHOR_NEW_CHAPTER', () => {
      it('should create title for new chapter', () => {
        const title = createNotificationTitle({
          type: 'AUTHOR_NEW_CHAPTER',
          actorName: 'Eve',
          novelTitle: 'The Truth Switch',
        });
        expect(title).toBe('Eve 更新了《The Truth Switch》');
      });
    });

    describe('NOVEL_UPDATE', () => {
      it('should create title for novel update', () => {
        const title = createNotificationTitle({
          type: 'NOVEL_UPDATE',
          novelTitle: 'The Truth Switch',
        });
        expect(title).toBe('《The Truth Switch》更新了');
      });
    });

    describe('NOVEL_RATING (作者通知)', () => {
      it('should create title for novel rating', () => {
        const title = createNotificationTitle({
          type: 'NOVEL_RATING',
          actorName: 'Alice',
          novelTitle: 'My Novel',
        });
        expect(title).toBe('Alice 评分了你的小说《My Novel》');
      });
    });

    describe('NOVEL_COMMENT (作者通知)', () => {
      it('should create title for novel comment', () => {
        const title = createNotificationTitle({
          type: 'NOVEL_COMMENT',
          actorName: 'Bob',
          novelTitle: 'My Novel',
        });
        expect(title).toBe('Bob 评论了你的小说《My Novel》');
      });
    });

    describe('NEW_FOLLOWER', () => {
      it('should create title for single follower', () => {
        const title = createNotificationTitle({
          type: 'NEW_FOLLOWER',
          actorName: 'Charlie',
          isAggregated: false,
        });
        expect(title).toBe('Charlie 关注了你');
      });

      it('should create title for multiple followers', () => {
        const title = createNotificationTitle({
          type: 'NEW_FOLLOWER',
          actorName: 'Charlie、David 等10人',
          isAggregated: true,
        });
        expect(title).toBe('Charlie、David 等10人 关注了你');
      });
    });

    describe('LEVEL_UP', () => {
      it('should create title for level up', () => {
        const title = createNotificationTitle({
          type: 'LEVEL_UP',
          level: 5,
        });
        expect(title).toBe('恭喜你升级到 Lv.5');
      });
    });

    describe('SYSTEM_ANNOUNCEMENT', () => {
      it('should use custom title for system announcement', () => {
        const title = createNotificationTitle({
          type: 'SYSTEM_ANNOUNCEMENT',
          customTitle: '系统维护通知',
        });
        expect(title).toBe('系统维护通知');
      });
    });
  });

  describe('createNotificationContent()', () => {
    it('should create content for RATING_REPLY', () => {
      const content = createNotificationContent({
        type: 'RATING_REPLY',
        replyContent: '我也这么认为！',
      });
      expect(content).toBe('我也这么认为！');
    });

    it('should create content for AUTHOR_NEW_CHAPTER', () => {
      const content = createNotificationContent({
        type: 'AUTHOR_NEW_CHAPTER',
        chapterTitle: '第42章：新篇章',
      });
      expect(content).toBe('第42章：新篇章');
    });

    it('should create content for NOVEL_RATING', () => {
      const content = createNotificationContent({
        type: 'NOVEL_RATING',
        score: 10,
      });
      expect(content).toBe('⭐⭐⭐⭐⭐');
    });

    it('should return null for types without content', () => {
      const content = createNotificationContent({
        type: 'RATING_LIKE',
      });
      expect(content).toBeNull();
    });
  });

  describe('createNotificationLink()', () => {
    it('should create link for RATING_REPLY', () => {
      const link = createNotificationLink({
        type: 'RATING_REPLY',
        novelId: 42,
        novelSlug: 'the-truth-switch',
        ratingId: 'rating123',
      });
      expect(link).toBe('/novel/42/the-truth-switch#rating-rating123');
    });

    it('should create link for COMMENT_REPLY', () => {
      const link = createNotificationLink({
        type: 'COMMENT_REPLY',
        novelId: 42,
        novelSlug: 'the-truth-switch',
        chapterId: 5,
        chapterNumber: 5,
        commentId: 'comment456',
      });
      expect(link).toBe(
        '/novel/42/the-truth-switch/chapter/5#comment-comment456'
      );
    });

    it('should create link for AUTHOR_NEW_CHAPTER', () => {
      const link = createNotificationLink({
        type: 'AUTHOR_NEW_CHAPTER',
        novelId: 42,
        novelSlug: 'the-truth-switch',
        chapterId: 10,
        chapterNumber: 10,
      });
      expect(link).toBe('/novel/42/the-truth-switch/chapter/10');
    });

    it('should create link for AUTHOR_NEW_NOVEL', () => {
      const link = createNotificationLink({
        type: 'AUTHOR_NEW_NOVEL',
        novelId: 99,
        novelSlug: 'new-novel',
      });
      expect(link).toBe('/novel/99/new-novel');
    });

    it('should create link for NEW_FOLLOWER', () => {
      const link = createNotificationLink({
        type: 'NEW_FOLLOWER',
        actorId: 'user123',
      });
      expect(link).toBe('/profile/user123');
    });

    it('should return null for SYSTEM_ANNOUNCEMENT without custom link', () => {
      const link = createNotificationLink({
        type: 'SYSTEM_ANNOUNCEMENT',
      });
      expect(link).toBeNull();
    });
  });
});
