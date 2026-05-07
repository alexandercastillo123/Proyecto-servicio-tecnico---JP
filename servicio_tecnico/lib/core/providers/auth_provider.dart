import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  User? _user;
  bool _isLoading = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _apiService.getToken() != null;

  Future<ApiResponse<User>> loadProfile() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get<User>(
        ApiConstants.userProfile,
        requiresAuth: true,
        fromJson: (data) => User.fromJson(data),
      );

      if (response.success && response.data != null) {
        _user = response.data;
      }

      _isLoading = false;
      notifyListeners();
      return response;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return ApiResponse(success: false, message: e.toString());
    }
  }

  Future<ApiResponse<dynamic>> toggleAvailability(bool available) async {
    if (_user == null)
      return ApiResponse(success: false, message: 'No user loaded');

    try {
      final response = await _apiService.patch(
        ApiConstants.toggleAvailability,
        {'is_available': available},
        requiresAuth: true,
      );

      if (response.success) {
        _user!.isAvailable = available;
        notifyListeners();
      }

      return response;
    } catch (e) {
      return ApiResponse(success: false, message: e.toString());
    }
  }

  void setUser(User? user) {
    _user = user;
    notifyListeners();
  }

  Future<void> logout() async {
    await _apiService.logout();
    _user = null;
    notifyListeners();
  }
}
