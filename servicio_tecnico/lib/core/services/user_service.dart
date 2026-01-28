import '../services/api_service.dart';
import '../constants/api_constants.dart';

class UserService {
  final ApiService _apiService = ApiService();

  /// Get authenticated user's profile
  Future<ApiResponse<Map<String, dynamic>>> getProfile() async {
    return await _apiService.get<Map<String, dynamic>>(
      ApiConstants.userProfile,
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Update user profile
  Future<ApiResponse<Map<String, dynamic>>> updateProfile({
    String? phone,
    String? address,
    String? city,
    String? names,
    String? surnames,
    String? dni,
    String? companyName,
    String? ruc,
    String? referenceAddress,
  }) async {
    return await _apiService.put<Map<String, dynamic>>(
      ApiConstants.updateProfile,
      {
        if (phone != null) 'phone': phone,
        if (address != null) 'address': address,
        if (city != null) 'city': city,
        if (names != null) 'names': names,
        if (surnames != null) 'surnames': surnames,
        if (dni != null) 'dni': dni,
        if (companyName != null) 'companyName': companyName,
        if (ruc != null) 'ruc': ruc,
        if (referenceAddress != null) 'referenceAddress': referenceAddress,
      },
      requiresAuth: true,
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Get user by ID (public profile)
  Future<ApiResponse<Map<String, dynamic>>> getUserById(int id) async {
    return await _apiService.get<Map<String, dynamic>>(
      ApiConstants.getUserById(id),
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  // Note: Photo upload requires multipart/form-data
  // Will need a separate implementation with http.MultipartRequest
}
