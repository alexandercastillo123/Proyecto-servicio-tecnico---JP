class ApiConstants {
  // Base URL - Use 10.0.2.2 for Android Emulator, or your local IP for physical devices
  static const String baseUrl = 'http://10.0.2.2:3000/api';
  
  // Storage URL for static files (images, etc)
  static const String storageUrl = 'http://10.0.2.2:3000/uploads';

  // Your machine's local IP (useful for physical devices)
  // static const String baseUrl = 'http://192.168.1.57:3000/api';
  // static const String storageUrl = 'http://192.168.1.57:3000/uploads';

  // Authentication Endpoints
  static const String auth = '$baseUrl/auth';
  static const String register = '$auth/register';
  static const String login = '$auth/login';
  static const String forgotPassword = '$auth/forgot-password';
  static const String verifyCode = '$auth/verify-code';
  static const String resetPassword = '$auth/reset-password';
  static const String validateEmail = '$auth/validate-email';
  static const String validateUsername = '$auth/validate-username';

  // User Endpoints
  static const String userProfile = '$baseUrl/users/profile';
  static const String updateProfile = '$baseUrl/users/profile';
  static const String uploadPhoto = '$baseUrl/users/profile/photo';
  static const String toggleAvailability = '$baseUrl/users/availability';
  static String getUserById(int id) => '$baseUrl/users/$id';

  // Technician Endpoints
  static const String technicians = '$baseUrl/technicians';
  static String technicianById(int id) => '$baseUrl/technicians/$id';
  static String technicianSchedule(int id) =>
      '$baseUrl/technicians/$id/schedule';
  static const String createSchedule = '$baseUrl/technicians/schedule';
  static String updateSchedule(int id) => '$baseUrl/technicians/schedule/$id';
  static const String addReview = '$baseUrl/technicians/review';

  // Appointment Endpoints
  static const String appointments = '$baseUrl/appointments';
  static String appointmentById(int id) => '$baseUrl/appointments/$id';
  static String appointmentStatus(int id) => '$baseUrl/appointments/$id/status';
  static String cancelAppointment(int id) => '$baseUrl/appointments/$id';

  // Message Endpoints
  static const String conversations = '$baseUrl/messages/conversations';
  static String messagesWithUser(int userId) => '$baseUrl/messages/$userId';
  static const String sendMessage = '$baseUrl/messages';
  static const String sendOffer = '$baseUrl/messages/offer';
  static String acceptOffer(int id) => '$baseUrl/messages/offer/$id/accept';
  static String rejectOffer(int id) => '$baseUrl/messages/offer/$id/reject';
  static String cancelOffer(int id) => '$baseUrl/messages/offer/$id/cancel';
  static String markAsRead(int id) => '$baseUrl/messages/$id/read';

  /// Helper to get the full storage URL for an image path
  static String getStorageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    
    // Remove leading slash if any
    String cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Remove "uploads/" prefix if it exists in the stored path
    if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.substring(8);
    }
    
    return '$storageUrl/$cleanPath';
  }

  // Store / Sucursales Endpoints
  static const String sucursales = '$baseUrl/sucursales';
  static const String myStore = '$baseUrl/sucursales/my-store';
  static const String nearbyStores = '$baseUrl/sucursales/nearby';
  static String storeById(int id) => '$baseUrl/sucursales/$id';
  static String storeProducts(int id) => '$baseUrl/sucursales/$id/products';
  static const String addStoreProduct = '$baseUrl/sucursales/products';
  static String updateStoreProduct(int id) => '$baseUrl/sucursales/products/$id';
  static String deleteStoreProduct(int id) => '$baseUrl/sucursales/products/$id';
  static String updateStore(int id) => '$baseUrl/sucursales/$id';
  static String deleteStore(int id) => '$baseUrl/sucursales/$id';
  static String storeSchedules(int id) => '$baseUrl/sucursales/$id/schedules';
  static String storeReviews(int id) => '$baseUrl/sucursales/$id/reviews';
  static String updateStoreStatus(int id) => '$baseUrl/sucursales/$id/status';
  static const String uploadStoreImage = '$baseUrl/sucursales/upload-image';
  static const String uploadProductImage = '$baseUrl/sucursales/products/upload-image';
  
  // Store Order Endpoints
  // Store Order Endpoints
  static const String createStoreOrder = '$baseUrl/sucursales/orders';
  static const String myOrders = '$baseUrl/sucursales/orders/my-orders';
  static String storeOrders(int id) => '$baseUrl/sucursales/orders/store/$id';
  static String updateOrderStatus(int id) => '$baseUrl/sucursales/orders/$id/status';

  // Health Check
  static const String health = 'http://localhost:3000/health';
}
