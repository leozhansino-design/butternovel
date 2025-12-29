import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/short_novel.dart';

class ApiService {
  // Production URL (use www to avoid redirect)
  static const String baseUrl = 'https://www.butternovel.com';
  // For local development use:
  // static const String baseUrl = 'http://localhost:3000';

  static Future<List<ShortNovel>> fetchShorts({
    int page = 1,
    int limit = 20,
    String? genre,
    String? sortBy,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (genre != null) 'genre': genre,
        if (sortBy != null) 'sort': sortBy,
      };

      final uri = Uri.parse('$baseUrl/api/mobile/shorts')
          .replace(queryParameters: queryParams);

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return (data['data'] as List)
              .map((item) => ShortNovel.fromJson(item))
              .toList();
        }
      }

      throw Exception('Failed to fetch shorts: ${response.statusCode}');
    } catch (e) {
      throw Exception('Failed to fetch shorts: $e');
    }
  }

  static Future<ShortNovel> fetchShortById(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/shorts/$id'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return ShortNovel.fromJson(data['data']);
        }
      }

      throw Exception('Failed to fetch short: ${response.statusCode}');
    } catch (e) {
      throw Exception('Failed to fetch short: $e');
    }
  }

  static Future<void> likeShort(int id) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/shorts/$id/like'),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to like short');
      }
    } catch (e) {
      throw Exception('Failed to like short: $e');
    }
  }

  /// Track view when entering the reading screen
  /// Returns the new view count if successful
  static Future<int?> trackView(int novelId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/views/track'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'novelId': novelId}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return data['viewCount'];
        }
      }
      return null;
    } catch (e) {
      // Silently fail - view tracking is not critical
      return null;
    }
  }

  /// Like/Unlike a short novel (recommend)
  static Future<Map<String, dynamic>?> toggleLike(int id) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/shorts/$id/recommend'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Check if user has liked a short novel
  static Future<bool> checkLikeStatus(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/shorts/$id/recommend-status'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['hasRecommended'] == true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // ==================== Paragraph Comments ====================

  /// Get comment counts for all paragraphs in a chapter
  static Future<Map<int, int>> getCommentCounts(int chapterId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/paragraph-comments/batch-count?chapterId=$chapterId'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final result = <int, int>{};
          final counts = data['data'];
          if (counts is Map) {
            counts.forEach((key, value) {
              final intKey = int.tryParse(key.toString());
              final intValue = value is int ? value : int.tryParse(value?.toString() ?? '0') ?? 0;
              if (intKey != null) {
                result[intKey] = intValue;
              }
            });
          }
          return result;
        }
      }
      return {};
    } catch (e) {
      return {};
    }
  }

  /// Get comments for a specific paragraph
  static Future<List<Map<String, dynamic>>> getComments(int chapterId, int paragraphIndex) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/paragraph-comments?chapterId=$chapterId&paragraphIndex=$paragraphIndex'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return List<Map<String, dynamic>>.from(data['data']);
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Post a comment on a paragraph
  static Future<Map<String, dynamic>?> postComment({
    required int novelId,
    required int chapterId,
    required int paragraphIndex,
    required String content,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/paragraph-comments'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'novelId': novelId,
          'chapterId': chapterId,
          'paragraphIndex': paragraphIndex,
          'content': content,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return data['data'];
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Like a comment
  static Future<bool> likeComment(String commentId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/paragraph-comments/$commentId/like'),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  /// Unlike a comment
  static Future<bool> unlikeComment(String commentId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/paragraph-comments/$commentId/like'),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // ==================== Ratings ====================

  /// Get user's rating for a novel
  static Future<Map<String, dynamic>?> getUserRating(int novelId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/novels/$novelId/user-rating'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Submit a rating for a novel
  static Future<Map<String, dynamic>?> rateNovel({
    required int novelId,
    required double score,
    String? review,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/novels/$novelId/rate'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'score': score,
          if (review != null && review.isNotEmpty) 'review': review,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Get reviews for a novel
  static Future<List<Map<String, dynamic>>> getReviews(int novelId, {int page = 1, String sortBy = 'likes'}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/novels/$novelId/ratings?page=$page&limit=20&sortBy=$sortBy'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['ratings'] != null) {
          return List<Map<String, dynamic>>.from(data['ratings']);
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Like a review
  static Future<bool> likeReview(String reviewId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/ratings/$reviewId/like'),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
