import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/short_novel.dart';

class ApiService {
  // Change this to your production URL when deploying
  static const String baseUrl = 'https://butternovel.vercel.app';
  // For local development use:
  // static const String baseUrl = 'http://localhost:3000';

  static Future<List<ShortNovel>> fetchShorts({
    int page = 1,
    int limit = 20,
    String? genre,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (genre != null) 'genre': genre,
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
}
