import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

class User {
  final String id;
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
      id: json['id']?.toString() ?? '',
      email: json['email'] as String? ?? '',
      username: json['name'] as String? ?? json['username'] as String? ?? json['email']?.toString().split('@')[0] ?? 'User',
      avatarUrl: json['avatar'] as String? ?? json['avatarUrl'] as String?,
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
  static const String _baseUrl = 'https://www.butternovel.com';

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
    final userId = prefs.getString('user_id');
    final userEmail = prefs.getString('user_email');
    final username = prefs.getString('username');
    final avatarUrl = prefs.getString('avatar_url');

    debugPrint('[AuthProvider] Loading saved auth...');
    debugPrint('[AuthProvider] Token exists: ${token != null}');
    if (token != null) {
      debugPrint('[AuthProvider] Token prefix: ${token.length > 20 ? token.substring(0, 20) : token}...');
    }
    debugPrint('[AuthProvider] UserId: $userId, Email: $userEmail');

    // Check for invalid/mock tokens from old authentication system
    if (token != null && (
        token.startsWith('mock_token_') ||
        token.startsWith('google_token_') ||
        token.startsWith('apple_token_') ||
        !token.contains('.')  // JWT tokens have dots separating parts
    )) {
      debugPrint('[AuthProvider] Detected invalid/mock token, clearing auth...');
      await _clearAuth();
      return;
    }

    if (token != null && userId != null && userEmail != null) {
      _token = token;
      _user = User(
        id: userId,
        email: userEmail,
        username: username ?? userEmail.split('@')[0],
        avatarUrl: avatarUrl,
      );
      debugPrint('[AuthProvider] Auth restored successfully for: $userEmail');
      notifyListeners();
    }
  }

  Future<void> _saveAuth(User user, String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('user_id', user.id);
    await prefs.setString('user_email', user.email);
    await prefs.setString('username', user.username);
    if (user.avatarUrl != null) {
      await prefs.setString('avatar_url', user.avatarUrl!);
    }
  }

  Future<void> _clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_id');
    await prefs.remove('user_email');
    await prefs.remove('username');
    await prefs.remove('avatar_url');
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      debugPrint('[Login] Attempting login for: $email');
      debugPrint('[Login] URL: $_baseUrl/api/mobile/auth/login');

      final response = await http.post(
        Uri.parse('$_baseUrl/api/mobile/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'identifier': email,
          'password': password,
        }),
      );

      debugPrint('[Login] Response status: ${response.statusCode}');
      debugPrint('[Login] Response body: ${response.body}');

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final user = User.fromJson(data['user']);
        final token = data['token'] as String;

        debugPrint('[Login] Success! User: ${user.username}, Token: ${token.substring(0, 20)}...');

        _user = user;
        _token = token;
        await _saveAuth(user, token);

        _isLoading = false;
        notifyListeners();
        return {'success': true};
      } else {
        debugPrint('[Login] Failed: ${data['error']}');
        _isLoading = false;
        notifyListeners();
        return {'success': false, 'error': data['error'] ?? 'Login failed'};
      }
    } catch (e) {
      debugPrint('[Login] Error: $e');
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'error': 'Network error. Please try again.'};
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
      final response = await http.post(
        Uri.parse('$_baseUrl/api/mobile/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
          'name': username,
        }),
      );

      final data = json.decode(response.body);

      if ((response.statusCode == 200 || response.statusCode == 201) && data['success'] == true) {
        final user = User.fromJson(data['user']);
        final token = data['token'] as String;

        _user = user;
        _token = token;
        await _saveAuth(user, token);

        _isLoading = false;
        notifyListeners();
        return {'success': true};
      } else {
        _isLoading = false;
        notifyListeners();
        return {'success': false, 'error': data['error'] ?? 'Registration failed'};
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'error': 'Network error. Please try again.'};
    }
  }

  Future<Map<String, dynamic>> loginWithGoogle({
    required String email,
    String? displayName,
    String? photoUrl,
    String? googleId,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      print('[Google Auth] Attempting Google auth for: $email');
      print('[Google Auth] URL: $_baseUrl/api/mobile/auth/google');

      final response = await http.post(
        Uri.parse('$_baseUrl/api/mobile/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'displayName': displayName,
          'photoUrl': photoUrl,
          'googleId': googleId,
        }),
      );

      print('[Google Auth] Response status: ${response.statusCode}');
      print('[Google Auth] Response body: ${response.body}');

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final token = data['token'] as String;
        final userData = data['user'];

        final user = User(
          id: userData['id'].toString(),
          email: userData['email'] ?? email,
          username: userData['name'] ?? displayName ?? email.split('@')[0],
          avatarUrl: userData['avatar'] ?? photoUrl,
        );

        print('[Google Auth] Success! User: ${user.username}, Token length: ${token.length}');

        _user = user;
        _token = token;
        await _saveAuth(user, token);

        _isLoading = false;
        notifyListeners();
        return {'success': true};
      } else {
        _isLoading = false;
        notifyListeners();
        return {'success': false, 'error': data['error'] ?? 'Google auth failed'};
      }
    } catch (e) {
      print('[Google Auth] Error: $e');
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'error': 'Network error. Please try again.'};
    }
  }

  Future<Map<String, dynamic>> loginWithApple({
    String? email,
    String? fullName,
    String? appleId,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      print('[Apple Auth] Attempting Apple auth, appleId: $appleId');
      print('[Apple Auth] URL: $_baseUrl/api/mobile/auth/apple');

      final response = await http.post(
        Uri.parse('$_baseUrl/api/mobile/auth/apple'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'fullName': fullName,
          'appleId': appleId,
        }),
      );

      print('[Apple Auth] Response status: ${response.statusCode}');
      print('[Apple Auth] Response body: ${response.body}');

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final token = data['token'] as String;
        final userData = data['user'];

        final user = User(
          id: userData['id'].toString(),
          email: userData['email'] ?? email ?? 'private@apple.com',
          username: userData['name'] ?? fullName ?? 'Apple User',
          avatarUrl: userData['avatar'],
        );

        print('[Apple Auth] Success! User: ${user.username}, Token length: ${token.length}');

        _user = user;
        _token = token;
        await _saveAuth(user, token);

        _isLoading = false;
        notifyListeners();
        return {'success': true};
      } else {
        _isLoading = false;
        notifyListeners();
        return {'success': false, 'error': data['error'] ?? 'Apple auth failed'};
      }
    } catch (e) {
      print('[Apple Auth] Error: $e');
      _isLoading = false;
      notifyListeners();
      return {'success': false, 'error': 'Network error. Please try again.'};
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    await _clearAuth();
    notifyListeners();
  }
}
