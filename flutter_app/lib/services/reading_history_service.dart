import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/short_novel.dart';

class ReadingHistoryService {
  static const String _historyKey = 'reading_history';
  static const int _maxHistoryItems = 100;

  /// Add a novel to reading history
  static Future<void> addToHistory(ShortNovel novel) async {
    final prefs = await SharedPreferences.getInstance();
    final history = await getHistory();

    // Remove if already exists (to move to front)
    history.removeWhere((item) => item['id'] == novel.id);

    // Add to front
    history.insert(0, {
      'id': novel.id,
      'title': novel.title,
      'slug': novel.slug,
      'blurb': novel.blurb,
      'coverImage': novel.coverImage,
      'authorName': novel.authorName,
      'shortNovelGenre': novel.shortNovelGenre,
      'viewCount': novel.viewCount,
      'likeCount': novel.likeCount,
      'wordCount': novel.wordCount,
      'averageRating': novel.averageRating,
      'readAt': DateTime.now().toIso8601String(),
    });

    // Keep only last 100
    if (history.length > _maxHistoryItems) {
      history.removeRange(_maxHistoryItems, history.length);
    }

    await prefs.setString(_historyKey, json.encode(history));
  }

  /// Get reading history
  static Future<List<Map<String, dynamic>>> getHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final historyJson = prefs.getString(_historyKey);

    if (historyJson == null || historyJson.isEmpty) {
      return [];
    }

    try {
      final List<dynamic> decoded = json.decode(historyJson);
      return decoded.cast<Map<String, dynamic>>();
    } catch (e) {
      return [];
    }
  }

  /// Get reading history count
  static Future<int> getHistoryCount() async {
    final history = await getHistory();
    return history.length;
  }

  /// Clear reading history
  static Future<void> clearHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_historyKey);
  }

  /// Remove a single item from history
  static Future<void> removeFromHistory(int novelId) async {
    final prefs = await SharedPreferences.getInstance();
    final history = await getHistory();

    history.removeWhere((item) => item['id'] == novelId);
    await prefs.setString(_historyKey, json.encode(history));
  }

  /// Convert history item to ShortNovel (for display)
  static ShortNovel historyItemToNovel(Map<String, dynamic> item) {
    return ShortNovel(
      id: item['id'] ?? 0,
      title: item['title'] ?? '',
      slug: item['slug'] ?? '',
      blurb: item['blurb'] ?? '',
      coverImage: item['coverImage'],
      authorName: item['authorName'] ?? 'Unknown',
      shortNovelGenre: item['shortNovelGenre'] ?? 'General',
      viewCount: item['viewCount'] ?? 0,
      likeCount: item['likeCount'] ?? 0,
      wordCount: item['wordCount'] ?? 0,
      averageRating: (item['averageRating'] ?? 0).toDouble(),
    );
  }
}
