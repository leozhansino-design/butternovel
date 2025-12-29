import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class User {
  final int id;
  final String email;
  final String username;
  final String? avatarUrl;

  User({
    required this.id,
    required this.email,
    required this.username,
    this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      email: json['email'] as String,
      username: json['username'] as String? ?? json['email'].split('@')[0],
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'username': username,
      'avatarUrl': avatarUrl,
    };
  }
}

class AuthProvider extends ChangeNotifier {
  User? _user;
  String? _token;
  bool _isLoading = false;

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null && _token != null;

  AuthProvider() {
    _loadSavedAuth();
  }

  Future<void> _loadSavedAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    final userId = prefs.getInt('user_id');
    final userEmail = prefs.getString('user_email');
    final username = prefs.getString('username');

    if (token != null && userId != null && userEmail != null) {
      _token = token;
      _user = User(
        id: userId,
        email: userEmail,
        username: username ?? userEmail.split('@')[0],
      );
      notifyListeners();
    }
  }

  Future<void> _saveAuth(User user, String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setInt('user_id', user.id);
    await prefs.setString('user_email', user.email);
    await prefs.setString('username', user.username);
  }

  Future<void> _clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_id');
    await prefs.remove('user_email');
    await prefs.remove('username');
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      // TODO: Replace with actual API call
      // For now, simulate login
      await Future.delayed(const Duration(seconds: 1));

      // Simulate successful login
      if (email.isNotEmpty && password.length >= 6) {
        final user = User(
          id: 1,
          email: email,
          username: email.split('@')[0],
        );
        final token = 'mock_token_${DateTime.now().millisecondsSinceEpoch}';

        _user = user;
        _token = token;
        await _saveAuth(user, token);

        _isLoading = false;
        notifyListeners();
        return {'success': true};
      } else {
        _isLoading = false;
        notifyListeners();
        return {'success': false, 'error': 'Invalid email or password'};
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> register(
    String email,
    String password,
    String username,
  ) async {
    _isLoading = true;
    notifyListeners();

    try {
      // TODO: Replace with actual API call
      await Future.delayed(const Duration(seconds: 1));

      // Simulate successful registration
      if (email.isNotEmpty && password.length >= 6 && username.isNotEmpty) {
        final user = User(
          id: DateTime.now().millisecondsSinceEpoch,
          email: email,
          username: username,
        );
        final token = 'mock_token_${DateTime.now().millisecondsSinceEpoch}';

        _user = user;
        _token = token;
        await _saveAuth(user, token);

        _isLoading = false;
        notifyListeners();
        return {'success': true};
      } else {
        _isLoading = false;
        notifyListeners();
        return {'success': false, 'error': 'Please fill all fields correctly'};
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    await _clearAuth();
    notifyListeners();
  }
}
