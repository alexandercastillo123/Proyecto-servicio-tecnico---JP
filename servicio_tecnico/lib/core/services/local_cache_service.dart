import 'package:hive_flutter/hive_flutter.dart';

class LocalCacheService {
  static const String _settingsBox = 'settings';
  static const String _dataBox = 'app_data';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_settingsBox);
    await Hive.openBox(_dataBox);
  }

  // Settings Cache (Tokens, Theme, etc)
  static Future<void> saveToken(String token) async {
    var box = Hive.box(_settingsBox);
    await box.put('auth_token', token);
  }

  static String? getToken() {
    var box = Hive.box(_settingsBox);
    return box.get('auth_token');
  }

  static Future<void> clearAuth() async {
    var box = Hive.box(_settingsBox);
    await box.delete('auth_token');
    await box.delete('user_profile');
  }

  // Data Cache (Recent technicians, offline mode)
  static Future<void> cacheData(String key, dynamic data) async {
    var box = Hive.box(_dataBox);
    await box.put(key, data);
  }

  static dynamic getCachedData(String key) {
    var box = Hive.box(_dataBox);
    return box.get(key);
  }
}
