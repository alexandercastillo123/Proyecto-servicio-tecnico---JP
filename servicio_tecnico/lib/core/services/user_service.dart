import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
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
    String? username,
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
        if (username != null) 'username': username,
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
  Future<ApiResponse<dynamic>> uploadPhoto(String filePath) async {
    try {
      final file = await http.MultipartFile.fromPath(
        'photo',
        filePath,
        contentType: MediaType('image', 'jpeg'), // Ajustar según sea necesario
      );

      return await _apiService.postMultipart<dynamic>(
        ApiConstants.uploadPhoto,
        {},
        file,
        requiresAuth: true,
      );
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Error al preparar la foto: ${e.toString()}',
      );
    }
  }
}
