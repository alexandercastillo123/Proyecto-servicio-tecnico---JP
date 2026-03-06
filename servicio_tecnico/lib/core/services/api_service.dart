import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiResponse<T> {
  final bool success;
  final String? message;
  final T? data;
  final dynamic errors;

  ApiResponse({required this.success, this.message, this.data, this.errors});

  factory ApiResponse.fromJson(Map<String, dynamic> json, T? data) {
    return ApiResponse(
      success: json['success'] ?? false,
      message: json['message'],
      data: data,
      errors: json['errors'],
    );
  }
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;

  void setToken(String token) {
    _token = token;
  }

  String? getToken() {
    return _token;
  }

  void clearToken() {
    _token = null;
  }

  Future<void> logout() async {
    _token = null;
    // Aquí se podría llamar a un endpoint de blacklist si fuera necesario
  }

  Map<String, String> _getHeaders({bool includeAuth = false}) {
    final headers = {'Content-Type': 'application/json'};

    if (includeAuth && _token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }

    return headers;
  }

  Future<ApiResponse<T>> get<T>(
    String url, {
    bool requiresAuth = false,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: _getHeaders(includeAuth: requiresAuth),
      );

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Error de conexión: ${e.toString()}',
      );
    }
  }

  Future<ApiResponse<T>> post<T>(
    String url,
    Map<String, dynamic> body, {
    bool requiresAuth = false,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: _getHeaders(includeAuth: requiresAuth),
        body: jsonEncode(body),
      );

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Error de conexión: ${e.toString()}',
      );
    }
  }

  Future<ApiResponse<T>> put<T>(
    String url,
    Map<String, dynamic> body, {
    bool requiresAuth = false,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await http.put(
        Uri.parse(url),
        headers: _getHeaders(includeAuth: requiresAuth),
        body: jsonEncode(body),
      );

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Error de conexión: ${e.toString()}',
      );
    }
  }

  Future<ApiResponse<T>> patch<T>(
    String url,
    Map<String, dynamic> body, {
    bool requiresAuth = false,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await http.patch(
        Uri.parse(url),
        headers: _getHeaders(includeAuth: requiresAuth),
        body: jsonEncode(body),
      );

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Error de conexión: ${e.toString()}',
      );
    }
  }

  Future<ApiResponse<T>> delete<T>(
    String url, {
    bool requiresAuth = false,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse(url),
        headers: _getHeaders(includeAuth: requiresAuth),
      );

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Error de conexión: ${e.toString()}',
      );
    }
  }

  Future<ApiResponse<T>> postMultipart<T>(
    String url,
    Map<String, String> fields,
    http.MultipartFile file, {
    bool requiresAuth = false,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final request = http.MultipartRequest('POST', Uri.parse(url));

      // Add headers
      final headers = _getHeaders(includeAuth: requiresAuth);
      headers.remove(
        'Content-Type',
      ); // http.MultipartRequest sets this automatically
      request.headers.addAll(headers);

      // Add fields
      request.fields.addAll(fields);

      // Add file
      request.files.add(file);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Error al subir archivo: ${e.toString()}',
      );
    }
  }

  ApiResponse<T> _handleResponse<T>(
    http.Response response,
    T Function(dynamic)? fromJson,
  ) {
    try {
      final jsonResponse = jsonDecode(response.body);

      // Map backend fields (exito, mensaje, resultado) to frontend (success, message, data)
      final bool success =
          jsonResponse['exito'] ??
          (response.statusCode >= 200 && response.statusCode < 300);
      final String? message = jsonResponse['mensaje'];
      final dynamic rawData = jsonResponse['resultado'];

      if (success) {
        T? data;
        if (fromJson != null && rawData != null) {
          data = fromJson(rawData);
        } else if (rawData != null && T == dynamic) {
          data = rawData as T;
        }

        return ApiResponse(success: true, message: message, data: data);
      } else {
        return ApiResponse(
          success: false,
          message: message ?? 'Error desconocido',
          errors: jsonResponse['errors'],
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Error al procesar respuesta: ${e.toString()}',
      );
    }
  }
}
