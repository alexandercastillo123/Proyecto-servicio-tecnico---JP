import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  bool _initialized = false;
  int? _userId;

  final StreamController<Map<String, dynamic>> _messageController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _appointmentController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _appointmentCreatedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _offerUpdatedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _priceUpdatedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _paymentWaitingController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _paymentConfirmedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _userTypingController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onMessageReceived => _messageController.stream;
  Stream<Map<String, dynamic>> get onAppointmentUpdate => _appointmentController.stream;
  Stream<Map<String, dynamic>> get onAppointmentCreated => _appointmentCreatedController.stream;
  Stream<Map<String, dynamic>> get onOfferUpdated => _offerUpdatedController.stream;
  Stream<Map<String, dynamic>> get onPriceUpdated => _priceUpdatedController.stream;
  Stream<Map<String, dynamic>> get onPaymentWaiting => _paymentWaitingController.stream;
  Stream<Map<String, dynamic>> get onPaymentConfirmed => _paymentConfirmedController.stream;
  Stream<Map<String, dynamic>> get onUserTyping => _userTypingController.stream;
  bool get isConnected => _socket?.connected ?? false;
  bool get initialized => _initialized;
  int? get currentUserId => _userId;

  Future<void> init({required int userId, required String authToken}) async {
    final baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:3000';

    if (_socket != null && _initialized) {
      return;
    }

    if (_socket != null) {
      _socket!.dispose();
    }

    _userId = userId;
    _socket = IO.io(baseUrl, IO.OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect()
        .setExtraHeaders({'Authorization': 'Bearer $authToken'})
        .build());

    _socket!.onConnect((_) {
      _socket!.emit('join_room', userId);
    });

    _socket!.on('receive_message', (data) {
      _messageController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('appointment_progress', (data) {
      _appointmentController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('appointment_created', (data) {
      _appointmentCreatedController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('offer_updated', (data) {
      _offerUpdatedController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('appointment_price_updated', (data) {
      _priceUpdatedController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('appointment_payment_waiting', (data) {
      _paymentWaitingController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('appointment_payment_confirmed', (data) {
      _paymentConfirmedController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('user_typing', (data) {
      _userTypingController.add(Map<String, dynamic>.from(data));
    });

    _socket!.onConnectError((err) => debugPrint('Socket connect error: $err'));
    _socket!.onError((err) => debugPrint('Socket error: $err'));
    _initialized = true;
  }

  void dispose() {
    if (_socket?.connected == true) {
      _socket?.emit('leave_room', _userId ?? 0);
    }
    _messageController.close();
    _appointmentController.close();
    _appointmentCreatedController.close();
    _offerUpdatedController.close();
    _priceUpdatedController.close();
    _paymentWaitingController.close();
    _paymentConfirmedController.close();
    _userTypingController.close();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _initialized = false;
    _userId = null;
  }

  void sendMessage(Map<String, dynamic> message) {
    _socket?.emit('send_message', message);
  }

  void emitTyping({required int receiverId, required bool isTyping}) {
    _socket?.emit('typing', {
      'senderId': _userId,
      'receiverId': receiverId,
      'isTyping': isTyping,
    });
  }

  /// Test helper: simula la recepcion de un evento Socket.IO para testing sin conexion real.
  void simulateEventForTesting(String event, Map<String, dynamic> data) {
    switch (event) {
      case 'receive_message':
        _messageController.add(Map<String, dynamic>.from(data));
        break;
      case 'appointment_progress':
        _appointmentController.add(Map<String, dynamic>.from(data));
        break;
      case 'appointment_created':
        _appointmentCreatedController.add(Map<String, dynamic>.from(data));
        break;
      case 'offer_updated':
        _offerUpdatedController.add(Map<String, dynamic>.from(data));
        break;
      case 'appointment_price_updated':
        _priceUpdatedController.add(Map<String, dynamic>.from(data));
        break;
      case 'appointment_payment_waiting':
        _paymentWaitingController.add(Map<String, dynamic>.from(data));
        break;
      case 'appointment_payment_confirmed':
        _paymentConfirmedController.add(Map<String, dynamic>.from(data));
        break;
      case 'user_typing':
        _userTypingController.add(Map<String, dynamic>.from(data));
        break;
    }
  }
}