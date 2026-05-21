import 'package:flutter/material.dart';
import '../services/local_cache_service.dart';

class ThemeProvider with ChangeNotifier {
  final LocalCacheService _cacheService = LocalCacheService();
  ThemeMode _themeMode = ThemeMode.light;

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final isDark = await _cacheService.getData<bool>('isDarkMode') ?? false;
    _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }

  Future<void> toggleTheme(bool isDark) async {
    try {
      _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
      notifyListeners();
      await _cacheService.saveData('isDarkMode', isDark);
    } catch (e) {
      debugPrint('Error saving theme: $e');
    }
  }
}
