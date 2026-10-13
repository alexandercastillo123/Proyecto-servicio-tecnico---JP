import 'dart:async';
import 'package:flutter/widgets.dart';
import '../services/socket_service.dart';
import '../services/api_service.dart';
import '../services/local_cache_service.dart';

/// Suscripción global a los eventos de tiempo real.
///
/// Existe para que los mensajes lleguen con cualquier pantalla montada. Antes solo
/// los consumía el ChatScreen, así que fuera del chat los eventos se perdían y
/// había que recargar la vista para verlos.
class RealtimeProvider extends ChangeNotifier with WidgetsBindingObserver {
  RealtimeProvider() {
    WidgetsBinding.instance.addObserver(this);
    _messageSubscription = _socketService.onMessageReceived.listen(_onMessage);
    _connectionSubscription =
        _socketService.onConnectionChanged.listen(_onConnectionChanged);
  }

  final SocketService _socketService = SocketService();

  StreamSubscription<Map<String, dynamic>>? _messageSubscription;
  StreamSubscription<bool>? _connectionSubscription;

  bool _isConnected = false;
  int _unreadCount = 0;

  bool get isConnected => _isConnected;
  int get unreadCount => _unreadCount;

  /// Conecta si hay sesión guardada. Se invoca al arrancar la app.
  Future<void> bootstrap() async {
    final userId = LocalCacheService.getUserId();
    final token = ApiService().getToken();
    if (userId == null || token == null) return;
    await _socketService.init(userId: userId, authToken: token);
  }

  Future<void> connect() => _socketService.ensureConnected();

  void clearUnread() {
    if (_unreadCount == 0) return;
    _unreadCount = 0;
    notifyListeners();
  }

  void _onConnectionChanged(bool connected) {
    if (_isConnected == connected) return;
    _isConnected = connected;
    // Al cerrarse sesión el contador se reinicia; tras una caída de red también,
    // ya que los mensajes que lleguen de nuevo se vuelven a contar.
    if (!connected) _unreadCount = 0;
    notifyListeners();
  }

  void _onMessage(Map<String, dynamic> data) {
    // Solo cuenta lo recibido de otro usuario: lo que uno mismo envía ya aparece
    // en su propia conversación.
    final senderId = data['sender_id']?.toString();
    final currentUserId = _socketService.currentUserId?.toString();
    if (senderId == null || senderId == currentUserId) return;

    _unreadCount++;
    notifyListeners();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Al volver del segundo plano el socket puede haberse caído.
      _socketService.ensureConnected();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _messageSubscription?.cancel();
    _connectionSubscription?.cancel();
    _socketService.dispose();
    super.dispose();
  }
}
