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

  static Future<void> saveRole(String role) async {
    var box = Hive.box(_settingsBox);
    await box.put('user_role', role);
  }

  static String? getRole() {
    var box = Hive.box(_settingsBox);
    return box.get('user_role');
  }

  static Future<void> saveUserId(int id) async {
    var box = Hive.box(_settingsBox);
    await box.put('user_id', id);
  }

  static int? getUserId() {
    var box = Hive.box(_settingsBox);
    return box.get('user_id');
  }

  static Future<void> saveLastActivity() async {
    var box = Hive.box(_settingsBox);
    await box.put('last_activity', DateTime.now().millisecondsSinceEpoch);
  }

  static int? getLastActivity() {
    var box = Hive.box(_settingsBox);
    return box.get('last_activity');
  }

  static Future<void> clearAuth() async {
    var box = Hive.box(_settingsBox);
    await box.delete('auth_token');
    await box.delete('user_profile');
    await box.delete('user_role');
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

  // Instance methods for generic access
  Future<void> saveData(String key, dynamic value) async {
    var box = Hive.box(_settingsBox);
    await box.put(key, value);
  }

  Future<T?> getData<T>(String key) async {
    var box = Hive.box(_settingsBox);
    final data = box.get(key);
    if (data == null) return null;
    return data as T;
  }
}
