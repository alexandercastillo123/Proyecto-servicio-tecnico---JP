import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'notification_service.dart';

class FirebaseService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final NotificationService _notificationService = NotificationService();

  static Future<void> initialize() async {
    try {
      await Firebase.initializeApp();
      
      // Request permissions (iOS/macOS)
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (kDebugMode) {
        print('User granted permission: ${settings.authorizationStatus}');
      }

      // Configure foreground message handling
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('Foreground message received: ${message.notification?.title}');
        }
        // Here you could show a local notification if you use flutter_local_notifications
      });

      // Background message handler is set in main.dart as a top-level function

    } catch (e) {
      if (kDebugMode) {
        print('Error initializing Firebase: $e');
      }
    }
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
}
