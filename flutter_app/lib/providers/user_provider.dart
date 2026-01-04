import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/short_novel.dart';
import '../services/api_service.dart';

class UserProvider extends ChangeNotifier {
  bool _isLoggedIn = false;
  String? _userId;
  String? _userName;
  String? _userAvatar;
  String? _token;
  Set<int> _likedNovels = {};
  Set<int> _bookmarkedNovels = {};
  Map<int, ShortNovel> _likedNovelDetails = {};
  bool _isLoadingLibrary = false;

  bool get isLoggedIn => _isLoggedIn;
  String? get userId => _userId;
  String? get userName => _userName;
  String? get userAvatar => _userAvatar;
  String? get token => _token;
  Set<int> get likedNovelIds => _likedNovels;
  List<ShortNovel> get likedNovels => _likedNovelDetails.values.toList();
  bool get isLoadingLibrary => _isLoadingLibrary;

  UserProvider() {
    _loadSavedToken();
  }

  /// Load saved token from SharedPreferences and fetch library
  Future<void> _loadSavedToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');

    // Check for valid JWT token (must have dots)
    if (token != null && token.contains('.')) {
      _token = token;
      debugPrint('[UserProvider] Token restored, loading library...');
      await loadLibrary();
    }
  }

  bool isLiked(int novelId) => _likedNovels.contains(novelId);
  bool isBookmarked(int novelId) => _bookmarkedNovels.contains(novelId);

  void login(String id, String name, String? avatar, {String? token}) {
    _isLoggedIn = true;
    _userId = id;
    _userName = name;
    _userAvatar = avatar;
    _token = token;
    notifyListeners();

    // Load library from backend if token is available
    if (token != null) {
      loadLibrary();
    }
  }

  void setToken(String? token) {
    _token = token;
    if (token != null) {
      loadLibrary();
    }
  }

  void logout() {
    _isLoggedIn = false;
    _userId = null;
    _userName = null;
    _userAvatar = null;
    _token = null;
    _likedNovels.clear();
    _bookmarkedNovels.clear();
    _likedNovelDetails.clear();
    notifyListeners();
  }

  /// Load library from backend API
  Future<void> loadLibrary() async {
    if (_token == null) return;

    _isLoadingLibrary = true;
    notifyListeners();

    try {
      final novels = await ApiService.getLibrary(token: _token!);
      _likedNovels.clear();
      _likedNovelDetails.clear();

      for (final novel in novels) {
        _likedNovels.add(novel.id);
        _likedNovelDetails[novel.id] = novel;
      }
    } catch (e) {
      debugPrint('[UserProvider] Error loading library: $e');
    } finally {
      _isLoadingLibrary = false;
      notifyListeners();
    }
  }

  /// Toggle like and sync with backend
  Future<void> toggleLike(int novelId, {ShortNovel? novel}) async {
    final wasLiked = _likedNovels.contains(novelId);

    // Optimistic update
    if (wasLiked) {
      _likedNovels.remove(novelId);
      _likedNovelDetails.remove(novelId);
    } else {
      _likedNovels.add(novelId);
      if (novel != null) {
        _likedNovelDetails[novelId] = novel;
      }
    }
    notifyListeners();

    // Sync with backend if logged in
    if (_token != null) {
      bool success;
      if (wasLiked) {
        success = await ApiService.removeFromLibrary(novelId, token: _token!);
      } else {
        success = await ApiService.addToLibrary(novelId, token: _token!);
      }

      // Revert if failed
      if (!success) {
        if (wasLiked) {
          _likedNovels.add(novelId);
          if (novel != null) {
            _likedNovelDetails[novelId] = novel;
          }
        } else {
          _likedNovels.remove(novelId);
          _likedNovelDetails.remove(novelId);
        }
        notifyListeners();
      }
    }
  }

  void addLikedNovelDetails(ShortNovel novel) {
    if (_likedNovels.contains(novel.id)) {
      _likedNovelDetails[novel.id] = novel;
      notifyListeners();
    }
  }

  void toggleBookmark(int novelId) {
    if (_bookmarkedNovels.contains(novelId)) {
      _bookmarkedNovels.remove(novelId);
    } else {
      _bookmarkedNovels.add(novelId);
    }
    notifyListeners();
  }
}
