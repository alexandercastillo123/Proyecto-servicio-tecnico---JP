import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/message_service.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/services/appointment_service.dart';
import '../../../../core/services/technician_service.dart';
import '../../../../core/theme/app_colors.dart';

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
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<dynamic> _messages = [];
  bool _isLoading = true;
  String? _errorMessage;
  int? _otherUserId;
  String? _userRole;

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
        int? userId;
        if (extra is int) {
          userId = extra;
        } else if (extra is String) {
          userId = int.tryParse(extra);
        } else {
          // Fallback: try converting to string and parsing if it's some other type (e.g. double)
          userId = int.tryParse(extra.toString());
        }

        if (userId != null) {
          _otherUserId = userId;
          _loadInitialData(userId);
          return;
        }
      }
      
      setState(() {
        _isLoading = false;
        _errorMessage = 'ID de usuario no proporcionado o inválido';
      });
    }
  }

  Future<void> _loadInitialData(int userId) async {
    try {
      final profileRes = await _userService.getProfile();
      if (profileRes.success) {
        _userRole = profileRes.data?['role'];
      }
      await _loadMessages(userId);
    } catch (e) {
      await _loadMessages(userId);
    }
  }

  Future<void> _loadMessages(int userId) async {
    try {
      final response = await _messageService.getMessages(userId);
      if (response.success) {
        setState(() {
          _messages = response.data ?? [];
          _isLoading = false;
        });
        _scrollToBottom();
      } else {
        setState(() {
          _errorMessage = response.message;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error al cargar mensajes';
        _isLoading = false;
      });
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F1F1),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leadingWidth: 115,
        leading: TextButton.icon(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_left, color: AppColors.primary),
          label: const Text(
            'Regresar',
            style: TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        actions: [
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
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
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
                      } else {
                        bubble = _buildMessageBubble(
                          message: msg['message_text'] ?? '',
                          time: time,
                          isMe: isMe,
                        );
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
                _buildInputArea(),
              ],
            ),
    );
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
              color: isMe ? AppColors.primary : const Color(0xFFEBEBEB),
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
                            : (price == null ? '🔧 Propuesta de Chamba' : '💼 Chamba Activa'),
                        style: TextStyle(
                          color: isMe ? Colors.white : AppColors.primary,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          decoration:
                              (appointmentId == -1 ||
                                  appointmentId == null ||
                                  appointmentStatus == 'cancelled')
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
                      onPressed: () => _showPaymentMethodDialog(appointmentId),
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
                    if (isTech && isWaiting) ...[
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
                              content: const Text('¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('NO, VOLVER')),
                                TextButton(
                                  onPressed: () => Navigator.pop(context, true), 
                                  child: const Text('SÍ, CANCELAR', style: TextStyle(color: Colors.red))
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

                  if (isPaid)
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

  void _showPaymentMethodDialog(int appointmentId) {
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
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
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

  Widget _buildMessageBubble({
    required String message,
    required String time,
    required bool isMe,
  }) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Column(
        crossAxisAlignment: isMe
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 4),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            constraints: const BoxConstraints(maxWidth: 280),
            decoration: BoxDecoration(
              color: isMe ? const Color(0xFF3B28FF) : const Color(0xFFEBEBEB),
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(12),
                topRight: const Radius.circular(12),
                bottomLeft: isMe ? const Radius.circular(12) : Radius.zero,
                bottomRight: isMe ? Radius.zero : const Radius.circular(12),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message,
                  style: TextStyle(
                    color: isMe ? Colors.white : Colors.blue,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  time,
                  style: TextStyle(
                    color: (isMe ? Colors.white : Colors.blue).withValues(
                      alpha: 0.6,
                    ),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOfferBubble({
    int? messageId,
    required String price,
    required bool isCanceled,
    required String time,
    required bool isMe,
  }) {
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
              color: isMe ? const Color(0xFF3B28FF) : const Color(0xFFEBEBEB),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Text(
                  'Tarifa de servicio:',
                  style: TextStyle(
                    color: (isMe ? Colors.white : Colors.blue).withValues(
                      alpha: 0.4,
                    ),
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
                          ? const Color(0xFFBDBDBD).withValues(alpha: 0.5)
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
                            ? Colors.white.withValues(alpha: 0.6)
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
}
