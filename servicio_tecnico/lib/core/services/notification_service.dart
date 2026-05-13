import 'api_service.dart';
import '../constants/api_constants.dart';

class NotificationService {
  final ApiService _apiService = ApiService();

  Future<ApiResponse<Map<String, dynamic>>> getSettings() async {
    return await _apiService.get<Map<String, dynamic>>(
      ApiConstants.notificationSettings,
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  Future<ApiResponse<Map<String, dynamic>>> updateSettings({
    required bool appointmentsReminders,
    required bool chatNotifications,
    required bool orderUpdates,
  }) async {
    return await _apiService.put<Map<String, dynamic>>(
      ApiConstants.notificationSettings,
      {
        'appointmentsReminders': appointmentsReminders,
        'chatNotifications': chatNotifications,
        'orderUpdates': orderUpdates,
      },
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  Future<ApiResponse<List<dynamic>>> getNotifications() async {
    return await _apiService.get<List<dynamic>>(
      ApiConstants.notifications,
      requiresAuth: true,
      fromJson: (data) => data as List<dynamic>,
    );
  }

  Future<ApiResponse<dynamic>> markAsRead(int id) async {
    return await _apiService.put<dynamic>(
      ApiConstants.markNotificationAsRead(id),
      {},
      requiresAuth: true,
    );
  }

  Future<ApiResponse<dynamic>> registerToken(String token, String platform) async {
    return await _apiService.post<dynamic>(
      ApiConstants.registerFcmToken,
      {
        'token': token,
        'platform': platform,
      },
      requiresAuth: true,
    );
  }
}
