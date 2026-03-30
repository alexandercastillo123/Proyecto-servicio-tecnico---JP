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
      final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
      final period = date.hour >= 12 ? 'pm' : 'am';
      final minute = date.minute.toString().padLeft(2, '0');
      return '$hour:$minute $period';
    } catch (e) {
      return '';
    }
  }

  String _formatDate(String dateStr) {
    try {
      if (dateStr.contains('(')) {
        final regex = RegExp(r'\(([^)]+)\)');
        final match = regex.firstMatch(dateStr);
        if (match != null) dateStr = match.group(1)!;
      }
      final date = DateTime.parse(dateStr);
      final days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      return days[date.weekday - 1];
    } catch (e) {
      return dateStr;
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isLoading && _otherUserId == null) {
      final extra = GoRouterState.of(context).extra;
      if (extra != null && extra is int) {
        _otherUserId = extra;
        _loadInitialData(extra);
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'ID de usuario no proporcionado';
        });
      }
    }
  }

  Future<void> _loadInitialData(int userId) async {
    try {
      final profileRes = await _userService.getProfile();
      if (profileRes.success) _userRole = profileRes.data?['role'];
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

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _otherUserId == null) return;
    _messageController.clear();

    setState(() {
      _messages.add({
        'message_text': text,
        'sender_id': 'me',
        'created_at': DateTime.now().toIso8601String(),
        'is_me': true,
      });
    });
    _scrollToBottom();

    try {
      final response = await _messageService.sendMessage(
        receiverId: _otherUserId!,
        messageText: text,
      );
      if (response.success) _loadMessages(_otherUserId!);
    } catch (e) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        leadingWidth: 120,
        leading: TextButton.icon(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          label: const Text('Regresar', style: TextStyle(fontWeight: FontWeight.w600)),
          style: TextButton.styleFrom(
            padding: const EdgeInsets.only(left: 8),
            alignment: Alignment.centerLeft,
          ),
        ),
        actions: [
          if (_userRole == 'tech' || _userRole == 'technician' || _userRole == 'provider')
            Container(
              margin: const EdgeInsets.only(right: 12),
              child: ElevatedButton.icon(
                onPressed: _showClientRatingDialog,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primarySoft.withOpacity(0.3),
                  foregroundColor: AppColors.primary,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.star_rounded, size: 18),
                label: const Text('Reseñar', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
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
                        physics: const BouncingScrollPhysics(),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isMe = msg['is_me'] == true ||
                              msg['sender_id'] == 'me' ||
                              (msg['sender_id'] != null &&
                                  msg['sender_id'].toString() != _otherUserId?.toString());
                          final time = _formatTime(msg['created_at']);

                          if (msg['message_type'] == 'offer') {
                            return _buildOfferBubble(
                              messageId: msg['id'],
                              price: msg['offer_price'].toString(),
                              isCanceled: msg['offer_status'] == 'cancelled',
                              time: time,
                              isMe: isMe,
                            );
                          }

                          if (msg['message_type'] == 'appointment') {
                            return _buildAppointmentBubble(
                              appointmentId: msg['appointment_id'],
                              message: msg['message_text'] ?? '',
                              description: msg['appointment_description'],
                              time: time,
                              isMe: isMe,
                            );
                          }

                          return _buildMessageBubble(
                            message: msg['message_text'] ?? '',
                            time: time,
                            isMe: isMe,
                          );
                        },
                      ),
                    ),
                    _buildInputArea(),
                  ],
                ),
    );
  }

  Widget _buildMessageBubble({required String message, required String time, required bool isMe}) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: const BoxConstraints(maxWidth: 280),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: isMe ? const Radius.circular(18) : const Radius.circular(4),
            bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(18),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isMe ? 0.1 : 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message,
              style: TextStyle(
                color: isMe ? Colors.white : AppColors.textPrimary,
                fontSize: 14,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              time,
              style: TextStyle(
                color: (isMe ? Colors.white : AppColors.textSecondary).withOpacity(0.6),
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentBubble({
    int? appointmentId,
    required String message,
    String? description,
    required String time,
    required bool isMe,
  }) {
    String datePart = '';
    String timePart = '';

    if (message.contains('para ') && message.contains(' a las ')) {
      try {
        final parts = message.split(' a las ');
        if (parts.length > 1) {
          final dateSubParts = parts[0].split('para ');
          if (dateSubParts.length > 1) datePart = _formatDate(dateSubParts[1]);
          final timeSubParts = parts[1].split('\n');
          timePart = timeSubParts[0];
          if ((description == null || description.isEmpty) && parts[1].contains('Motivo:')) {
            description = parts[1].split('Motivo:')[1].trim();
          }
        }
      } catch (e) {}
    }

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.all(16),
        width: 280,
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isMe ? 0.1 : 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.calendar_month_rounded, color: isMe ? Colors.white : AppColors.primary, size: 18),
                const SizedBox(width: 6),
                Text(
                  'Cita agendada',
                  style: TextStyle(
                    color: isMe ? Colors.white : AppColors.primary,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (datePart.isNotEmpty) ...[
              _buildAppointmentDetail('Día', datePart, isMe),
              _buildAppointmentDetail('Hora', timePart, isMe),
              if (description != null && description.isNotEmpty)
                _buildAppointmentDetail('Motivo', description, isMe),
            ] else ...[
              Text(message, style: TextStyle(color: isMe ? Colors.white : AppColors.textPrimary, fontSize: 13)),
            ],
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: appointmentId == null
                    ? null
                    : () async {
                        final response = await _appointmentService.cancelAppointment(appointmentId);
                        if (response.success) _loadMessages(_otherUserId!);
                      },
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: isMe ? Colors.white.withOpacity(0.5) : AppColors.error.withOpacity(0.5)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
                child: Text(
                  'Cancelar Cita',
                  style: TextStyle(
                    color: isMe ? Colors.white : AppColors.error,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentDetail(String label, String value, bool isMe) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        '$label: $value',
        style: TextStyle(
          color: (isMe ? Colors.white : AppColors.textSecondary).withOpacity(0.8),
          fontSize: 13,
        ),
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
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.all(16),
        width: 200,
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isMe ? 0.1 : 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Text(
              'Tarifa de servicio',
              style: TextStyle(
                color: (isMe ? Colors.white : AppColors.textSecondary).withOpacity(0.6),
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'S/.$price',
              style: TextStyle(
                color: isMe ? Colors.white : AppColors.primary,
                fontSize: 28,
                fontWeight: FontWeight.w700,
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
                          final response = await _messageService.cancelOffer(messageId!);
                          if (response.success) _loadMessages(_otherUserId!);
                        } else {
                          final response = await _messageService.acceptOffer(messageId!);
                          if (response.success) _loadMessages(_otherUserId!);
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: isCanceled
                      ? AppColors.divider
                      : (isMe ? Colors.white.withOpacity(0.2) : AppColors.primary),
                  foregroundColor: isMe ? Colors.white : Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
                child: Text(
                  isMe ? 'Cancelar Oferta' : 'Pagar',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_userRole == 'tech') ...[
            GestureDetector(
              onTap: _showOfferDialog,
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primarySoft.withOpacity(0.3),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.attach_money_rounded, color: AppColors.primary, size: 22),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.inputFill,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.inputBorder, width: 1.5),
              ),
              child: TextField(
                controller: _messageController,
                decoration: const InputDecoration(
                  hintText: 'Escriba un mensaje...',
                  hintStyle: TextStyle(color: AppColors.textLight, fontSize: 14),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }

  void _showOfferDialog() {
    final priceController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          icon: Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
            child: const Icon(Icons.attach_money_rounded, color: AppColors.primary, size: 32),
          ),
          title: const Text(
            'Precio de servicio',
            textAlign: TextAlign.center,
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Establezca un precio para enviar al cliente',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: priceController,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.primary, fontSize: 28, fontWeight: FontWeight.w700),
                decoration: InputDecoration(
                  hintText: r'$ 0.00',
                  filled: true,
                  fillColor: AppColors.inputFill,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ],
          ),
          actionsAlignment: MainAxisAlignment.spaceEvenly,
          actions: [
            SizedBox(
              width: 110,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.textSecondary,
                  side: const BorderSide(color: AppColors.divider),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Cancelar', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
            SizedBox(
              width: 110,
              child: ElevatedButton(
                onPressed: () async {
                  final price = double.tryParse(priceController.text) ?? 0;
                  if (price > 0) {
                    Navigator.pop(context);
                    final response = await _messageService.sendOffer(
                      receiverId: _otherUserId!,
                      offerPrice: price,
                    );
                    if (response.success) _loadMessages(_otherUserId!);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Enviar', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showClientRatingDialog() {
    int selectedStars = 5;
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.surface,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              icon: Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(color: Color(0xFFFEF3C7), shape: BoxShape.circle),
                child: const Icon(Icons.star_rounded, color: Color(0xFFFBBF24), size: 36),
              ),
              title: const Text(
                'Calificar al Cliente',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Puntua tu experiencia con este cliente',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      return GestureDetector(
                        onTap: () => setDialogState(() => selectedStars = index + 1),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: Icon(
                            Icons.star_rounded,
                            color: index < selectedStars ? const Color(0xFFFBBF24) : AppColors.divider,
                            size: 40,
                          ),
                        ),
                      );
                    }),
                  ),
                ],
              ),
              actionsAlignment: MainAxisAlignment.spaceEvenly,
              actions: [
                SizedBox(
                  width: 110,
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      side: const BorderSide(color: AppColors.divider),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Cancelar', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
                SizedBox(
                  width: 110,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (_otherUserId != null) {
                        final response = await _technicianService.addReview(
                          technicianId: _otherUserId!,
                          rating: selectedStars,
                          comment: '',
                          appointmentId: null,
                        );
                        if (context.mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(response.success ? 'Reseña enviada con éxito' : (response.message ?? 'Error')),
                              backgroundColor: response.success ? AppColors.success : AppColors.error,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              margin: const EdgeInsets.all(16),
                            ),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Valorar', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
