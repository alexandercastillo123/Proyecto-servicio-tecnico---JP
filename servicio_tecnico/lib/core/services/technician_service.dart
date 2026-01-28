import '../services/api_service.dart';
import '../constants/api_constants.dart';
import '../../features/technicians/domain/models/technician.dart';

class TechnicianService {
  final ApiService _apiService = ApiService();

  /// Get list of technicians with optional filters
  Future<ApiResponse<List<Technician>>> getTechnicians({
    String? city,
    double? minRating,
    int page = 1,
    int limit = 10,
  }) async {
    String url = ApiConstants.technicians;

    final queryParams = <String, String>{};
    if (city != null) queryParams['city'] = city;
    if (minRating != null) queryParams['minRating'] = minRating.toString();
    queryParams['page'] = page.toString();
    queryParams['limit'] = limit.toString();

    if (queryParams.isNotEmpty) {
      url +=
          '?${queryParams.entries.map((e) => '${e.key}=${e.value}').join('&')}';
    }

    final response = await _apiService.get<List<Technician>>(
      url,
      fromJson: (data) {
        final technicians = (data['technicians'] as List)
            .map((json) => Technician.fromJson(json))
            .toList();
        return technicians;
      },
    );

    return response;
  }

  /// Get technician by ID with schedule
  Future<ApiResponse<Map<String, dynamic>>> getTechnicianById(int id) async {
    return await _apiService.get<Map<String, dynamic>>(
      ApiConstants.technicianById(id),
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Get technician schedule
  Future<ApiResponse<List<dynamic>>> getTechnicianSchedule(int id) async {
    return await _apiService.get<List<dynamic>>(
      ApiConstants.technicianSchedule(id),
      fromJson: (data) => data as List<dynamic>,
    );
  }

  /// Create/update technician schedule (requires auth, tech only)
  Future<ApiResponse<Map<String, dynamic>>> createSchedule({
    required List<Map<String, dynamic>> schedules,
  }) async {
    return await _apiService.post<Map<String, dynamic>>(
      ApiConstants.createSchedule,
      {'schedules': schedules},
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Add review for a technician
  Future<ApiResponse<Map<String, dynamic>>> addReview({
    required int technicianId,
    required int rating,
    String? comment,
    int? appointmentId,
  }) async {
    return await _apiService.post<Map<String, dynamic>>(
      ApiConstants.addReview,
      {
        'technicianId': technicianId,
        'rating': rating,
        if (comment != null) 'comment': comment,
        if (appointmentId != null) 'appointmentId': appointmentId,
      },
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }
}
