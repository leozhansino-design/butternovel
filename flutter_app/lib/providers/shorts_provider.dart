import 'package:flutter/material.dart';

import '../models/short_novel.dart';
import '../services/api_service.dart';
import '../services/recommendation_service.dart';

class ShortsProvider extends ChangeNotifier {
  List<ShortNovel> _shorts = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;
  Set<int> _viewedIds = {};

  List<ShortNovel> get shorts => _shorts;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMore => _hasMore;

  Future<void> fetchShorts({bool loadMore = false}) async {
    if (_isLoading) return;
    if (loadMore && !_hasMore) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Load viewed IDs for recommendation
      _viewedIds = await RecommendationService.getViewedIds();

      final page = loadMore ? _currentPage + 1 : 1;
      final newShorts = await ApiService.fetchShorts(page: page);

      // Shuffle and diversify recommendations
      final recommendedShorts = RecommendationService.shuffleAndDiversify<ShortNovel>(
        newShorts,
        _viewedIds,
        (s) => s.id,
        (s) => s.displayGenre,
      );

      if (loadMore) {
        // Filter out duplicates when loading more
        final existingIds = _shorts.map((s) => s.id).toSet();
        final uniqueNewShorts = recommendedShorts
            .where((s) => !existingIds.contains(s.id))
            .toList();
        _shorts.addAll(uniqueNewShorts);
        _currentPage = page;
      } else {
        _shorts = recommendedShorts;
        _currentPage = 1;
      }

      _hasMore = newShorts.length >= 20;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Mark a short as viewed (call when user scrolls to it)
  Future<void> markAsViewed(int id) async {
    await RecommendationService.markAsViewed(id);
    _viewedIds.add(id);
  }

  Future<void> refresh() async {
    _currentPage = 1;
    _hasMore = true;
    await fetchShorts();
  }

  void likeShort(int id) {
    final index = _shorts.indexWhere((s) => s.id == id);
    if (index != -1) {
      // Optimistic update - we'd need mutable model for this
      // For now just call API
      ApiService.likeShort(id);
    }
  }
}
