import 'package:flutter/material.dart';

import '../models/short_novel.dart';
import '../services/api_service.dart';

class ShortsProvider extends ChangeNotifier {
  List<ShortNovel> _shorts = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;

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
      final page = loadMore ? _currentPage + 1 : 1;
      final newShorts = await ApiService.fetchShorts(page: page);

      if (loadMore) {
        _shorts.addAll(newShorts);
        _currentPage = page;
      } else {
        _shorts = newShorts;
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
