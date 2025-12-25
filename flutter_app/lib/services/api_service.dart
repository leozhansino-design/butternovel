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
}
