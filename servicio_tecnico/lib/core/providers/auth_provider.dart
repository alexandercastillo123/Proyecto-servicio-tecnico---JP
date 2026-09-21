import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import '../models/user.dart';
import '../services/firebase_service.dart';
import '../services/socket_service.dart';

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
        // Configurar token de notificaciones push (funciona aunque la app esté cerrada)
        FirebaseService.setupToken();
        // Inicializar Socket.IO para tiempo real en chat
        final token = _apiService.getToken();
        if (token != null) {
          SocketService().init(userId: _user!.id, authToken: token);
        }
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
    SocketService().dispose();
    await FirebaseService.deleteToken();
    await _apiService.logout();
    _user = null;
    notifyListeners();
  }

  // Llamado al iniciar la app si ya hay token guardado (app en background/cerrada)
  Future<void> initializeFromToken() async {
    final token = _apiService.getToken();
    if (token != null) {
      FirebaseService.setupToken();
    }
  }
}