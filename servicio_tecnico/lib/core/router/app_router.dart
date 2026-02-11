import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/screens/role_selection_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/person_type_selection_screen.dart';
import '../../features/home/presentation/screens/provider_home_screen.dart';
import '../../features/home/presentation/screens/client_home_screen.dart';
import '../../features/technicians/presentation/screens/technician_list_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/presentation/screens/verification_code_screen.dart';
import '../../features/auth/presentation/screens/reset_password_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/technicians/presentation/screens/technician_profile_screen.dart';
import '../../features/appointments/presentation/screens/appointment_scheduling_screen.dart';
import '../../features/chat/presentation/screens/chat_screen.dart';
import '../../features/profile/presentation/screens/provider_profile_screen.dart';
import '../../features/profile/presentation/screens/change_photo_screen.dart';
import '../../features/profile/presentation/screens/edit_data_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/login', // Login is now the start
  routes: [
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    // Forgot Password Flow
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordScreen(),
    ),
    // ...
    GoRoute(
      path: '/forgot-password/verify',
      builder: (context, state) {
        final email = state.uri.queryParameters['email'] ?? '';
        return VerificationCodeScreen(email: email);
      },
    ),
    GoRoute(
      path: '/forgot-password/reset',
      builder: (context, state) {
        final email = state.uri.queryParameters['email'] ?? '';
        final code = state.uri.queryParameters['code'] ?? '';
        return ResetPasswordScreen(email: email, code: code);
      },
    ),
    // Register/Role Selection
    GoRoute(
      path: '/role-selection',
      builder: (context, state) => const RoleSelectionScreen(),
    ),
    // Register Flow
    GoRoute(
      path: '/register/type-selection',
      builder: (context, state) => const PersonTypeSelectionScreen(),
    ),
    GoRoute(
      path: '/register/form',
      builder: (context, state) {
        final role = state.uri.queryParameters['role'];
        final type =
            state.uri.queryParameters['type']; // 'natural' or 'juridical'
        return RegisterScreen(role: role, personType: type);
      },
    ),
    GoRoute(
      path: '/client-home',
      builder: (context, state) => const ClientHomeScreen(),
    ),
    GoRoute(
      path: '/technician-list',
      builder: (context, state) => const TechnicianListScreen(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const ProviderHomeScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/provider-profile',
      builder: (context, state) => const ProviderProfileScreen(),
    ),
    GoRoute(
      path: '/change-photo',
      builder: (context, state) => const ChangePhotoScreen(),
    ),
    GoRoute(
      path: '/edit-data',
      builder: (context, state) => const EditDataScreen(),
    ),
    GoRoute(
      path: '/technician-profile',
      builder: (context, state) => const TechnicianProfileScreen(),
    ),
    GoRoute(
      path: '/appointment-scheduling',
      builder: (context, state) => const AppointmentSchedulingScreen(),
    ),
    GoRoute(path: '/chat', builder: (context, state) => const ChatScreen()),
  ],
);
