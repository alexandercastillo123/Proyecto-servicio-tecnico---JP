import 'dart:io';
import 'package:flutter/material.dart';
import 'package:servicio_tecnico_app/core/services/camera_service.dart';
import 'package:servicio_tecnico_app/core/services/local_cache_service.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/theme_provider.dart';
import 'core/services/firebase_service.dart';
import 'core/services/socket_service.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';


@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // await Firebase.initializeApp(); // Only if needed for background DB access
  print("Handling a background message: ${message.messageId}");
}

Future<void> main() async {
  HttpOverrides.global = MyHttpOverrides();
  WidgetsFlutterBinding.ensureInitialized();

  // Inicializar Hive para caché local
  await LocalCacheService.init();

  // Pre-iniciacion de uso de la camara
  await CameraService().initialize();

  // Inicializar Firebase para notificaciones
  await FirebaseService.initialize();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Navegar al abrir la app desde una notificación push (app cerrada/background/tap)
  FirebaseService.onNotificationTap = (data) {
    final type = data['type'];
    final rawId = data['appointmentId'] ?? data['related_id'] ?? data['orderId'];
    final id = int.tryParse(rawId?.toString() ?? '');
    if (id == null || id <= 0) return;
    switch (type) {
      case 'appointment':
        appRouter.go('/appointment-details/$id');
        break;
      case 'order':
        // La data de orden no incluye amount/description; abre directamente
        appRouter.go('/order-details/$id');
        break;
    }
  };

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    return MaterialApp.router(
      title: 'Servicio Técnico J&P',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeProvider.themeMode,
      routerConfig: appRouter,
      debugShowCheckedModeBanner: false,
    );
  }
}

class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback =
          (X509Certificate cert, String host, int port) => true;
  }
}
