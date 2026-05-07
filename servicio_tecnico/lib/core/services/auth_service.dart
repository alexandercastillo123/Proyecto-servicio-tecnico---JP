import 'api_service.dart';
import '../constants/api_constants.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  /// Register new user
  Future<ApiResponse<Map<String, dynamic>>> register({
    required String email,
    required String password,
    required String role,
    required String personType,
    String? username, // Nuevo campo
    String? names,
    String? surnames,
    String? dni,
    String? companyName,
    String? ruc,
    String? phone,
    String? referenceAddress,
    String? address,
    String? city,
    double? latitude,
    double? longitude,
    List<Map<String, dynamic>>? schedules,
    bool policiesAccepted = false,
  }) async {
    final response = await _apiService
        .post<Map<String, dynamic>>(ApiConstants.register, {
          'email': email,
          'username': username,
          'password': password,
          'role': role,
          'personType': personType,
          'policiesAccepted': policiesAccepted,
          if (names != null) 'names': names,
          if (surnames != null) 'surnames': surnames,
          if (dni != null) 'dni': dni,
          if (companyName != null) 'companyName': companyName,
          if (ruc != null) 'ruc': ruc,
          if (phone != null) 'phone': phone,
          if (referenceAddress != null) 'referenceAddress': referenceAddress,
          if (address != null) 'address': address,
          if (city != null) 'city': city,
          if (latitude != null) 'latitude': latitude,
          if (longitude != null) 'longitude': longitude,
          if (schedules != null) 'schedules': schedules,
        }, fromJson: (data) => data as Map<String, dynamic>);

    // Save token if registration successful
    if (response.success && response.data?['token'] != null) {
      _apiService.setToken(response.data!['token']);
    }

    return response;
  }

  /// Login user
  Future<ApiResponse<Map<String, dynamic>>> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      ApiConstants.login,
      {'email': email, 'password': password},
      fromJson: (data) => data as Map<String, dynamic>,
    );

    // Save token if login successful
    if (response.success && response.data?['token'] != null) {
      _apiService.setToken(response.data!['token']);
    }

    return response;
  }

  /// Request password reset
  Future<ApiResponse<Map<String, dynamic>>> forgotPassword({
    required String email,
  }) async {
    return await _apiService.post<Map<String, dynamic>>(
      ApiConstants.forgotPassword,
      {'email': email},
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Verify reset code
  Future<ApiResponse<Map<String, dynamic>>> verifyCode({
    required String email,
    required String code,
  }) async {
    return await _apiService.post<Map<String, dynamic>>(
      ApiConstants.verifyCode,
      {'email': email, 'code': code},
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Reset password
  Future<ApiResponse<Map<String, dynamic>>> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    return await _apiService.post<Map<String, dynamic>>(
      ApiConstants.resetPassword,
      {'email': email, 'code': code, 'newPassword': newPassword},
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Validate email existence and availability
  Future<ApiResponse<Map<String, dynamic>>> validateEmail(String email) async {
    return await _apiService.post<Map<String, dynamic>>(
      ApiConstants.validateEmail,
      {'email': email},
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Validate username availability
  Future<ApiResponse<Map<String, dynamic>>> validateUsername(
    String username,
  ) async {
    return await _apiService.post<Map<String, dynamic>>(
      ApiConstants.validateUsername,
      {'username': username},
      fromJson: (data) => data as Map<String, dynamic>,
    );
  }

  /// Logout (clear token)
  void logout() {
    _apiService.clearToken();
  }

  /// Check if user is authenticated
  bool isAuthenticated() {
    return _apiService.getToken() != null;
  }
}
