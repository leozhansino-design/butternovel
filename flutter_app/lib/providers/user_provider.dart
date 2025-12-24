import 'package:flutter/material.dart';

class UserProvider extends ChangeNotifier {
  bool _isLoggedIn = false;
  String? _userId;
  String? _userName;
  String? _userAvatar;
  Set<int> _likedNovels = {};
  Set<int> _bookmarkedNovels = {};

  bool get isLoggedIn => _isLoggedIn;
  String? get userId => _userId;
  String? get userName => _userName;
  String? get userAvatar => _userAvatar;

  bool isLiked(int novelId) => _likedNovels.contains(novelId);
  bool isBookmarked(int novelId) => _bookmarkedNovels.contains(novelId);

  void login(String id, String name, String? avatar) {
    _isLoggedIn = true;
    _userId = id;
    _userName = name;
    _userAvatar = avatar;
    notifyListeners();
  }

  void logout() {
    _isLoggedIn = false;
    _userId = null;
    _userName = null;
    _userAvatar = null;
    _likedNovels.clear();
    _bookmarkedNovels.clear();
    notifyListeners();
  }

  void toggleLike(int novelId) {
    if (_likedNovels.contains(novelId)) {
      _likedNovels.remove(novelId);
    } else {
      _likedNovels.add(novelId);
    }
    notifyListeners();
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
