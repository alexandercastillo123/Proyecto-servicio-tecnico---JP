import 'dart:convert';
import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'notification_service.dart';

class FirebaseService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final NotificationService _notificationService = NotificationService();
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'high_importance',
    'Notificaciones',
    description: 'Notificaciones de J&P Periféricos',
    importance: Importance.max,
    playSound: true,
  );

  /// Callback opcional para navegar desde una notificación.
  /// Asignar en main() antes de runApp.
  static void Function(Map<String, dynamic> data)? onNotificationTap;

  static bool _initialized = false;

  static Future<void> initialize() async {
    await _initLocalNotifications();
    await requestNotificationPermission();

    try {
      await Firebase.initializeApp();

      FirebaseMessaging.onMessage.listen(_onMessage);
      FirebaseMessaging.onMessageOpenedApp.listen(_onMessageOpenedApp);
      _checkInitialMessage();

      _messaging.onTokenRefresh.listen((token) {
        final platform = Platform.isAndroid ? 'android' : 'ios';
        _notificationService.registerToken(token, platform);
      });
    } catch (e) {
      if (kDebugMode) {
        print('Firebase init warning (google-services.json / GoogleService-Info.plist no configurados): $e');
      }
    }
  }

  static Future<void> _initLocalNotifications() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const settings = InitializationSettings(android: android, iOS: ios);

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: (response) async {
        final payload = response.payload;
        if (payload != null && payload.isNotEmpty) {
          try {
            onNotificationTap?.call(jsonDecode(payload) as Map<String, dynamic>);
          } catch (e) {
            if (kDebugMode) print('Error parsing notification payload: $e');
          }
        }
      },
    );

    final androidPlugin = _localNotifications.resolvePlatformSpecificPlugin();
    if (androidPlugin != null) {
      await androidPlugin.createNotificationChannel(_channel);
    }
  }

  static Future<bool> requestNotificationPermission() async {
    try {
      if (Platform.isAndroid || Platform.isIOS) {
        final status = await Permission.notification.status;
        if (!status.isGranted && !status.isLimited) {
          final result = await Permission.notification.request();
          if (result.isPermanentlyDenied) {
            if (kDebugMode) print('Notification permission permanently denied; opening settings.');
            openAppSettings();
          }
          return result.isGranted || result.isLimited;
        }
        return status.isGranted || status.isLimited;
      }
    } catch (e) {
      if (kDebugMode) print('Error requesting OS notification permission: $e');
    }

    // iOS: solicitar vía Firebase Messaging como fallback
    try {
      final settings = await _messaging.requestPermission(
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

  static void _onMessage(RemoteMessage message) {
    if (kDebugMode) print('Foreground message received: ${message.notification?.title}');
    _showLocalNotification(message);
  }

  static void _onMessageOpenedApp(RemoteMessage message) {
    if (kDebugMode) print('App opened from notification: ${message.notification?.title}');
    if (message.data.isNotEmpty) onNotificationTap?.call(message.data);
  }

  static void _showLocalNotification(RemoteMessage message) {
    final notif = message.notification;
    if (notif == null) return;

    _localNotifications.show(
      notif.hashCode,
      notif.title,
      notif.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: _channel.importance,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: jsonEncode(message.data),
    );
  }

  static Future<void> _checkInitialMessage() async {
    try {
      final RemoteMessage? message = await _messaging.getInitialMessage();
      if (message != null) _onMessageOpenedApp(message);
    } catch (e) {
      if (kDebugMode) print('Error checking initial message: $e');
    }
  }

  static Future<void> setupToken() async {
    try {
      String? token = await _messaging.getToken();
      if (token != null) {
        if (kDebugMode) print('FCM Token: $token');
        final platform = Platform.isAndroid ? 'android' : 'ios';
        await _notificationService.registerToken(token, platform);
      }
    } catch (e) {
      if (kDebugMode) print('Error setting up FCM token: $e');
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
      if (kDebugMode) print('Error deleting FCM token: $e');
    }
  }
}
