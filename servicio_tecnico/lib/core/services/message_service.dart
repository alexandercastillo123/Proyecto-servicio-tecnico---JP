import '../services/api_service.dart';
import '../constants/api_constants.dart';

class MessageService {
  final ApiService _apiService = ApiService();

  /// Get list of conversations
  Future<ApiResponse<List<dynamic>>> getConversations() async {
    return await _apiService.get<List<dynamic>>(
      ApiConstants.conversations,
      requiresAuth: true,
      fromJson: (data) => data as List<dynamic>,
    );
  }

  /// Get messages with specific user
  Future<ApiResponse<List<dynamic>>> getMessages(int userId) async {
    return await _apiService.get<List<dynamic>>(
      ApiConstants.messagesWithUser(userId),
      requiresAuth: true,
      fromJson: (data) => data as List<dynamic>,
    );
  }

  /// Send text message
  Future<ApiResponse<Map<String, dynamic>>> sendMessage({
    required int receiverId,
    required String messageText,
    int? appointmentId,
    String messageType = 'text',
  }) async {
    return await _apiService.post<Map<String, dynamic>>(
      ApiConstants.sendMessage,
      {
        'receiverId': receiverId,
        'messageText': messageText,
        'messageType': messageType,
        if (appointmentId != null) 'appointmentId': appointmentId,
      },
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Send service offer
  Future<ApiResponse<Map<String, dynamic>>> sendOffer({
    required int receiverId,
    required double offerPrice,
    String? messageText,
    int? appointmentId,
  }) async {
    return await _apiService.post<Map<String, dynamic>>(
      ApiConstants.sendOffer,
      {
        'receiverId': receiverId,
        'offerPrice': offerPrice,
        if (messageText != null) 'messageText': messageText,
        if (appointmentId != null) 'appointmentId': appointmentId,
      },
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Accept offer
  Future<ApiResponse<Map<String, dynamic>>> acceptOffer(int offerId) async {
    return await _apiService.put<Map<String, dynamic>>(
      ApiConstants.acceptOffer(offerId),
      {},
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Reject offer
  Future<ApiResponse<Map<String, dynamic>>> rejectOffer(int offerId) async {
    return await _apiService.put<Map<String, dynamic>>(
      ApiConstants.rejectOffer(offerId),
      {},
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Cancel offer
  Future<ApiResponse<Map<String, dynamic>>> cancelOffer(int offerId) async {
    return await _apiService.put<Map<String, dynamic>>(
      ApiConstants.cancelOffer(offerId),
      {},
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Mark message as read
  Future<ApiResponse<Map<String, dynamic>>> markAsRead(int messageId) async {
    return await _apiService.put<Map<String, dynamic>>(
      ApiConstants.markAsRead(messageId),
      {},
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }
}
