import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';
import 'notification_service.dart';

class FirebaseService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final NotificationService _notificationService = NotificationService();
  static bool _initialized = false;

  static Future<void> initialize() async {
    // 1. Solicitar permisos de notificación a nivel del sistema operativo (Android 13+ y iOS)
    // Se ejecuta de inmediato para asegurar que el cuadro de diálogo de permisos se muestre al usuario
    await requestNotificationPermission();

    // 2. Inicializar Firebase si está configurado
    try {
      await Firebase.initializeApp();
      
      // Configurar mensajes en primer plano
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('Foreground message received: ${message.notification?.title}');
        }
        _showForegroundNotification(message);
      });

      // Manejar apertura de la app desde notificación
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('App opened from notification: ${message.notification?.title}');
        }
      });

    } catch (e) {
      if (kDebugMode) {
        print('Firebase init warning (google-services.json no configurado o omitido): $e');
      }
    }
  }

  /// Solicitar permisos de notificación (Android 13+ runtime permission y iOS)
  static Future<bool> requestNotificationPermission() async {
    try {
      if (Platform.isAndroid || Platform.isIOS) {
        final status = await Permission.notification.status;
        if (!status.isGranted) {
          final result = await Permission.notification.request();
          if (kDebugMode) {
            print('Notification permission result: $result');
          }
          return result.isGranted;
        }
        return true;
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error requesting OS notification permission: $e');
      }
    }

    try {
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      return settings.authorizationStatus == AuthorizationStatus.authorized;
    } catch (_) {
      return false;
    }
  }

  static void _showForegroundNotification(RemoteMessage message) {
    // Show a SnackBar or local notification when app is in foreground
    // This can be enhanced with flutter_local_notifications package
  }

  static Future<void> setupToken() async {
    try {
      String? token = await _messaging.getToken();
      
      if (token != null) {
        if (kDebugMode) {
          print('FCM Token: $token');
        }
        
        // Register token with backend
        String platform = Platform.isAndroid ? 'android' : 'ios';
        await _notificationService.registerToken(token, platform);
      }
      
      // Listen for token refreshes
      _messaging.onTokenRefresh.listen((newToken) {
        String platform = Platform.isAndroid ? 'android' : 'ios';
        _notificationService.registerToken(newToken, platform);
      });
      
    } catch (e) {
      if (kDebugMode) {
        print('Error setting up FCM token: $e');
      }
    }
  }

  static Future<void> deleteToken() async {
    try {
      String? token = await _messaging.getToken();
      if (token != null) {
        await _notificationService.removeToken(token);
        await _messaging.deleteToken();
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error deleting FCM token: $e');
      }
    }
  }
}