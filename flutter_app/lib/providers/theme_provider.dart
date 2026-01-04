import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider extends ChangeNotifier {
  bool _isDarkMode = true;

  bool get isDarkMode => _isDarkMode;

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    _isDarkMode = prefs.getBool('isDarkMode') ?? true;
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    _isDarkMode = !_isDarkMode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isDarkMode', _isDarkMode);
    notifyListeners();
  }

  Future<void> setDarkMode(bool value) async {
    _isDarkMode = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isDarkMode', _isDarkMode);
    notifyListeners();
  }

  // Theme colors
  Color get backgroundColor => _isDarkMode ? Colors.black : Colors.white;
  Color get cardColor => _isDarkMode ? Colors.grey[900]! : Colors.grey[100]!;
  Color get textColor => _isDarkMode ? Colors.white : Colors.grey[900]!;
  Color get subtitleColor => _isDarkMode ? Colors.grey[400]! : Colors.grey[600]!;
  Color get borderColor => _isDarkMode ? Colors.grey[800]! : Colors.grey[300]!;
}
