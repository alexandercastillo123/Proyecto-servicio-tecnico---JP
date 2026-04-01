class ApiConstants {
  // Base URL - Use 10.0.2.2 for Android Emulator, or your local IP for physical devices
  static const String baseUrl = 'http://10.0.2.2:3000/api';

  // Your machine's local IP (useful for physical devices)
  // static const String baseUrl = 'http://192.168.1.57:3000/api';

  // Authentication Endpoints
  static const String register = '$baseUrl/auth/register';
  static const String login = '$baseUrl/auth/login';
  static const String forgotPassword = '$baseUrl/auth/forgot-password';
  static const String verifyCode = '$baseUrl/auth/verify-code';
  static const String resetPassword = '$baseUrl/auth/reset-password';

  // User Endpoints
  static const String userProfile = '$baseUrl/users/profile';
  static const String updateProfile = '$baseUrl/users/profile';
  static const String uploadPhoto = '$baseUrl/users/profile/photo';
  static String getUserById(int id) => '$baseUrl/users/$id';

  // Technician Endpoints
  static const String technicians = '$baseUrl/technicians';
  static String technicianById(int id) => '$baseUrl/technicians/$id';
  static String technicianSchedule(int id) =>
      '$baseUrl/technicians/$id/schedule';
  static const String createSchedule = '$baseUrl/technicians/schedule';
  static String updateSchedule(int id) => '$baseUrl/technicians/schedule/$id';
  static const String addReview = '$baseUrl/technicians/review';
  static String technicianReviews(int id) => '$baseUrl/technicians/$id/reviews';

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

  // Health Check
  static const String health = 'http://localhost:3000/health';
}
