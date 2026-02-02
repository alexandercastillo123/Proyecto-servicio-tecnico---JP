import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/message_service.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/services/appointment_service.dart';
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
  final TextEditingController _messageController = TextEditingController();
  List<dynamic> _messages = [];
  bool _isLoading = true;
  String? _errorMessage;
  int? _otherUserId;
  String? _userRole;

  String _formatTime(String? timestamp) {
    if (timestamp == null) return '';
    try {
      final date = DateTime.parse(timestamp).toLocal();
      final hour = date.hour.toString().padLeft(2, '0');
      final minute = date.minute.toString().padLeft(2, '0');
      return '$hour:$minute';
    } catch (e) {
      return '';
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
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? Center(child: Text(_errorMessage!))
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
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

  Widget _buildAppointmentBubble({
    int? appointmentId,
    required String message,
    String? description,
    required String time,
    required bool isMe,
  }) {
    return Column(
      crossAxisAlignment: isMe
          ? CrossAxisAlignment.end
          : CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          padding: const EdgeInsets.all(16),
          width: 280,
          decoration: BoxDecoration(
            color: isMe ? AppColors.primary : const Color(0xFFEBEBEB),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Cita agendada:',
                style: TextStyle(
                  color: isMe ? Colors.white : AppColors.primary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                style: TextStyle(
                  color: isMe ? Colors.white : AppColors.primary,
                  fontSize: 14,
                ),
              ),
              if (description != null && description.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Motivo: $description',
                  style: TextStyle(
                    color: isMe
                        ? Colors.white.withOpacity(0.9)
                        : Colors.black87,
                    fontSize: 13,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Center(
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: appointmentId == null
                        ? null
                        : () async {
                            final response = await _appointmentService
                                .cancelAppointment(appointmentId);
                            if (response.success) {
                              _loadMessages(_otherUserId!);
                            }
                          },
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: isMe ? Colors.white : AppColors.primary,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(
                      'Cancelar Cita',
                      style: TextStyle(
                        color: isMe ? Colors.white : AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
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
            time,
            style: TextStyle(color: Colors.blue.withOpacity(0.6), fontSize: 10),
          ),
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
    return Column(
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
                  color: (isMe ? Colors.white : Colors.blue).withOpacity(0.6),
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOfferBubble({
    int? messageId,
    required String price,
    required bool isCanceled,
    required String time,
    required bool isMe,
  }) {
    return Column(
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
                            final response = await _messageService.cancelOffer(
                              messageId!,
                            );
                            if (response.success) {
                              _loadMessages(_otherUserId!);
                            }
                          } else {
                            // Pagar (Accept)
                            final response = await _messageService.acceptOffer(
                              messageId!,
                            );
                            if (response.success) {
                              _loadMessages(_otherUserId!);
                            }
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isCanceled
                        ? const Color(0xFFBDBDBD).withOpacity(0.5)
                        : (isMe ? Colors.transparent : const Color(0xFF3B28FF)),
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
            style: TextStyle(color: Colors.blue.withOpacity(0.6), fontSize: 10),
          ),
        ),
      ],
    );
  }
}
