import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/services/message_service.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/services/appointment_service.dart';
import '../../../../core/services/technician_service.dart';
import '../../../../core/services/store_service.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/widgets/custom_avatar.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final MessageService _messageService = MessageService();
  final UserService _userService = UserService();
  final AppointmentService _appointmentService = AppointmentService();
  final TechnicianService _technicianService = TechnicianService();
  final StoreService _storeService = StoreService();
  final SocketService _socketService = SocketService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  StreamSubscription? _messageSubscription;
  List<dynamic> _messages = [];
  bool _isLoading = true;
  String? _errorMessage;
  int? _otherUserId;
  String? _otherUserName;
  String? _otherUserRole;
  String? _userRole;
  bool _isDisposed = false;
  bool _otherUserAvailable = true;
  int? _otherStoreId;
  int? _currentUserId;

  String _formatTime(String? timestamp) {
    if (timestamp == null) return '';
    try {
      final date = DateTime.parse(timestamp).toLocal();
      final hour = date.hour > 12
          ? date.hour - 12
          : (date.hour == 0 ? 12 : date.hour);
      final period = date.hour >= 12 ? 'pm' : 'am';
      final minute = date.minute.toString().padLeft(2, '0');
      return '$hour:$minute $period';
    } catch (e) {
      return '';
    }
  }

  String _formatDate(String dateStr) {
    try {
      // dateStr might be like "2026-02-11" or "Monday (2026-02-11)"
      // If it contains parenthesis, extract the date part
      if (dateStr.contains('(')) {
        final regex = RegExp(r'\(([^)]+)\)');
        final match = regex.firstMatch(dateStr);
        if (match != null) {
          dateStr = match.group(1)!;
        }
      }

      final date = DateTime.parse(dateStr);
      final days = [
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
        'Domingo',
      ];
      return days[date.weekday -
          1]; // Simply return the day name as per design, or full date if preferred
    } catch (e) {
      return dateStr;
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isLoading && _otherUserId == null) {
      final extra = GoRouterState.of(context).extra;
      if (extra != null) {
        if (extra is Map<String, dynamic>) {
          _otherUserId = int.tryParse(extra['receiverId']?.toString() ?? '');
          _otherUserName = extra['receiverName']?.toString();
          _otherUserRole = extra['receiverRole']?.toString();
        } else {
          // Soporte para formato antiguo (solo ID)
          _otherUserId = int.tryParse(extra.toString());
        }

        if (_otherUserId != null) {
          _loadInitialData(_otherUserId!);
          return;
        }
      }

      setState(() {
        _isLoading = false;
        _errorMessage = 'ID de usuario no proporcionado o inválido';
      });
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    _messageSubscription?.cancel();
    super.dispose();
  }

  void _initSocketListener() {
    _messageSubscription = _socketService.onMessageReceived.listen((data) {
      if (_isDisposed) return;
      if (data['sender_id'] == _otherUserId ||
          data['receiver_id'] == _currentUserId) {
        setState(() {
          _messages.add({
            ...data,
            'is_me': data['sender_id'] == _currentUserId,
          });
        });
        _scrollToBottom();
      }
    });
  }

  void _startSocketListener() {
    // Already handled in _initSocketListener
  }

  Future<void> _loadInitialData(int userId) async {
    try {
      final profileRes = await _userService.getProfile();
      if (profileRes.success) {
        _userRole = profileRes.data?['role'];
        _currentUserId = profileRes.data?['id'] ?? profileRes.data?['user_id'];
        final token = ApiService().getToken();
if (!_socketService.isConnected &&
                             token != null &&
                             _currentUserId != null) {
          _socketService.init(userId: _currentUserId!, authToken: token);
        }
      }

      // Obtener disponibilidad del otro usuario (si es técnico)
      final otherRes = await _userService.getUserById(userId);
      if (otherRes.success) {
        setState(() {
          _otherUserAvailable = otherRes.data?['is_available'] ?? true;
          _otherStoreId = otherRes.data?['store_id']; // Capturar ID de sucursal
        });
      }

      await _loadMessages(userId);
      _initSocketListener();
    } catch (e) {
      await _loadMessages(userId);
      _initSocketListener();
    }
  }

  Future<void> _loadMessages(int userId, {bool isPolling = false}) async {
    try {
      final response = await _messageService.getMessages(userId);
      if (response.success) {
        final newMessages = response.data ?? [];

        // Mark as read unread incoming messages
        for (var m in newMessages) {
          if (!(m['is_me'] ?? false) &&
              m['sender_id'].toString() == userId.toString() &&
              m['is_read'] == false) {
            _messageService.markAsRead(m['id']);
          }
        }

        if (_isDisposed) return;

        setState(() {
          _messages = newMessages;
          if (!isPolling) _isLoading = false;
        });
        if (!isPolling) _scrollToBottom();
      } else {
        if (!isPolling && !_isDisposed) {
          setState(() {
            _errorMessage = response.message;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (!isPolling && !_isDisposed) {
        setState(() {
          _errorMessage = 'Error al cargar mensajes';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _otherUserId == null) return;

    _messageController.clear();

    // Optimistic update
    setState(() {
      _messages.add({
        'message_text': text,
        'sender_id': 'me',
        'created_at': DateTime.now().toIso8601String(),
        'is_me': true,
      });
    });

    try {
      final response = await _messageService.sendMessage(
        receiverId: _otherUserId!,
        messageText: text,
      );
      if (response.success) {
        _loadMessages(_otherUserId!);
      }
    } catch (e) {
      // Handle error
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _getSubtitleRole() {
    if (_otherUserRole == 'tech' || _otherUserRole == 'technician') {
      return 'Técnico Especialista';
    } else if (_otherUserRole == 'store' || _otherUserRole == 'provider') {
      return 'Sucursal J&P';
    }
    return 'Cliente';
  }

  Widget _buildAppBarAvatar() {
    String? profileUrl;
    try {
      final msgWithPic = _messages.reversed.firstWhere(
        (m) =>
            m['profile_image_url'] != null &&
            m['profile_image_url'].toString().isNotEmpty &&
            !(m['is_me'] ?? false),
        orElse: () => null,
      );
      if (msgWithPic != null) {
        profileUrl = msgWithPic['profile_image_url'];
      }
    } catch (_) {}

    return CustomAvatar(
      imageUrl: profileUrl != null
          ? ApiConstants.getStorageUrl(profileUrl)
          : null,
      name: _otherUserName ?? '?',
      size: 36,
      fontSize: 14,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF020617) : const Color(0xFFF1F1F1),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        elevation: 0.5,
        leadingWidth: 40,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back, color: AppColors.primary),
        ),
        title: InkWell(
          onTap: () {
            if (_otherUserId != null) {
              if (_otherUserRole == 'tech' || _otherUserRole == 'technician') {
                context.push(
                  '/technician-profile',
                  extra: {'techId': _otherUserId},
                );
              } else if (_otherUserRole == 'store' ||
                  _otherUserRole == 'provider' ||
                  _otherUserRole == 'sucursal') {
                // Priorizar _otherStoreId para ir al perfil de la sucursal
                final idToUse = _otherStoreId ?? _otherUserId;
                context.push('/store-profile/$idToUse');
              } else {
                // Perfil de cliente
                if (_userRole != 'client') {
                  _showClientProfileDialog();
                }
              }
            }
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
            child: Row(
              children: [
                _buildAppBarAvatar(),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _otherUserName ?? 'Usuario',
                        style: GoogleFonts.outfit(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: _otherUserAvailable
                                  ? Colors.green
                                  : Colors.grey,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _otherUserAvailable ? 'En línea' : 'Fuera de línea',
                            style: GoogleFonts.outfit(
                              color: AppColors.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.info_outline_rounded,
              color: AppColors.primary,
            ),
            onPressed: () {
              if (_otherUserId != null) {
                if (_otherUserRole == 'tech' ||
                    _otherUserRole == 'technician') {
                  context.push(
                    '/technician-profile',
                    extra: {'techId': _otherUserId},
                  );
                } else if (_otherUserRole == 'store' ||
                    _otherUserRole == 'provider' ||
                    _otherUserRole == 'sucursal') {
                  final idToUse = _otherStoreId ?? _otherUserId;
                  context.push('/store-profile/$idToUse');
                } else {
                  if (_userRole != 'client') _showClientProfileDialog();
                }
              }
            },
          ),
          if (_userRole == 'tech' ||
              _userRole == 'technician' ||
              _userRole == 'provider')
            Container(
              margin: const EdgeInsets.only(right: 16),
              child: ElevatedButton(
                onPressed: _showClientRatingDialog,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Reseñar',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? Center(child: Text(_errorMessage!))
          : Column(
              children: [
                if (_buildActiveOrderBar() != null) _buildActiveOrderBar()!,
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _getFilteredMessages().length,
                    itemBuilder: (context, index) {
                      final messages = _getFilteredMessages();
                      final msg = messages[index];
                      final isMe =
                          msg['is_me'] == true ||
                          msg['sender_id'] == 'me' ||
                          (msg['sender_id'] != null &&
                              msg['sender_id'].toString() !=
                                  _otherUserId?.toString());

                      final time = _formatTime(msg['created_at']);

                      // Date separator logic
                      bool showDateSeparator = false;
                      String dateLabel = '';

                      if (msg['created_at'] != null) {
                        try {
                          final DateTime currentDate = DateTime.parse(
                            msg['created_at'],
                          ).toLocal();
                          final DateTime pureDate = DateTime(
                            currentDate.year,
                            currentDate.month,
                            currentDate.day,
                          );

                          if (index == 0) {
                            showDateSeparator = true;
                          } else {
                            final prevMsg = _messages[index - 1];
                            if (prevMsg['created_at'] != null) {
                              final DateTime prevDate = DateTime.parse(
                                prevMsg['created_at'],
                              ).toLocal();
                              final DateTime purePrevDate = DateTime(
                                prevDate.year,
                                prevDate.month,
                                prevDate.day,
                              );
                              if (pureDate.isAfter(purePrevDate)) {
                                showDateSeparator = true;
                              }
                            }
                          }

                          if (showDateSeparator) {
                            final now = DateTime.now();
                            final today = DateTime(
                              now.year,
                              now.month,
                              now.day,
                            );
                            final yesterday = today.subtract(
                              const Duration(days: 1),
                            );

                            if (pureDate == today) {
                              dateLabel = 'Hoy';
                            } else if (pureDate == yesterday) {
                              dateLabel = 'Ayer';
                            } else {
                              final months = [
                                'Enero',
                                'Febrero',
                                'Marzo',
                                'Abril',
                                'Mayo',
                                'Junio',
                                'Julio',
                                'Agosto',
                                'Septiembre',
                                'Octubre',
                                'Noviembre',
                                'Diciembre',
                              ];
                              dateLabel =
                                  '${pureDate.day} de ${months[pureDate.month - 1]}';
                              if (pureDate.year != now.year) {
                                dateLabel += ' de ${pureDate.year}';
                              }
                            }
                          }
                        } catch (e) {
                          // Ignore parsing errors for separator
                        }
                      }

                      Widget bubble;
                      if (msg['message_type'] == 'offer') {
                        bubble = _buildOfferBubble(
                          messageId: msg['id'],
                          price: msg['offer_price'].toString(),
                          isCanceled: msg['offer_status'] == 'cancelled',
                          time: time,
                          isMe: isMe,
                        );
                      } else if (msg['message_type'] ==
                          'appointment_progress') {
                        bubble = _buildAppointmentProgressBubble(
                          message: msg['message_text'] ?? '',
                          status: msg['appointment_status'] ?? 'pending',
                          time: time,
                          isMe: isMe,
                        );
                      } else if (msg['message_type'] == 'appointment') {
                        bubble = _buildAppointmentBubble(
                          appointmentId: msg['appointment_id'],
                          message: msg['message_text'] ?? '',
                          description: msg['appointment_description'],
                          time: time,
                          isMe: isMe,
                          appointmentStatus: msg['appointment_status'],
                          cancellerRole: msg['canceller_role'],
                          price: double.tryParse(
                            msg['appointment_price']?.toString() ?? '',
                          ),
                          paymentStatus: msg['appointment_payment_status'],
                          paymentMethod: msg['appointment_payment_method'],
                        );
                      } else if (msg['message_type'] == 'order') {
                        bubble = _buildOrderBubble(
                          orderId: msg['order_id'],
                          productName: msg['order_product_name'] ?? 'Producto',
                          status: msg['order_status'] ?? 'pending',
                          orderAddress: msg['order_address'],
                          orderLat: msg['order_lat'],
                          orderLng: msg['order_lng'],
                          message: msg['message_text'] ?? '',
                          time: time,
                          isMe: isMe,
                          paymentStatus: msg['order_payment_status'],
                          paymentMethod: msg['order_payment_method'],
                          price: double.tryParse(
                            msg['order_price']?.toString() ?? '',
                          ),
                        );
                      } else {
                        bubble = _buildMessageBubble(msg: msg, isMe: isMe);
                      }

                      if (showDateSeparator) {
                        return Column(
                          children: [_buildDateSeparator(dateLabel), bubble],
                        );
                      }
                      return bubble;
                    },
                  ),
                ),
if (!_otherUserAvailable &&
                     (_otherUserRole == 'tech' || _otherUserRole == 'store'))
                   Container(
                     width: double.infinity,
                     padding: const EdgeInsets.symmetric(
                       vertical: 10,
                       horizontal: 16,
                     ),
                     color: isDark ? Colors.orange.shade900.withOpacity(0.3) : Colors.orange.shade50,
                     child: Row(
                       children: [
                         Icon(
                           Icons.info_outline,
                           color: isDark ? Colors.orange.shade200 : Colors.orange.shade900,
                           size: 18,
                         ),
                         const SizedBox(width: 10),
                         Expanded(
                           child: Text(
                             '⚠️ El técnico se encuentra fuera de servicio o de vacaciones. Las respuestas pueden tardar.',
                             style: TextStyle(
                               color: isDark ? Colors.orange.shade200 : Colors.orange.shade900,
                               fontSize: 12,
                               fontWeight: FontWeight.w500,
                             ),
                           ),
                         ),
                       ],
                     ),
                   ),
                _buildInputArea(),
              ],
            ),
    );
  }

  List<dynamic> _getFilteredMessages() {
    if (_messages.isEmpty) return [];

    final Map<int, int> lastOrderIndex = {};
    final List<int> toRemove = [];

    // Identificar el último índice para cada order_id
    for (int i = 0; i < _messages.length; i++) {
      final msg = _messages[i];
      if (msg['message_type'] == 'order' && msg['order_id'] != null) {
        final orderId = msg['order_id'];
        if (lastOrderIndex.containsKey(orderId)) {
          toRemove.add(lastOrderIndex[orderId]!);
        }
        lastOrderIndex[orderId] = i;
      }
    }

    if (toRemove.isEmpty) return _messages;

    final List<dynamic> filtered = [];
    for (int i = 0; i < _messages.length; i++) {
      if (!toRemove.contains(i)) {
        filtered.add(_messages[i]);
      }
    }
    return filtered;
  }

  Widget _buildAppointmentBubble({
    int? appointmentId,
    required String message,
    String? description,
    required String time,
    required bool isMe,
    String? appointmentStatus,
    String? cancellerRole,
    double? price,
    String? paymentStatus,
    String? paymentMethod,
  }) {
    final String cancelText = cancellerRole != null
        ? ' - Cancelado por ${cancellerRole == 'client' ? 'Cliente' : 'Técnico'}'
        : '';

    final bool isPaid = paymentStatus == 'paid';
    final bool isWaiting = paymentStatus == 'waiting_confirmation';
    final bool isTech =
        _userRole == 'tech' ||
        _userRole == 'technician' ||
        _userRole == 'provider' ||
        _userRole == 'store';
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Align(
      alignment: !isMe ? Alignment.centerLeft : Alignment.centerRight,
      child: Column(
        crossAxisAlignment: !isMe
            ? CrossAxisAlignment.start
            : CrossAxisAlignment.end,
        children: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 8),
            padding: const EdgeInsets.all(16),
            width: 280,
            decoration: BoxDecoration(
              color: isMe 
                  ? AppColors.primary 
                  : isDark 
                      ? const Color(0xFF1E293B) 
                      : const Color(0xFFEBEBEB),
              borderRadius: BorderRadius.circular(16),
              border: isPaid ? Border.all(color: Colors.green, width: 2) : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        appointmentStatus == 'cancelled'
                            ? '❌ Cita Cancelada$cancelText'
                            : appointmentStatus == 'completed'
                            ? '✅ Chamba Terminada'
                            : appointmentStatus == 'expired'
                            ? '⌛ Cita Expirada'
                            : '📅 Cita', // Simplificado a "Cita" por solicitud del usuario
                        style: TextStyle(
                          color: isMe ? Colors.white : AppColors.primary,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          decoration:
                              (appointmentId == -1 ||
                                  appointmentId == null ||
                                  appointmentStatus == 'cancelled' ||
                                  appointmentStatus == 'expired')
                              ? TextDecoration.lineThrough
                              : null,
                        ),
                      ),
                    ),
                    if (isPaid)
                      const Icon(Icons.verified, color: Colors.green, size: 20),
                  ],
                ),
                const SizedBox(height: 8),
                _buildAppointmentDetails(message, description, isMe),
                const Divider(color: Colors.white24),

                // Price and Payment Status
                if (price != null) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Monto: S/. $price',
                        style: TextStyle(
                          color: isMe ? Colors.white : AppColors.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      if (isPaid)
                        Text(
                          'PAGADO',
                          style: TextStyle(
                            color: isMe
                                ? Colors.greenAccent
                                : Colors.green[700],
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],

                // Action Buttons
                if (appointmentStatus != 'cancelled' &&
                    appointmentId != null) ...[
                  // 1. Technician Sets Price
                  if (isTech && price == null)
                    _buildActionButton(
                      label: '💰 Establecer Monto',
                      onPressed: () => _showSetPriceDialog(appointmentId),
                      bgColor: AppColors.primary,
                      fgColor: Colors.white,
                    ),

                  // 2. Client Pays
                  if (!isTech && price != null && paymentStatus == 'pending')
                    _buildActionButton(
                      label: '💳 Pagar S/. ${price.toStringAsFixed(2)}',
                      onPressed: () =>
                          _showPaymentMethodDialog(appointmentId, price),
                      bgColor: const Color(0xFF00C853),
                      fgColor: Colors.white,
                    ),

                  // 3. Waiting / Confirm flow
                  if (isWaiting || isPaid) ...[
                    const SizedBox(height: 4),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isPaid
                            ? Colors.green.withOpacity(0.25)
                            : Colors.orange.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isPaid ? Icons.lock : Icons.access_time,
                            size: 14,
                            color: isPaid ? Colors.green : Colors.orange,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              isPaid
                                  ? '✅ Cita Pagada y Asegurada'
                                  : (isTech
                                        ? '⏳ Cliente pagó vía ${(paymentMethod ?? '').toUpperCase()} — Confirma el pago'
                                        : '⏳ Esperando confirmación del técnico...'),
                              style: TextStyle(
                                color: isPaid
                                    ? Colors.green[800]
                                    : Colors.orange[900],
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Confirm button (tech only while waiting)
                    // HIDE if payment method is Culqi (since it's automated)
                    if (isTech &&
                        isWaiting &&
                        (paymentMethod ?? '').toLowerCase() != 'culqi') ...[
                      const SizedBox(height: 6),
                      _buildActionButton(
                        label: '✔ Confirmar Pago Recibido',
                        onPressed: () => _handleConfirmPayment(appointmentId),
                        bgColor: AppColors.primary,
                        fgColor: Colors.white,
                      ),
                    ],

                    // Details link only when payment is involved
                    const SizedBox(height: 4),
                    Center(
                      child: TextButton.icon(
                        onPressed: () =>
                            context.push('/appointment-details/$appointmentId'),
                        icon: Icon(
                          Icons.info_outline,
                          size: 16,
                          color: isMe ? Colors.white70 : AppColors.primary,
                        ),
                        label: Text(
                          'Ver datos de la cita',
                          style: TextStyle(
                            color: isMe ? Colors.white70 : AppColors.primary,
                            fontSize: 13,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ),
                  ],

                  // Cancel Button (only if not paid)
                  if (!isPaid)
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: const Text('Confirmar Cancelación'),
                              content: const Text(
                                '¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.pop(context, false),
                                  child: const Text('NO, VOLVER'),
                                ),
                                TextButton(
                                  onPressed: () => Navigator.pop(context, true),
                                  child: const Text(
                                    'SÍ, CANCELAR',
                                    style: TextStyle(color: Colors.red),
                                  ),
                                ),
                              ],
                            ),
                          );

                          if (confirm == true) {
                            final response = await _appointmentService
                                .cancelAppointment(appointmentId);
                            if (response.success) {
                              _loadMessages(_otherUserId!);
                            }
                          }
                        },
                        icon: const Icon(
                          Icons.cancel_outlined,
                          size: 16,
                          color: Colors.redAccent,
                        ),
                        label: const Text(
                          'Cancelar Cita',
                          style: TextStyle(
                            color: Colors.redAccent,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.redAccent),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),

                  if (appointmentStatus == 'completed' &&
                      !(isTech ||
                          _userRole == 'technician' ||
                          _userRole == 'store'))
                    _buildActionButton(
                      label: '⭐ Calificar Servicio',
                      onPressed: () =>
                          _showTechnicianRatingDialog(appointmentId),
                      bgColor: Colors.amber,
                      fgColor: Colors.black,
                    ),

                  if (isPaid && appointmentStatus != 'completed')
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: null,
                        icon: const Icon(Icons.lock_outline, size: 16),
                        label: const Text('Cita Asegurada — No Cancelable'),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: Colors.grey.withOpacity(0.4)),
                          foregroundColor: Colors.grey,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                ],
              ],
            ),
          ),
          Padding(
            padding: EdgeInsets.only(
              right: isMe ? 8 : 0,
              left: isMe ? 0 : 8,
              bottom: 8,
            ),
            child: Text(
              time,
              style: TextStyle(
                color: Colors.blue.withOpacity(0.6),
                fontSize: 10,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showTechnicianRatingDialog(int appointmentId) {
    int selectedStars = 5;
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFD9D9D9),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Califica a ${_otherUserName ?? "tu técnico"}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF3B28FF),
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Puntua el servicio recibido para ayudar a la comunidad',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF3B28FF), fontSize: 14),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        return GestureDetector(
                          onTap: () {
                            setDialogState(() {
                              selectedStars = index + 1;
                            });
                          },
                          child: Icon(
                            Icons.star,
                            color: index < selectedStars
                                ? const Color(0xFFFFD700)
                                : const Color(0xFFBDBDBD),
                            size: 40,
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 30),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () => Navigator.pop(context),
                            style: TextButton.styleFrom(
                              backgroundColor: const Color(0xFFBDBDBD),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'Cancelar',
                              style: TextStyle(
                                color: Color(0xFF3B28FF),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextButton(
                            onPressed: () async {
                              if (_otherUserId != null) {
                                final response = await _technicianService
                                    .addReview(
                                      technicianId: _otherUserId!,
                                      rating: selectedStars,
                                      comment:
                                          'Calificación de servicio finalizado',
                                      appointmentId: appointmentId,
                                    );

                                if (context.mounted) {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        response.message ??
                                            (response.success
                                                ? '¡Gracias por tu calificación!'
                                                : 'Error al enviar reseña'),
                                      ),
                                      backgroundColor: response.success
                                          ? Colors.green
                                          : Colors.red,
                                    ),
                                  );
                                }
                              }
                            },
                            style: TextButton.styleFrom(
                              backgroundColor: const Color(0xFFEEEEEE),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              side: const BorderSide(color: Color(0xFFBDBDBD)),
                            ),
                            child: const Text(
                              'Valorar',
                              style: TextStyle(
                                color: Color(0xFF3B28FF),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildActionButton({
    required String label,
    required VoidCallback onPressed,
    Color bgColor = AppColors.primary,
    Color fgColor = Colors.white,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: bgColor,
            foregroundColor: fgColor,
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }

  void _showSetPriceDialog(int appointmentId) {
    final priceController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F1F1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Monto de Cita',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Establezca el monto final para este servicio:',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              TextField(
                controller: priceController,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
                decoration: InputDecoration(
                  hintText: 'S/. 0.00',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Cancelar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        final price =
                            double.tryParse(priceController.text) ?? 0;
                        if (price > 0) {
                          Navigator.pop(context);
                          final response = await _appointmentService.setPrice(
                            appointmentId,
                            price,
                          );
                          if (response.success) {
                            _loadMessages(_otherUserId!);
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Asignar'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showPaymentMethodDialog(int appointmentId, double price) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Método de Pago',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              _paymentOption(Icons.qr_code, 'Yape', 'yape', appointmentId),
              _paymentOption(
                Icons.qr_code_scanner,
                'Plin',
                'plin',
                appointmentId,
              ),
              _paymentOption(
                Icons.account_balance,
                'Transferencia',
                'transfer',
                appointmentId,
              ),
              _paymentOption(Icons.payments, 'Efectivo', 'cash', appointmentId),
              const Divider(),
              ListTile(
                leading: const Icon(
                  Icons.credit_card,
                  color: Colors.blueAccent,
                ),
                title: const Text(
                  'Culqi (Modo Prueba)',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blueAccent,
                  ),
                ),
                onTap: () {
                  Navigator.pop(context);
                  context.push(
                    '/culqi-payment',
                    extra: {
                      'entityId': appointmentId,
                      'paymentType': 'appointment',
                      'amount': price,
                      'description': 'Pago de Cita #$appointmentId',
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _paymentOption(IconData icon, String label, String value, int id) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
      onTap: () async {
        Navigator.pop(context);
        final response = await _appointmentService.payAppointment(id, value);
        if (response.success) {
          _loadMessages(_otherUserId!);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Pago registrado. Espera confirmación del técnico.',
              ),
              backgroundColor: Colors.green,
            ),
          );
        }
      },
    );
  }

  Future<void> _handleConfirmPayment(int id) async {
    final response = await _appointmentService.confirmPayment(id);
    if (response.success) {
      _loadMessages(_otherUserId!);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('¡Pago confirmado! Cita asegurada.'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _showOrderPaymentMethodDialog(int orderId, double price) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Método de Pago (Pedido)',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              _orderPaymentOption(Icons.qr_code, 'Yape', 'yape', orderId),
              _orderPaymentOption(
                Icons.qr_code_scanner,
                'Plin',
                'plin',
                orderId,
              ),
              _orderPaymentOption(
                Icons.account_balance,
                'Transferencia',
                'transfer',
                orderId,
              ),
              _orderPaymentOption(Icons.payments, 'Efectivo', 'cash', orderId),
              const Divider(),
              ListTile(
                leading: const Icon(
                  Icons.credit_card,
                  color: Colors.blueAccent,
                ),
                title: const Text(
                  'Culqi (Modo Prueba)',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blueAccent,
                  ),
                ),
                onTap: () {
                  Navigator.pop(context);
                  context.push(
                    '/culqi-payment',
                    extra: {
                      'entityId': orderId,
                      'paymentType': 'order',
                      'amount': price,
                      'description': 'Pago de Pedido #$orderId',
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _orderPaymentOption(
    IconData icon,
    String label,
    String value,
    int id,
  ) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
      onTap: () async {
        Navigator.pop(context);
        final response = await _storeService.payOrder(id, value);
        if (response.success) {
          _loadMessages(_otherUserId!);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Pago de pedido registrado. Espera confirmación de la tienda.',
              ),
              backgroundColor: Colors.green,
            ),
          );
        }
      },
    );
  }

  Future<void> _handleConfirmOrderPayment(int id) async {
    final response = await _storeService.confirmOrderPayment(id);
    if (response.success) {
      _loadMessages(_otherUserId!);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('¡Pago de pedido confirmado!'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Widget _buildDateSeparator(String label) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 20),
      child: Row(
        children: [
          Expanded(child: Divider(color: Colors.grey.withOpacity(0.3))),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey.withOpacity(0.7),
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Expanded(child: Divider(color: Colors.grey.withOpacity(0.3))),
        ],
      ),
    );
  }

  Widget _buildAppointmentDetails(
    String message,
    String? description,
    bool isMe,
  ) {
    final textColor = isMe ? Colors.white : AppColors.primary;

    // Fallback if parsing fails
    String datePart = '';
    String timePart = '';

    if (message.contains('para ') && message.contains(' a las ')) {
      try {
        final parts = message.split(' a las ');
        if (parts.length > 1) {
          final dateSubParts = parts[0].split('para ');
          if (dateSubParts.length > 1) {
            datePart = _formatDate(dateSubParts[1]);
          }
          final timeSubParts = parts[1].split('\n');
          timePart = timeSubParts[0];

          if ((description == null ||
                  description == 'null' ||
                  description.isEmpty) &&
              parts[1].contains('Motivo:')) {
            try {
              description = parts[1].split('Motivo:')[1].trim();
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    if (datePart.isNotEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Dia: $datePart',
            style: TextStyle(color: textColor, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            'Hora: $timePart',
            style: TextStyle(color: textColor, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            'Descripción: $description',
            style: TextStyle(color: textColor, fontSize: 14),
          ),
        ],
      );
    }

    return Column(
      children: [
        Text(message, style: TextStyle(color: textColor, fontSize: 14)),
        if (description != null &&
            description.isNotEmpty &&
            !message.contains('Motivo:'))
          Text(
            'Descripción: $description',
            style: TextStyle(color: textColor, fontSize: 13),
          ),
      ],
    );
  }

  void _showOfferDialog() {
    final priceController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFFD9D9D9),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Precio de servicio',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Establezca un precio de servicio para enviarle la propuesta al cliente',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.primary, fontSize: 14),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: priceController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 24,
                  ),
                  decoration: InputDecoration(
                    hintText: r'$ 0.00',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(context),
                        style: TextButton.styleFrom(
                          backgroundColor: const Color(
                            0xFFBDBDBD,
                          ).withOpacity(0.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Cancelar',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextButton(
                        onPressed: () async {
                          final price =
                              double.tryParse(priceController.text) ?? 0;
                          if (price > 0) {
                            Navigator.pop(context);
                            final response = await _messageService.sendOffer(
                              receiverId: _otherUserId!,
                              offerPrice: price,
                            );
                            if (response.success) {
                              _loadMessages(_otherUserId!);
                            }
                          }
                        },
                        style: TextButton.styleFrom(
                          backgroundColor: const Color(0xFFD9D9D9),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          side: const BorderSide(color: Color(0xFFBDBDBD)),
                        ),
                        child: const Text(
                          'Enviar',
                          style: TextStyle(
                            color: Color(0xFF3B28FF),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildInputArea() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.sentiment_satisfied_alt,
            color: AppColors.primary,
            size: 28,
          ),
          if (_userRole == 'tech') ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _showOfferDialog,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.primary, width: 1.5),
                ),
                child: const Icon(
                  Icons.attach_money,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
            ),
          ],
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: _messageController,
              decoration: const InputDecoration(
                hintText: 'Escriba un mensaje...',
                hintStyle: TextStyle(color: AppColors.primary, fontSize: 16),
                border: InputBorder.none,
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.send, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChecks(Map<String, dynamic> msg) {
    if (msg['is_read'] == true) {
      return const Icon(
        Icons.done_all,
        color: AppColors.chatCheckRead,
        size: 16,
      );
    } else if (msg['delivered_at'] != null) {
      return const Icon(
        Icons.done_all,
        color: AppColors.chatCheckSent,
        size: 16,
      );
    } else {
      return const Icon(Icons.done, color: AppColors.chatCheckSent, size: 16);
    }
  }

  void _showClientProfileDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CustomAvatar(
              name: _otherUserName ?? 'Cliente',
              size: 80,
              fontSize: 32,
            ),
            const SizedBox(height: 16),
            Text(
              _otherUserName ?? 'Cliente',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Text('Cliente verificado J&P'),
            const SizedBox(height: 16),
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.star, color: Colors.amber),
                Text(' 4.9 (Promedio de servicios)'),
              ],
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cerrar'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble({
    required Map<String, dynamic> msg,
    required bool isMe,
  }) {
    final message = msg['message_text'] ?? '';
    final time = _formatTime(msg['created_at']);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Detección mejorada de mensaje eliminado
    final isDeleted =
        msg['deleted_at'] != null ||
        message.contains('🚫') ||
        message.toLowerCase().contains('mensaje eliminado');
    final isEdited = msg['is_edited'] == true || msg['is_edited'] == 1;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: GestureDetector(
        onLongPress: isDeleted ? null : () => _showMessageOptions(msg, isMe),
        child: Column(
          crossAxisAlignment: isMe
              ? CrossAxisAlignment.end
              : CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 4),
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 6),
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              decoration: BoxDecoration(
                color: isMe ? AppColors.primary : (isDark ? const Color(0xFF1E293B) : Colors.white),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: isMe ? const Radius.circular(16) : Radius.zero,
                  bottomRight: isMe ? Radius.zero : const Radius.circular(16),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12, right: 10),
                    child: Text(
                      isDeleted ? 'Mensaje eliminado' : message,
                      style: GoogleFonts.outfit(
                        color: isMe
                            ? (isDeleted ? Colors.white70 : Colors.white)
                            : (isDeleted
                                  ? AppColors.textSecondary
                                  : AppColors.textPrimary),
                        fontSize: 15,
                        fontStyle: isDeleted
                            ? FontStyle.italic
                            : FontStyle.normal,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isEdited && !isDeleted)
                          Padding(
                            padding: const EdgeInsets.only(right: 4),
                            child: Text(
                              'editado',
                              style: TextStyle(
                                color: (isMe
                                    ? Colors.white70
                                    : AppColors.textLight),
                                fontSize: 9,
                              ),
                            ),
                          ),
                        Text(
                          time,
                          style: TextStyle(
                            color: (isMe
                                ? Colors.white70
                                : AppColors.textLight),
                            fontSize: 10,
                          ),
                        ),
                        if (isMe && !isDeleted) ...[
                          const SizedBox(width: 4),
                          _buildStatusChecks(msg),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showMessageOptions(Map<String, dynamic> msg, bool isMe) {
    final message = msg['message_text'] ?? '';
    final bool isDeleted =
        msg['deleted_at'] != null ||
        message.contains('🚫') ||
        message.toLowerCase().contains('mensaje eliminado');
    if (isDeleted) return; // No options for deleted messages

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isMe && msg['message_type'] == 'text')
              ListTile(
                leading: const Icon(Icons.edit, color: AppColors.primary),
                title: const Text('Editar mensaje'),
                onTap: () {
                  Navigator.pop(context);
                  _showEditDialog(msg);
                },
              ),
            ListTile(
              leading: const Icon(Icons.delete, color: Colors.red),
              title: Text(isMe ? 'Eliminar para todos' : 'Eliminar para mí'),
              onTap: () {
                Navigator.pop(context);
                _handleDeleteMessage(msg, isMe);
              },
            ),
            if (isMe)
              ListTile(
                leading: const Icon(Icons.delete_outline, color: Colors.grey),
                title: const Text('Eliminar para mí'),
                onTap: () {
                  Navigator.pop(context);
                  _handleDeleteMessage(
                    msg,
                    false,
                  ); // false here means only for me
                },
              ),
          ],
        ),
      ),
    );
  }

  void _showEditDialog(Map<String, dynamic> msg) {
    final controller = TextEditingController(text: msg['message_text']);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Editar mensaje'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Nuevo mensaje...'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.trim().isNotEmpty) {
                final res = await _messageService.updateMessage(
                  msg['id'],
                  controller.text.trim(),
                );
                if (mounted) Navigator.pop(context);
                if (res.success) _loadMessages(_otherUserId!);
              }
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleDeleteMessage(
    Map<String, dynamic> msg,
    bool forEveryone,
  ) async {
    final res = await _messageService.deleteMessage(
      msg['id'],
      forEveryone: forEveryone,
    );
    if (res.success) {
      _loadMessages(_otherUserId!);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res.message ?? 'Error al eliminar mensaje')),
        );
      }
    }
  }

  Widget _buildOfferBubble({
    int? messageId,
    required String price,
    required bool isCanceled,
    required String time,
    required bool isMe,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Column(
        crossAxisAlignment: isMe
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 8),
            padding: const EdgeInsets.all(16),
            width: 200,
            decoration: BoxDecoration(
              color: isMe 
                  ? const Color(0xFF3B28FF) 
                  : isDark 
                      ? const Color(0xFF1E293B) 
                      : const Color(0xFFEBEBEB),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Text(
                  'Tarifa de servicio:',
                  style: TextStyle(
                    color: (isMe ? Colors.white : Colors.blue).withOpacity(0.4),
                    fontSize: 12,
                  ),
                ),
                Text(
                  'S/.$price',
                  style: TextStyle(
                    color: isMe ? Colors.white : Colors.blue,
                    fontSize: 28,
                    fontWeight: FontWeight.w300,
                    decoration: isCanceled ? TextDecoration.lineThrough : null,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: (isCanceled || (isMe && messageId == null))
                        ? null
                        : () async {
                            if (isMe) {
                              // Cancelar Oferta
                              final response = await _messageService
                                  .cancelOffer(messageId!);
                              if (response.success) {
                                _loadMessages(_otherUserId!);
                              }
                            } else {
                              // Pagar (Accept)
                              final response = await _messageService
                                  .acceptOffer(messageId!);
                              if (response.success) {
                                _loadMessages(_otherUserId!);
                              }
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isCanceled
                          ? const Color(0xFFBDBDBD).withOpacity(0.5)
                          : (isMe
                                ? Colors.transparent
                                : const Color(0xFF3B28FF)),
                      disabledBackgroundColor: const Color(
                        0xFFBDBDBD,
                      ).withOpacity(0.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: isMe && !isCanceled
                            ? const BorderSide(color: Colors.white)
                            : BorderSide.none,
                      ),
                    ),
                    child: Text(
                      isMe ? 'Cancelar Oferta' : 'Pagar',
                      style: TextStyle(
                        color: isCanceled
                            ? Colors.white.withOpacity(0.6)
                            : Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: EdgeInsets.only(
              right: isMe ? 8 : 0,
              left: isMe ? 0 : 8,
              bottom: 8,
            ),
            child: Text(
              isCanceled ? 'El técnico ha cancelado esta oferta\n$time' : time,
              style: TextStyle(
                color: Colors.blue.withOpacity(0.6),
                fontSize: 10,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showClientRatingDialog() {
    int selectedStars = 5;
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFD9D9D9),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Calificar al Cliente',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xFF3B28FF),
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Puntua tu experiencia con este cliente',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF3B28FF), fontSize: 14),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        return GestureDetector(
                          onTap: () {
                            setDialogState(() {
                              selectedStars = index + 1;
                            });
                          },
                          child: Icon(
                            Icons.star,
                            color: index < selectedStars
                                ? const Color(0xFFFFD700)
                                : const Color(0xFFBDBDBD),
                            size: 40,
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 30),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () => Navigator.pop(context),
                            style: TextButton.styleFrom(
                              backgroundColor: const Color(0xFFBDBDBD),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'Cancelar',
                              style: TextStyle(
                                color: Color(0xFF3B28FF),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextButton(
                            onPressed: () async {
                              // Use technician review service as placeholder logic for now
                              // Ideally backend should have a separate endpoint for rating clients
                              if (_otherUserId != null) {
                                final response = await _technicianService
                                    .addReview(
                                      technicianId: _otherUserId!,
                                      rating: selectedStars,
                                      comment: '',
                                      appointmentId: null, // Now allowed by DB
                                    );

                                if (context.mounted) {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        response.message ??
                                            (response.success
                                                ? 'Reseña enviada con éxito'
                                                : 'Error al enviar reseña'),
                                      ),
                                      backgroundColor: response.success
                                          ? Colors.green
                                          : Colors.red,
                                    ),
                                  );
                                }
                              }
                            },
                            style: TextButton.styleFrom(
                              backgroundColor: const Color(0xFFEEEEEE),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              side: const BorderSide(color: Color(0xFFBDBDBD)),
                            ),
                            child: const Text(
                              'Valorar',
                              style: TextStyle(
                                color: Color(0xFF3B28FF),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget? _buildActiveOrderBar() {
    if (_messages.isEmpty) return null;

    dynamic latestOrderMsg;
    try {
      latestOrderMsg = _messages.reversed.firstWhere(
        (m) => m['message_type'] == 'order',
        orElse: () => null,
      );
    } catch (_) {
      return null;
    }

    if (latestOrderMsg == null) return null;

    final String status = latestOrderMsg['order_status'] ?? 'pending';
    if (status == 'delivered') {
      return null; // Don't show bar for terminal states
    }

    final int? orderId = latestOrderMsg['order_id'];
    final String productName =
        latestOrderMsg['order_product_name'] ?? 'Producto';

    final List<dynamic> statusInfo = _getOrderStatusInfo(status);
    final Color statusColor = statusInfo[0];
    final String statusText = statusInfo[1];

    final bool isTechOrStore =
        _userRole == 'tech' ||
        _userRole == 'technician' ||
        _userRole == 'provider' ||
        _userRole == 'store' ||
        _userRole == 'sucursal';
    final bool canMarkAsDelivered = status == 'shipped' && !isTechOrStore;

    final String? deliveryAddress = latestOrderMsg['order_address'];
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.shopping_bag,
                  color: AppColors.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      productName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: statusColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          statusText.toUpperCase(),
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'PEDIDO',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                    ),
                  ),
                  Text(
                    'ACTIVO',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (deliveryAddress != null && (_userRole != 'client')) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF334155) : Colors.grey[50],
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey[200]!),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.location_on,
                    color: Colors.redAccent,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Enviar a: $deliveryAddress',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.white70 : Colors.black87,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (canMarkAsDelivered) ...[
            const SizedBox(height: 15),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  if (orderId == null) return;
                  if (canMarkAsDelivered) {
                    _updateStoreOrderStatus(orderId, 'delivered');
                  }
                },
                icon: const Icon(Icons.done_all, size: 20),
                label: const Text(
                  'CONFIRMAR RECEPCIÓN',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                  elevation: 0,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  List<dynamic> _getOrderStatusInfo(String status) {
    switch (status) {
      case 'pending':
        return [Colors.orange, 'Pendiente ⏳'];
      case 'confirmed':
        return [Colors.blue, 'Confirmado ✔️'];
      case 'shipped':
        return [Colors.purple, 'En Camino 🚚'];
      case 'delivered':
        return [Colors.green, 'Entregado ✅'];
      case 'cancelled':
        return [Colors.red, 'Cancelado ❌'];
      default:
        return [Colors.grey, 'Desconocido ❓'];
    }
  }

  Widget _buildOrderBubble({
    int? orderId,
    required String productName,
    required String status,
    String? orderAddress,
    dynamic orderLat,
    dynamic orderLng,
    required String message,
    required String time,
    required bool isMe,
    String? paymentStatus,
    String? paymentMethod,
    double? price,
  }) {
    final List<dynamic> statusInfo = _getOrderStatusInfo(status);
    final Color statusColor = statusInfo[0];
    final String statusText = statusInfo[1];
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final double? lat = double.tryParse(orderLat?.toString() ?? '');
    final double? lng = double.tryParse(orderLng?.toString() ?? '');

    final bool isPaid = paymentStatus == 'paid';
    final bool isWaiting = paymentStatus == 'waiting_confirmation';

    final bool isTechOrStore =
        _userRole == 'tech' ||
        _userRole == 'technician' ||
        _userRole == 'provider' ||
        _userRole == 'store' ||
        _userRole == 'sucursal';
    final bool canMarkAsDelivered = status == 'shipped' && !isTechOrStore;

    return Align(
      alignment: !isMe ? Alignment.centerLeft : Alignment.centerRight,
      child: Column(
        crossAxisAlignment: !isMe
            ? CrossAxisAlignment.start
            : CrossAxisAlignment.end,
        children: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 8),
            padding: const EdgeInsets.all(12),
            width: 250,
            decoration: BoxDecoration(
              color: isMe 
                  ? AppColors.primary 
                  : isDark 
                      ? const Color(0xFF1E293B) 
                      : const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(15),
              boxShadow: AppColors.softShadow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.shopping_bag_outlined,
                      color: isMe ? Colors.white70 : AppColors.primary,
                      size: 16,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Pedido #${orderId ?? ""}',
                      style: TextStyle(
                        color: isMe ? Colors.white70 : AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  productName,
                  style: TextStyle(
                    color: isMe ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                if (message.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: TextStyle(
                      color: isMe ? Colors.white70 : Colors.black54,
                      fontSize: 12,
                    ),
                  ),
                ],
                if (orderAddress != null && orderAddress.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 14,
                        color: isMe ? Colors.white70 : Colors.grey,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          orderAddress,
                          style: TextStyle(
                            fontSize: 11,
                            color: isMe ? Colors.white70 : Colors.grey[700],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        statusText.toUpperCase(),
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 8,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    if (lat != null && lng != null)
                      GestureDetector(
                        onTap: () => _openMap(lat, lng),
                        child: Text(
                          'VER MAPA',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: isMe ? Colors.white : AppColors.primary,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                  ],
                ),

                // Price and Payment Status
                if (price != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total: S/. ${price.toStringAsFixed(2)}',
                        style: TextStyle(
                          color: isMe ? Colors.white : AppColors.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      if (isPaid)
                        Text(
                          'PAGADO',
                          style: TextStyle(
                            color: isMe
                                ? Colors.greenAccent
                                : Colors.green[700],
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                    ],
                  ),
                ],

                const SizedBox(height: 12),

                // Payment Action Buttons
                if (status != 'cancelled' &&
                    orderId != null &&
                    price != null) ...[
                  // Client Pays
                  if (!isTechOrStore && paymentStatus == 'pending')
                    _buildActionButton(
                      label: '💳 Pagar S/. ${price.toStringAsFixed(2)}',
                      onPressed: () =>
                          _showOrderPaymentMethodDialog(orderId, price),
                      bgColor: const Color(0xFF00C853),
                      fgColor: Colors.white,
                    ),

                  // Waiting / Confirm flow
                  if (isWaiting || isPaid) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: isPaid
                            ? Colors.green.withOpacity(0.25)
                            : Colors.orange.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isPaid ? Icons.lock : Icons.access_time,
                            size: 14,
                            color: isPaid ? Colors.green : Colors.orange,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              isPaid
                                  ? '✅ Pedido Pagado'
                                  : (isTechOrStore
                                        ? '⏳ Pagó vía ${(paymentMethod ?? '').toUpperCase()} — Confirma el pago'
                                        : '⏳ Esperando confirmación de tienda...'),
                              style: TextStyle(
                                color: isPaid
                                    ? (isMe ? Colors.white : Colors.green[800])
                                    : (isMe
                                          ? Colors.white
                                          : Colors.orange[900]),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Confirm button (Store only while waiting)
                    if (isTechOrStore &&
                        isWaiting &&
                        (paymentMethod ?? '').toLowerCase() != 'culqi') ...[
                      _buildActionButton(
                        label: '✔ Confirmar Pago Recibido',
                        onPressed: () => _handleConfirmOrderPayment(orderId),
                        bgColor: AppColors.primary,
                        fgColor: Colors.white,
                      ),
                    ],
                  ],
                ],

                if (canMarkAsDelivered) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        if (orderId == null) return;
                        _updateStoreOrderStatus(orderId, 'delivered');
                      },
                      icon: const Icon(Icons.check_circle_outline, size: 16),
                      label: const Text(
                        'CONFIRMAR RECEPCIÓN',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Padding(
            padding: EdgeInsets.only(
              right: isMe ? 8 : 0,
              left: !isMe ? 8 : 0,
              bottom: 8,
            ),
            child: Text(
              time,
              style: const TextStyle(color: Colors.grey, fontSize: 10),
            ),
          ),
        ],
      ),
    );
  }

  void _openMap(double lat, double lng) {
    // Implementación simple para abrir mapa externo o interno si se prefiere
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: 400,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                'Ubicación de entrega',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ),
            Expanded(
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: LatLng(lat, lng),
                  initialZoom: 15,
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: LatLng(lat, lng),
                        width: 80,
                        height: 80,
                        child: const Icon(
                          Icons.location_on,
                          color: Colors.red,
                          size: 40,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('CERRAR'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentProgressBubble({
    required String message,
    required String status,
    required String time,
    required bool isMe,
  }) {
    final steps = [
      {'id': 'confirmed', 'label': 'Confirmado', 'icon': Icons.verified},
      {'id': 'on_the_way', 'label': 'En Camino', 'icon': Icons.directions_car},
      {'id': 'arrived', 'label': 'Llegó', 'icon': Icons.location_on},
      {'id': 'in_progress', 'label': 'Trabajando', 'icon': Icons.build},
      {'id': 'completed', 'label': 'Terminado', 'icon': Icons.stars},
    ];

    int currentIndex = steps.indexWhere((s) => s['id'] == status);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.info_outline,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Progreso del Servicio',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(fontSize: 14, color: isDark ? Colors.white70 : Colors.black87),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(steps.length, (index) {
              final step = steps[index];
              final bool isPast = index < currentIndex;
              final bool isCurrent = index == currentIndex;

              Color color;
              if (isPast)
                color = const Color(0xFF4CAF50);
              else if (isCurrent)
                color = AppColors.primary;
              else
                color = Colors.grey.shade300;

              return Expanded(
                child: Column(
                  children: [
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        if (index < steps.length - 1)
                          Positioned(
                            left: 15,
                            right: -15,
                            child: Container(
                              height: 2,
                              color: index < currentIndex
                                  ? const Color(0xFF4CAF50)
                                  : Colors.grey.shade200,
                            ),
                          ),
                        Container(
                          width: 30,
                          height: 30,
                          decoration: BoxDecoration(
                            color: isCurrent ? color : Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: color, width: 2),
                          ),
                          child: Icon(
                            step['icon'] as IconData,
                            size: 14,
                            color: isCurrent ? Colors.white : color,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      step['label'] as String,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: isCurrent
                            ? FontWeight.bold
                            : FontWeight.normal,
                        color: isCurrent ? AppColors.primary : Colors.grey,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.bottomRight,
            child: Text(
              time,
              style: const TextStyle(fontSize: 10, color: Colors.grey),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _updateStoreOrderStatus(int orderId, String newStatus) async {
    final res = await _storeService.updateOrderStatus(orderId, newStatus);
    if (res.success) {
      _loadMessages(_otherUserId!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Pedido actualizado a $newStatus')),
        );
      }
    }
  }
}
