import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/material.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';
import 'local_cache_service.dart';

/// Canal de tiempo real de la app.
///
/// Es un singleton: la conexión debe sobrevivir a la navegación entre pantallas
/// para que los eventos lleguen sin depender de qué vista esté montada.
/// Los [StreamController] son recreables porque el cierre de sesión los cerraba
/// de forma permanente y dejaba la instancia inutilizable en la sesión siguiente.
class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal() {
    _openControllers();
  }

  IO.Socket? _socket;
  bool _initialized = false;
  int? _userId;
  String? _authToken;

  late StreamController<Map<String, dynamic>> _messageController;
  late StreamController<Map<String, dynamic>> _appointmentController;
  late StreamController<Map<String, dynamic>> _appointmentCreatedController;
  late StreamController<Map<String, dynamic>> _offerUpdatedController;
  late StreamController<Map<String, dynamic>> _priceUpdatedController;
  late StreamController<Map<String, dynamic>> _paymentWaitingController;
  late StreamController<Map<String, dynamic>> _paymentConfirmedController;
  late StreamController<Map<String, dynamic>> _userTypingController;
  late StreamController<bool> _connectionController;

  Stream<Map<String, dynamic>> get onMessageReceived => _messageController.stream;
  Stream<Map<String, dynamic>> get onAppointmentUpdate => _appointmentController.stream;
  Stream<Map<String, dynamic>> get onAppointmentCreated => _appointmentCreatedController.stream;
  Stream<Map<String, dynamic>> get onOfferUpdated => _offerUpdatedController.stream;
  Stream<Map<String, dynamic>> get onPriceUpdated => _priceUpdatedController.stream;
  Stream<Map<String, dynamic>> get onPaymentWaiting => _paymentWaitingController.stream;
  Stream<Map<String, dynamic>> get onPaymentConfirmed => _paymentConfirmedController.stream;
  Stream<Map<String, dynamic>> get onUserTyping => _userTypingController.stream;

  /// Emite true al establecer la conexión y false al perderla.
  Stream<bool> get onConnectionChanged => _connectionController.stream;

  bool get isConnected => _socket?.connected ?? false;
  bool get initialized => _initialized;
  int? get currentUserId => _userId;

  void _openControllers() {
    _messageController = StreamController<Map<String, dynamic>>.broadcast();
    _appointmentController = StreamController<Map<String, dynamic>>.broadcast();
    _appointmentCreatedController =
        StreamController<Map<String, dynamic>>.broadcast();
    _offerUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
    _priceUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
    _paymentWaitingController =
        StreamController<Map<String, dynamic>>.broadcast();
    _paymentConfirmedController =
        StreamController<Map<String, dynamic>>.broadcast();
    _userTypingController = StreamController<Map<String, dynamic>>.broadcast();
    _connectionController = StreamController<bool>.broadcast();
  }

  /// Los streams se cierran en el cierre de sesión. Si la app vuelve a iniciar
  /// sesión se reabren para no perder los eventos de esa nueva sesión.
  void _recycleClosedControllers() {
    if (_messageController.isClosed ||
        _appointmentController.isClosed ||
        _appointmentCreatedController.isClosed ||
        _offerUpdatedController.isClosed ||
        _priceUpdatedController.isClosed ||
        _paymentWaitingController.isClosed ||
        _paymentConfirmedController.isClosed ||
        _userTypingController.isClosed ||
        _connectionController.isClosed) {
      _openControllers();
    }
  }

  /// Se deriva de [ApiConstants.baseUrl] para no duplicar la configuración del
  /// servidor: la API expone '/api' y el socket se conecta a la raíz.
  String get _baseUrl {
    var url = ApiConstants.baseUrl;
    if (url.endsWith('/api')) {
      url = url.substring(0, url.length - 4);
    }
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    return url;
  }

  /// Conecta (o reconecta) el socket del usuario indicado.
  ///
  /// Es idempotente: si la sesión ya está activa se limita a (re)unirse a la sala
  /// privada, y si el socket se cayó vuelve a levantarlo en lugar de dejar la
  /// conexión muerta.
  Future<void> init({required int userId, required String authToken}) async {
    _recycleClosedControllers();

    final sameSession = _userId == userId && _authToken == authToken;

    if (_socket != null && _initialized && sameSession) {
      if (_socket!.connected) {
        _joinRoom();
      } else {
        _socket!.connect();
      }
      return;
    }

    // Cambió el usuario o el token: reconstruimos la conexión desde cero.
    _disposeSocket();
    _userId = userId;
    _authToken = authToken;

    _socket = IO.io(
      _baseUrl,
      IO.OptionBuilder()
          .setTransports(['polling', 'websocket'])
          .setAuth({'token': authToken})
          .enableReconnection()
          .setReconnectionAttempts(1000)
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(5000)
          .disableAutoConnect()
          .build(),
    );

    debugPrint('[SocketService] Conectando a $_baseUrl como usuario $userId');

    _bindEvents();
    _initialized = true;
    _socket!.connect();
  }

  /// Restablece la conexión con la sesión guardada. Pensado para el arranque de
  /// la app y para volver del segundo plano, donde el socket puede haber caído.
  Future<void> ensureConnected() async {
    final userId = _userId ?? LocalCacheService.getUserId();
    final token = _authToken ?? ApiService().getToken();
    if (userId == null || token == null) return;
    await init(userId: userId, authToken: token);
  }

  void _bindEvents() {
    final socket = _socket;
    if (socket == null) return;

    socket.onConnect((_) {
      debugPrint('[SocketService] Conectado (${socket.id}) como usuario $_userId');
      _joinRoom();
      _emitConnection(true);
    });

    socket.onDisconnect((_) {
      debugPrint('[SocketService] Desconectado');
      _emitConnection(false);
    });

    socket.onConnectError((err) {
      debugPrint('[SocketService] Error de conexión: $err');
      _emitConnection(false);
    });

    socket.onError((err) => debugPrint('[SocketService] Error: $err'));

    // Tras una reconexión automática hay que volver a entrar en la sala privada,
    // porque en el servidor la asociación a la sala es por conexión.
    socket.on('reconnect', (_) {
      debugPrint('[SocketService] Reconectado');
      _joinRoom();
      _emitConnection(true);
    });

    socket.on('receive_message',
        (data) => _emit(_messageController, data));
    socket.on('appointment_progress',
        (data) => _emit(_appointmentController, data));
    socket.on('appointment_created',
        (data) => _emit(_appointmentCreatedController, data));
    socket.on('offer_updated', (data) => _emit(_offerUpdatedController, data));
    socket.on('appointment_price_updated',
        (data) => _emit(_priceUpdatedController, data));
    socket.on('appointment_payment_waiting',
        (data) => _emit(_paymentWaitingController, data));
    socket.on('appointment_payment_confirmed',
        (data) => _emit(_paymentConfirmedController, data));
    socket.on('user_typing', (data) => _emit(_userTypingController, data));
  }

  void _joinRoom() {
    if (_socket == null || _userId == null) return;
    _socket!.emit('join_room', _userId);
  }

  void _emit(
      StreamController<Map<String, dynamic>> controller, dynamic data) {
    if (controller.isClosed) return;
    controller.add(
      data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{},
    );
  }

  void _emitConnection(bool connected) {
    if (_connectionController.isClosed) return;
    _connectionController.add(connected);
  }

  void _disposeSocket() {
    _socket?.dispose();
    _socket = null;
    _initialized = false;
  }

  /// Cierra la conexión dejando los streams vivos, para que un posterior inicio
  /// de sesión pueda volver a suscribirse.
  void disconnect() {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('leave_room', _userId ?? 0);
    }
    _disposeSocket();
    _userId = null;
    _authToken = null;
    _emitConnection(false);
  }

  /// Cierre completo: además de la conexión cierra los streams.
  void dispose() {
    disconnect();
    _messageController.close();
    _appointmentController.close();
    _appointmentCreatedController.close();
    _offerUpdatedController.close();
    _priceUpdatedController.close();
    _paymentWaitingController.close();
    _paymentConfirmedController.close();
    _userTypingController.close();
    _connectionController.close();
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
    _recycleClosedControllers();
    switch (event) {
      case 'receive_message':
        _emit(_messageController, data);
        break;
      case 'appointment_progress':
        _emit(_appointmentController, data);
        break;
      case 'appointment_created':
        _emit(_appointmentCreatedController, data);
        break;
      case 'offer_updated':
        _emit(_offerUpdatedController, data);
        break;
      case 'appointment_price_updated':
        _emit(_priceUpdatedController, data);
        break;
      case 'appointment_payment_waiting':
        _emit(_paymentWaitingController, data);
        break;
      case 'appointment_payment_confirmed':
        _emit(_paymentConfirmedController, data);
        break;
      case 'user_typing':
        _emit(_userTypingController, data);
        break;
    }
  }
}
