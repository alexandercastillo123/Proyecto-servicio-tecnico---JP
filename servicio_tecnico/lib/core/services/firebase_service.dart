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
    try {
      await Firebase.initializeApp();
      
      // Request notification permissions for Android 13+ and iOS
      await _requestNotificationPermission();
      
      // Configure foreground message handling
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('Foreground message received: ${message.notification?.title}');
        }
        // Show local notification or update UI
        _showForegroundNotification(message);
      });

      // Handle when app is opened from terminated state by tapping notification
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('App opened from notification: ${message.notification?.title}');
        }
      });

    } catch (e) {
      if (kDebugMode) {
        print('Error initializing Firebase: $e');
      }
    }
  }

  static Future<void> _requestNotificationPermission() async {
    // Android 13+ requires runtime permission
    if (Platform.isAndroid) {
      final status = await Permission.notification.status;
      if (status.isDenied) {
        final result = await Permission.notification.request();
        if (kDebugMode) {
          print('Notification permission result: $result');
        }
      }
    }

    // Also call Firebase's permission for iOS and cross-platform
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (kDebugMode) {
      print('User granted permission: ${settings.authorizationStatus}');
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