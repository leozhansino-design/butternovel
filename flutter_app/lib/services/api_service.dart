import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;

import '../models/short_novel.dart';

class ApiService {
  // Production URL (use www to avoid redirect)
  static const String baseUrl = 'https://www.butternovel.com';
  // For local development use:
  // static const String baseUrl = 'http://localhost:3000';

  // ==================== Search ====================

  /// Search for novels by query string
  /// Searches in title, author name, tags, and blurb
  static Future<Map<String, dynamic>> searchNovels({
    required String query,
    int page = 1,
    int limit = 20,
    String? genre,
    String? sortBy,
  }) async {
    try {
      final queryParams = <String, String>{
        'q': query,
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (genre != null) queryParams['genre'] = genre;
      if (sortBy != null) queryParams['sort'] = sortBy;

      final uri = Uri.parse('$baseUrl/api/mobile/shorts/search')
          .replace(queryParameters: queryParams);

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final novels = (data['data'] as List)
              .map((item) => ShortNovel.fromJson(item))
              .toList();
          return {
            'novels': novels,
            'total': data['total'] ?? novels.length,
            'hasMore': data['hasMore'] ?? false,
          };
        }
      }

      // Fallback: client-side search from all shorts
      return _fallbackSearch(query, page, limit, genre);
    } catch (e) {
      // Fallback on error
      return _fallbackSearch(query, page, limit, genre);
    }
  }

  /// Fallback client-side search when API endpoint doesn't exist
  static Future<Map<String, dynamic>> _fallbackSearch(
    String query,
    int page,
    int limit,
    String? genre,
  ) async {
    try {
      final allShorts = await fetchShorts(
        page: 1,
        limit: 100,
        genre: genre,
      );

      final queryLower = query.toLowerCase();
      final filtered = allShorts.where((novel) {
        final titleMatch = novel.title.toLowerCase().contains(queryLower);
        final authorMatch = novel.authorName.toLowerCase().contains(queryLower);
        final blurbMatch = novel.blurb.toLowerCase().contains(queryLower);
        final tagMatch = novel.tags?.any(
              (tag) => tag.name.toLowerCase().contains(queryLower),
            ) ?? false;
        return titleMatch || authorMatch || blurbMatch || tagMatch;
      }).toList();

      // Paginate results
      final startIndex = (page - 1) * limit;
      final endIndex = startIndex + limit;
      final paged = filtered.length > startIndex
          ? filtered.sublist(
              startIndex,
              endIndex > filtered.length ? filtered.length : endIndex,
            )
          : <ShortNovel>[];

      return {
        'novels': paged,
        'total': filtered.length,
        'hasMore': endIndex < filtered.length,
      };
    } catch (e) {
      return {'novels': <ShortNovel>[], 'total': 0, 'hasMore': false};
    }
  }

  /// Get trending search terms
  static Future<List<String>> getTrendingSearches() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/search/trending'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return List<String>.from(data['data']);
        }
      }

      // Fallback trending terms
      return [
        'Romance',
        'Billionaire',
        'CEO',
        'Werewolf',
        'Fantasy',
        'Second Chance',
        'Enemies to Lovers',
        'Fake Dating',
      ];
    } catch (e) {
      return [
        'Romance',
        'Billionaire',
        'CEO',
        'Werewolf',
        'Fantasy',
        'Second Chance',
      ];
    }
  }

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

  /// Fetch shorts filtered by genre
  static Future<List<ShortNovel>> fetchShortsByGenre(
    String genre, {
    int page = 1,
    int limit = 20,
  }) async {
    return fetchShorts(page: page, limit: limit, genre: genre);
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
  static Future<Map<String, dynamic>?> getUserRating(int novelId, {String? token}) async {
    try {
      final headers = <String, String>{};
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.get(
        Uri.parse('$baseUrl/api/novels/$novelId/user-rating'),
        headers: headers.isNotEmpty ? headers : null,
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
    String? token,
  }) async {
    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      // Debug logging
      debugPrint('[RateNovel] novelId: $novelId, score: $score');
      debugPrint('[RateNovel] token: ${token != null ? "${token!.substring(0, 20)}..." : "null"}');
      debugPrint('[RateNovel] URL: $baseUrl/api/novels/$novelId/rate');

      final response = await http.post(
        Uri.parse('$baseUrl/api/novels/$novelId/rate'),
        headers: headers,
        body: json.encode({
          'score': score,
          if (review != null && review.isNotEmpty) 'review': review,
        }),
      );

      // Debug logging
      debugPrint('[RateNovel] Response status: ${response.statusCode}');
      debugPrint('[RateNovel] Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('[RateNovel] Error: $e');
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
  static Future<bool> likeReview(String reviewId, {String? token}) async {
    try {
      final headers = <String, String>{};
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.post(
        Uri.parse('$baseUrl/api/ratings/$reviewId/like'),
        headers: headers.isNotEmpty ? headers : null,
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // ==================== Recommendations ====================

  /// Get similar/recommended novels based on current novel
  /// Algorithm considers: genre, tags, author, popularity, avoids duplicates
  static Future<List<ShortNovel>> getSimilarNovels({
    required int currentNovelId,
    String? genre,
    List<String>? tags,
    int? authorId,
    int limit = 6,
    List<int>? excludeIds,
  }) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
        'excludeId': currentNovelId.toString(),
      };

      if (genre != null) {
        queryParams['genre'] = genre;
      }
      if (tags != null && tags.isNotEmpty) {
        queryParams['tags'] = tags.join(',');
      }
      if (excludeIds != null && excludeIds.isNotEmpty) {
        queryParams['excludeIds'] = excludeIds.join(',');
      }

      final uri = Uri.parse('$baseUrl/api/mobile/shorts/similar')
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

      // Fallback: fetch random shorts excluding current
      return _getFallbackRecommendations(currentNovelId, genre, limit);
    } catch (e) {
      // Fallback on error
      return _getFallbackRecommendations(currentNovelId, genre, limit);
    }
  }

  /// Fallback recommendation: mix of same genre and different genres with randomization
  static Future<List<ShortNovel>> _getFallbackRecommendations(
    int excludeId,
    String? currentGenre,
    int limit,
  ) async {
    try {
      final random = Random();
      final List<ShortNovel> allCandidates = [];

      // Get more novels than needed so we can randomize
      final fetchLimit = limit * 3;

      // Get some from same genre (if available)
      if (currentGenre != null) {
        final sameGenre = await fetchShorts(
          genre: currentGenre,
          limit: fetchLimit,
          page: random.nextInt(3) + 1, // Random page 1-3
        );
        allCandidates.addAll(sameGenre.where((n) => n.id != excludeId));
      }

      // Get some from different genres/trending
      final sortOptions = ['popular', 'trending', 'latest'];
      final randomSort = sortOptions[random.nextInt(sortOptions.length)];

      final others = await fetchShorts(
        limit: fetchLimit,
        sortBy: randomSort,
        page: random.nextInt(3) + 1, // Random page 1-3
      );

      for (final novel in others) {
        if (novel.id != excludeId && !allCandidates.any((n) => n.id == novel.id)) {
          allCandidates.add(novel);
        }
      }

      // Shuffle all candidates
      allCandidates.shuffle(random);

      // Take random selection
      return allCandidates.take(limit).toList();
    } catch (e) {
      return [];
    }
  }
}
