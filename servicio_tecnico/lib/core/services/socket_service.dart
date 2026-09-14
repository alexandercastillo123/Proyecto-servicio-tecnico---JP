import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  final StreamController<Map<String, dynamic>> _messageController = 
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _appointmentController = 
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onMessageReceived => _messageController.stream;
  Stream<Map<String, dynamic>> get onAppointmentUpdate => _appointmentController.stream;
  bool get isConnected => _socket?.connected ?? false;

  Future<void> init({required int userId, required String authToken}) async {
    final baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:3000';
    
    if (_socket != null) {
      if (_socket!.connected) {
        return;
      }
      _socket!.dispose();
    }
    
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

    _socket!.onConnectError((err) => debugPrint('Socket connect error: $err'));
    _socket!.onError((err) => debugPrint('Socket error: $err'));
  }

  void dispose() {
    _messageController.close();
    _appointmentController.close();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void sendMessage(Map<String, dynamic> message) {
    _socket?.emit('send_message', message);
  }
}