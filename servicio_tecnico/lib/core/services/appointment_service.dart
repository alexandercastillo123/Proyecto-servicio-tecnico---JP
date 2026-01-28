import '../services/api_service.dart';
import '../constants/api_constants.dart';

class AppointmentService {
  final ApiService _apiService = ApiService();

  /// Create new appointment
  Future<ApiResponse<Map<String, dynamic>>> createAppointment({
    required int technicianId,
    required String scheduledDate,
    required String scheduledTime,
    String? description,
  }) async {
    return await _apiService.post<Map<String, dynamic>>(
      ApiConstants.appointments,
      {
        'technicianId': technicianId,
        'scheduledDate': scheduledDate,
        'scheduledTime': scheduledTime,
        if (description != null) 'description': description,
      },
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Get all user appointments
  Future<ApiResponse<List<dynamic>>> getAppointments({String? status}) async {
    String url = ApiConstants.appointments;
    if (status != null) {
      url += '?status=$status';
    }

    return await _apiService.get<List<dynamic>>(
      url,
      requiresAuth: true,
      fromJson: (data) => data as List<dynamic>,
    );
  }

  /// Get appointment by ID
  Future<ApiResponse<Map<String, dynamic>>> getAppointmentById(int id) async {
    return await _apiService.get<Map<String, dynamic>>(
      ApiConstants.appointmentById(id),
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Update appointment status
  Future<ApiResponse<Map<String, dynamic>>> updateAppointmentStatus({
    required int id,
    required String status,
  }) async {
    return await _apiService.put<Map<String, dynamic>>(
      ApiConstants.appointmentStatus(id),
      {'status': status},
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Cancel appointment
  Future<ApiResponse<Map<String, dynamic>>> cancelAppointment(int id) async {
    return await _apiService.delete<Map<String, dynamic>>(
      ApiConstants.cancelAppointment(id),
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }
}
