import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:lottie/lottie.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/services/store_service.dart';
import '../../../../core/services/appointment_service.dart';
import 'order_details_screen.dart';

/// Pantalla de Pago con Culqi (MODO TEST)
/// Simula un formulario de tarjeta de crédito real con la API de Culqi test
class CulqiPaymentScreen extends StatefulWidget {
  /// 'appointment' o 'order'
  final String paymentType;
  final int entityId;
  final double amount;
  final String description;

  const CulqiPaymentScreen({
    super.key,
    required this.paymentType,
    required this.entityId,
    required this.amount,
    required this.description,
  });

  @override
  State<CulqiPaymentScreen> createState() => _CulqiPaymentScreenState();
}

class _CulqiPaymentScreenState extends State<CulqiPaymentScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _cardNumberController = TextEditingController();
  final _cvvController = TextEditingController();
  final _expiryController = TextEditingController();
  final _emailController = TextEditingController();
  final _nameController = TextEditingController();

  bool _isProcessing = false;
  bool _paymentSuccess = false;
  String? _errorMsg;
  late AnimationController _animController;
  late Animation<double> _scaleAnim;

  static const String _culqiPublicKey = 'pk_test_Q7byV7qjU6Jpn0jv';

  /// Tarjetas de prueba Culqi
  static const List<Map<String, String>> _testCards = [
    {'number': '4111 1111 1111 1111', 'label': 'VISA (Aprobada)'},
    {'number': '5111 1111 1111 1118', 'label': 'Mastercard (Aprobada)'},
    {'number': '4000 0000 0000 0002', 'label': 'VISA (Rechazada)'},
  ];

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _scaleAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _cardNumberController.dispose();
    _cvvController.dispose();
    _expiryController.dispose();
    _emailController.dispose();
    _nameController.dispose();
    _animController.dispose();
    super.dispose();
  }

  /// Tokenizar la tarjeta con Culqi directamente desde el cliente
  Future<String?> _tokenizeCard() async {
    final rawNumber = _cardNumberController.text.replaceAll(' ', '');
    final expiry = _expiryController.text.split('/');
    if (expiry.length != 2) return null;

    try {
      final response = await http.post(
        Uri.parse('https://secure.culqi.com/v2/tokens'),
        headers: {
          'Authorization': 'Bearer $_culqiPublicKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'card_number': rawNumber,
          'cvv': _cvvController.text.trim(),
          'expiration_month': expiry[0].trim(),
          'expiration_year': '20${expiry[1].trim()}',
          'email': _emailController.text.trim(),
        }),
      );

      final data = jsonDecode(response.body);
      if (data['object'] == 'token') {
        return data['id'] as String;
      } else {
        setState(
          () =>
              _errorMsg = data['user_message'] ?? 'Error al tokenizar tarjeta',
        );
        return null;
      }
    } catch (e) {
      setState(() => _errorMsg = 'Error de conexión con Culqi');
      return null;
    }
  }

  Future<void> _processPay() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isProcessing = true;
      _errorMsg = null;
    });

    // 1. Tokenizar
    final token = await _tokenizeCard();
    if (token == null) {
      setState(() => _isProcessing = false);
      return;
    }

    // 2. Enviar al backend
    try {
      dynamic response;
      if (widget.paymentType == 'order') {
        final svc = StoreService();
        response = await svc.culqiPayOrder(widget.entityId, token);
      } else {
        final svc = AppointmentService();
        response = await svc.culqiPayAppointment(widget.entityId, token);
      }

      if (!mounted) return;

      if (response.success) {
        // Navegar a pantalla de detalles del pedido en lugar de volver al chat
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => OrderDetailsScreen(
              orderId: widget.entityId,
              amount: widget.amount,
              description: widget.description,
            ),
          ),
        );
      } else {
        setState(() => _errorMsg = response.message ?? 'Pago rechazado');
      }
    } catch (e) {
      setState(() => _errorMsg = 'Error inesperado. Intenta de nuevo.');
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _showSuccess() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Colors.green[700],
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 8),
            const Text(
              '¡Pago procesado con éxito! ✅',
              style: TextStyle(color: Colors.white),
            ),
          ],
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        ScaleTransition(
          scale: _scaleAnim,
          child: Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 32,
            ),
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.credit_card,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Pagar con Culqi',
                                  style: GoogleFonts.outfit(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF1E1B4B),
                                  ),
                                ),
                                Text(
                                  '🧪 MODO PRUEBA',
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    color: Colors.orange[700],
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(false),
                            icon: const Icon(Icons.close, color: Colors.grey),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Monto
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'Total a pagar',
                              style: GoogleFonts.outfit(
                                color: Colors.white70,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              'S/ ${widget.amount.toStringAsFixed(2)}',
                              style: GoogleFonts.outfit(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              widget.description,
                              style: GoogleFonts.outfit(
                                color: Colors.white60,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Tarjetas de prueba hint
                      ExpansionTile(
                        tilePadding: EdgeInsets.zero,
                        title: Text(
                          '🧪 Tarjetas de prueba',
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            color: Colors.orange[700],
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        children: _testCards
                            .map(
                              (c) => ListTile(
                                dense: true,
                                contentPadding: EdgeInsets.zero,
                                title: Text(
                                  c['label']!,
                                  style: const TextStyle(fontSize: 12),
                                ),
                                subtitle: Text(
                                  c['number']!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                trailing: IconButton(
                                  icon: const Icon(Icons.copy, size: 16),
                                  onPressed: () {
                                    _cardNumberController.text = c['number']!;
                                    _cvvController.text = '123';
                                    _expiryController.text = '12/26';
                                    _emailController.text = 'test@culqi.com';
                                    _nameController.text = 'Prueba Culqi';
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Datos de prueba cargados',
                                        ),
                                        duration: Duration(seconds: 1),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            )
                            .toList(),
                      ),

                      const Divider(),
                      const SizedBox(height: 8),

                      // Campos del formulario
                      _buildField(
                        controller: _nameController,
                        label: 'Nombre en la tarjeta',
                        icon: Icons.person_outline,
                        validator: (v) => (v == null || v.isEmpty)
                            ? 'Ingresa el nombre'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      _buildField(
                        controller: _emailController,
                        label: 'Correo electrónico',
                        icon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        validator: (v) => (v == null || !v.contains('@'))
                            ? 'Correo inválido'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      _buildField(
                        controller: _cardNumberController,
                        label: 'Número de tarjeta',
                        icon: Icons.credit_card,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          _CardNumberFormatter(),
                        ],
                        maxLength: 19,
                        validator: (v) {
                          final digits = v?.replaceAll(' ', '') ?? '';
                          return digits.length < 13 ? 'Número inválido' : null;
                        },
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _buildField(
                              controller: _expiryController,
                              label: 'MM/AA',
                              icon: Icons.calendar_today_outlined,
                              keyboardType: TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                _ExpiryFormatter(),
                              ],
                              maxLength: 5,
                              validator: (v) => (v == null || v.length < 5)
                                  ? 'Fecha inválida'
                                  : null,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildField(
                              controller: _cvvController,
                              label: 'CVV',
                              icon: Icons.lock_outline,
                              keyboardType: TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                              ],
                              maxLength: 4,
                              obscureText: true,
                              validator: (v) => (v == null || v.length < 3)
                                  ? 'CVV inválido'
                                  : null,
                            ),
                          ),
                        ],
                      ),

                      if (_errorMsg != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.error_outline,
                                color: Colors.red,
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMsg!,
                                  style: const TextStyle(
                                    color: Colors.red,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      const SizedBox(height: 24),

                      // Botón de pago
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isProcessing ? null : _processPay,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: const Color(0xFF6366F1),
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: Colors.grey.shade300,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 0,
                          ),
                          child: _isProcessing
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.lock, size: 18),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Pagar S/ ${widget.amount.toStringAsFixed(2)}',
                                      style: GoogleFonts.outfit(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),

                      const SizedBox(height: 12),
                      Center(
                        child: Text(
                          '🔒 Procesado de forma segura por Culqi (TEST)',
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        if (_paymentSuccess)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Lottie.network(
                    'https://lottie.host/8046b0a1-77e4-4c8d-88f5-44243a37f5b4/FpU38X3yqP.json',
                    height: 200,
                    repeat: false,
                    errorBuilder: (context, error, stackTrace) {
                      return const Icon(
                        Icons.check_circle,
                        size: 100,
                        color: Colors.green,
                      );
                    },
                    onLoaded: (composition) {
                      Future.delayed(const Duration(seconds: 3), () {
                        if (mounted) Navigator.of(context).pop(true);
                      });
                    },
                  ),
                  const SizedBox(height: 20),
                  Text(
                    '¡PAGO EXITOSO!',
                    style: GoogleFonts.outfit(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.green[700],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
    bool obscureText = false,
    int? maxLength,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      obscureText: obscureText,
      maxLength: maxLength,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
        counterText: '',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 14,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────
// Formateadores de tarjeta
// ─────────────────────────────────────────

class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(' ', '');
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(digits[i]);
    }
    final formatted = buffer.toString();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

class _ExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll('/', '');
    if (digits.length > 4) return oldValue;
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i == 2) buffer.write('/');
      buffer.write(digits[i]);
    }
    final formatted = buffer.toString();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
