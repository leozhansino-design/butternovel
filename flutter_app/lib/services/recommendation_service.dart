import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:math';

/// Service for managing recommendations and tracking viewed content
class RecommendationService {
  static const String _viewedKey = 'viewed_shorts';
  static const String _viewedTimestampKey = 'viewed_timestamps';
  static const int _maxViewedHistory = 500; // Keep track of last 500 viewed items
  static const int _viewedExpireDays = 7; // Reset viewed status after 7 days

  /// Get list of viewed short novel IDs
  static Future<Set<int>> getViewedIds() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final viewedJson = prefs.getString(_viewedKey);
      final timestampsJson = prefs.getString(_viewedTimestampKey);

      if (viewedJson == null || viewedJson.isEmpty) return {};

      // Safely decode JSON with error handling
      List<dynamic>? viewedList;
      try {
        viewedList = json.decode(viewedJson) as List<dynamic>?;
      } catch (e) {
        // If JSON is corrupted, clear it and return empty
        await prefs.remove(_viewedKey);
        await prefs.remove(_viewedTimestampKey);
        return {};
      }

      if (viewedList == null) return {};

      final viewed = <int>{};
      for (final item in viewedList) {
        if (item is int) {
          viewed.add(item);
        } else if (item is num) {
          viewed.add(item.toInt());
        }
      }

      // Clean up expired entries
      if (timestampsJson != null && timestampsJson.isNotEmpty) {
        try {
          final decoded = json.decode(timestampsJson);
          if (decoded is Map) {
            final timestamps = <String, int>{};
            decoded.forEach((key, value) {
              if (key is String && value is num) {
                timestamps[key] = value.toInt();
              }
            });

            final now = DateTime.now().millisecondsSinceEpoch;
            final expireMs = _viewedExpireDays * 24 * 60 * 60 * 1000;

            final expiredIds = <int>[];
            for (final entry in timestamps.entries) {
              if (now - entry.value > expireMs) {
                final id = int.tryParse(entry.key);
                if (id != null) expiredIds.add(id);
              }
            }

            // Remove expired entries
            for (final id in expiredIds) {
              viewed.remove(id);
              timestamps.remove(id.toString());
            }

            // Save cleaned data
            if (expiredIds.isNotEmpty) {
              await prefs.setString(_viewedKey, json.encode(viewed.toList()));
              await prefs.setString(_viewedTimestampKey, json.encode(timestamps));
            }
          }
        } catch (e) {
          // If timestamps are corrupted, just ignore them
          await prefs.remove(_viewedTimestampKey);
        }
      }

      return viewed;
    } catch (e) {
      // If anything fails, return empty set
      return {};
    }
  }

  /// Mark a short novel as viewed
  static Future<void> markAsViewed(int id) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final viewed = await getViewedIds();

      viewed.add(id);

      // Limit history size
      final viewedList = viewed.toList();
      if (viewedList.length > _maxViewedHistory) {
        viewedList.removeRange(0, viewedList.length - _maxViewedHistory);
      }

      // Update timestamps safely
      var timestamps = <String, int>{};
      final timestampsJson = prefs.getString(_viewedTimestampKey);
      if (timestampsJson != null && timestampsJson.isNotEmpty) {
        try {
          final decoded = json.decode(timestampsJson);
          if (decoded is Map) {
            decoded.forEach((key, value) {
              if (key is String && value is num) {
                timestamps[key] = value.toInt();
              }
            });
          }
        } catch (e) {
          // If corrupted, start fresh
          timestamps = <String, int>{};
        }
      }

      timestamps[id.toString()] = DateTime.now().millisecondsSinceEpoch;

      await prefs.setString(_viewedKey, json.encode(viewedList));
      await prefs.setString(_viewedTimestampKey, json.encode(timestamps));
    } catch (e) {
      // Silently fail - tracking is not critical
    }
  }

  /// Shuffle and filter list to provide diverse recommendations
  /// Returns items in a randomized order, prioritizing unseen content
  static List<T> shuffleAndDiversify<T>(
    List<T> items,
    Set<int> viewedIds,
    int Function(T) getId,
    String Function(T) getGenre,
  ) {
    if (items.isEmpty) return items;

    final random = Random();

    // Separate seen and unseen items
    final unseen = items.where((item) => !viewedIds.contains(getId(item))).toList();
    final seen = items.where((item) => viewedIds.contains(getId(item))).toList();

    // Shuffle both lists
    unseen.shuffle(random);
    seen.shuffle(random);

    // Diversify by genre - don't show too many of the same genre in a row
    final result = <T>[];
    final genreCount = <String, int>{};
    const maxSameGenreInRow = 2;

    final allItems = [...unseen, ...seen];

    for (final item in allItems) {
      final genre = getGenre(item);
      final count = genreCount[genre] ?? 0;

      if (count < maxSameGenreInRow) {
        result.add(item);
        genreCount[genre] = count + 1;
      } else {
        // Add to the end if we've shown too many of this genre
        result.add(item);
        // Reset count for this genre to allow more later
        genreCount[genre] = 1;
      }
    }

    return result;
  }

  /// Clear all viewed history
  static Future<void> clearHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_viewedKey);
    await prefs.remove(_viewedTimestampKey);
  }
}
