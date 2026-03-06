import '../services/api_service.dart';
import '../constants/api_constants.dart';
import '../models/store.dart';

class StoreService {
  final ApiService _apiService = ApiService();

  /// Get all active stores
  Future<ApiResponse<List<Store>>> getStores() async {
    return await _apiService.get<List<Store>>(
      ApiConstants.sucursales,
      fromJson: (data) => (data as List).map((s) => Store.fromJson(s)).toList(),
    );
  }

  /// Get stores near a location
  Future<ApiResponse<List<Store>>> getNearbyStores({
    required double lat,
    required double lng,
    double radius = 10,
  }) async {
    return await _apiService.get<List<Store>>(
      '${ApiConstants.nearbyStores}?lat=$lat&lng=$lng&radius=$radius',
      fromJson: (data) => (data as List).map((s) => Store.fromJson(s)).toList(),
    );
  }

  /// Get store by ID
  Future<ApiResponse<Store>> getStoreById(int id) async {
    return await _apiService.get<Store>(
      ApiConstants.storeById(id),
      fromJson: (data) => Store.fromJson(data),
    );
  }
}
