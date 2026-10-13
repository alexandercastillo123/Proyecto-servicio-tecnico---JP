import 'api_service.dart';
import '../constants/api_constants.dart';
import '../models/store.dart';
import '../models/store_product.dart';

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

  /// Get store for authenticated user
  Future<ApiResponse<Store>> getMyStore() async {
    return await _apiService.get<Store>(
      ApiConstants.myStore,
      requiresAuth: true,
      fromJson: (data) => Store.fromJson(data),
    );
  }

  /// Create a new store
  Future<ApiResponse<dynamic>> createStore(Map<String, dynamic> storeData) async {
    return await _apiService.post(
      ApiConstants.sucursales,
      storeData,
      requiresAuth: true,
    );
  }

  /// Update an existing store
  Future<ApiResponse<dynamic>> updateStore(int id, Map<String, dynamic> storeData) async {
    return await _apiService.put(
      ApiConstants.updateStore(id),
      storeData,
      requiresAuth: true,
    );
  }

  /// Delete a store
  Future<ApiResponse<dynamic>> deleteStore(int id) async {
    return await _apiService.delete(
      ApiConstants.deleteStore(id),
      requiresAuth: true,
    );
  }

  /// Get products for a store
  Future<ApiResponse<List<StoreProduct>>> getStoreProducts(int id) async {
    return await _apiService.get<List<StoreProduct>>(
      ApiConstants.storeProducts(id),
      fromJson: (data) => (data as List).map((p) => StoreProduct.fromJson(p)).toList(),
    );
  }

  /// Add a product to a store
  Future<ApiResponse<dynamic>> addStoreProduct(Map<String, dynamic> productData) async {
    return await _apiService.post(
      ApiConstants.addStoreProduct,
      productData,
      requiresAuth: true,
    );
  }

  /// Update a store product
  Future<ApiResponse<dynamic>> updateStoreProduct(int id, Map<String, dynamic> productData) async {
    return await _apiService.put(
      ApiConstants.updateStoreProduct(id),
      productData,
      requiresAuth: true,
    );
  }

  /// Delete a store product
  Future<ApiResponse<dynamic>> deleteStoreProduct(int id) async {
    return await _apiService.delete(
      ApiConstants.deleteStoreProduct(id),
      requiresAuth: true,
    );
  }

  /// Get store schedules
  Future<ApiResponse<List<Map<String, dynamic>>>> getStoreSchedules(int id) async {
    return await _apiService.get<List<Map<String, dynamic>>>(
      ApiConstants.storeSchedules(id),
      fromJson: (data) => (data as List).map((s) => s as Map<String, dynamic>).toList(),
    );
  }

  /// Get store reviews
  Future<ApiResponse<List<Map<String, dynamic>>>> getStoreReviews(int id) async {
    return await _apiService.get<List<Map<String, dynamic>>>(
      ApiConstants.storeReviews(id),
      fromJson: (data) => (data as List).map((r) => r as Map<String, dynamic>).toList(),
    );
  }

  /// Add store review
  Future<ApiResponse<dynamic>> addStoreReview(int id, int rating, String comment) async {
    return await _apiService.post(
      ApiConstants.storeReviews(id),
      {'rating': rating, 'comment': comment},
      requiresAuth: true,
    );
  }

  /// Update store status
  Future<ApiResponse<dynamic>> updateStoreStatus(int id, String status) async {
    return await _apiService.patch(
      ApiConstants.updateStoreStatus(id),
      {'status': status},
      requiresAuth: true,
    );
  }

  /// Upload store image
  Future<ApiResponse<String>> uploadStoreImage(String filePath) async {
    return await _apiService.uploadFile(
      ApiConstants.uploadStoreImage,
      filePath,
      fieldName: 'image',
      fromJson: (json) => json['url'] as String,
    );
  }

  /// Upload product image
  Future<ApiResponse<String>> uploadProductImage(String filePath) async {
    return await _apiService.uploadFile(
      ApiConstants.uploadProductImage,
      filePath,
      fieldName: 'image',
      fromJson: (json) => json['url'] as String,
    );
  }

  /// Create a new store order
  Future<ApiResponse<dynamic>> createOrder({
    required int productId,
    required int quantity,
    required String address,
    double? lat,
    double? lng,
  }) async {
    return await _apiService.post(
      ApiConstants.createStoreOrder,
      {
        'product_id': productId,
        'quantity': quantity,
        'delivery_address': address,
        'latitude': lat,
        'longitude': lng,
      },
      requiresAuth: true,
    );
  }

  /// Create a new multi-product store order
  Future<ApiResponse<dynamic>> createMultiProductOrder({
    required List<Map<String, dynamic>> products,
    required String address,
    double? lat,
    double? lng,
  }) async {
    return await _apiService.post(
      ApiConstants.createStoreOrder,
      {
        'products': products,
        'delivery_address': address,
        'latitude': lat,
        'longitude': lng,
      },
      requiresAuth: true,
    );
  }

  /// Obtener pedidos pendientes de un cliente (para el cliente)
  Future<ApiResponse<List<Map<String, dynamic>>>> getMyOrders() async {
    return await _apiService.get<List<Map<String, dynamic>>>(
      ApiConstants.myOrders,
      requiresAuth: true,
      fromJson: (data) => (data as List).map((o) => o as Map<String, dynamic>).toList(),
    );
  }

  /// Obtener pedidos de una sucursal (para el dueño)
  Future<ApiResponse<List<Map<String, dynamic>>>> getStoreOrders(int storeId) async {
    return await _apiService.get<List<Map<String, dynamic>>>(
      ApiConstants.storeOrders(storeId),
      requiresAuth: true,
      fromJson: (data) => (data as List).map((o) => o as Map<String, dynamic>).toList(),
    );
  }

  /// Actualizar el estado de un pedido (dueño o cliente)
  Future<ApiResponse<dynamic>> updateOrderStatus(int orderId, String status) async {
    return await _apiService.patch(
      ApiConstants.updateOrderStatus(orderId),
      {'status': status},
      requiresAuth: true,
    );
  }

  /// Cliente paga un pedido con método manual (Yape, Plin, Transfer, Cash)
  Future<ApiResponse<dynamic>> payOrder(int orderId, String paymentMethod) async {
    return await _apiService.post(
      ApiConstants.payOrder(orderId),
      {'paymentMethod': paymentMethod},
      requiresAuth: true,
    );
  }

  /// Tienda confirma que recibió el pago manual de un pedido
  Future<ApiResponse<dynamic>> confirmOrderPayment(int orderId) async {
    return await _apiService.post(
      ApiConstants.confirmOrderPayment(orderId),
      {},
      requiresAuth: true,
    );
  }

  /// Pagar un pedido con Culqi (TEST MODE)
  Future<ApiResponse<dynamic>> culqiPayOrder(int orderId, String culqiToken) async {
    return await _apiService.post(
      ApiConstants.culqiPayOrder(orderId),
      {'culqiToken': culqiToken},
      requiresAuth: true,
    );
  }
}
