import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:servicio_tecnico_app/core/providers/auth_provider.dart';
import 'package:servicio_tecnico_app/core/services/local_cache_service.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/services/appointment_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/mini_location_map.dart';

class AppointmentDetailsScreen extends StatefulWidget {
  final int appointmentId;
  const AppointmentDetailsScreen({super.key, required this.appointmentId});

  @override
  State<AppointmentDetailsScreen> createState() =>
      _AppointmentDetailsScreenState();
}

class _AppointmentDetailsScreenState extends State<AppointmentDetailsScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  Map<String, dynamic>? _appointment;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadAppointment();
  }

  Future<void> _loadAppointment() async {
    try {
      final response = await _appointmentService.getAppointmentById(
        widget.appointmentId,
      );
      if (response.success) {
        setState(() {
          _appointment = response.data;
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
        _errorMessage = 'Error al cargar detalles de la cita';
        _isLoading = false;
      });
    }
  }

  String _getStatusTranslation(String? status) {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'on_the_way':
        return 'En camino 🚚';
      case 'arrived':
        return 'Llegó al destino 📍';
      case 'in_progress':
        return 'En progreso 🛠';
      case 'completed':
        return 'Terminado 🎉';
      case 'cancelled':
        return 'Cancelado';
      case 'cancellation_pending':
        return 'Cancelación Pendiente';
      case 'confirmed':
        return 'Confirmada ✅';
      case 'expired':
        return 'Expirado';
      default:
        return status ?? 'Desconocido';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'on_the_way':
        return Colors.blueAccent;
      case 'arrived':
        return Colors.indigo;
      case 'in_progress':
        return Colors.purple;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      case 'cancellation_pending':
        return Colors.deepOrange;
      case 'confirmed':
        return Colors.green;
      case 'expired':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Detalles de la Cita')),
        body: Center(child: Text(_errorMessage!)),
      );
    }

    final app = _appointment!;
    final bool isPaid = app['payment_status'] == 'paid';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leadingWidth: 120,
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
        title: const Text(
          'Datos de la Cita',
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: _getStatusColor(app['status']).withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.info_outline,
                    color: _getStatusColor(app['status']),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _getStatusTranslation(app['status']),
                    style: TextStyle(
                      color: _getStatusColor(app['status']),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _buildServiceJourney(app),
            const SizedBox(height: 24),

            // Service Info Card
            _buildInfoCard(
              title: 'Información del Servicio',
              icon: Icons.build_circle_outlined,
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDetailRow(
                    'Descripción',
                    app['description'] ?? 'Sin descripción',
                  ),
                  _buildDetailRow(
                    'Tipo',
                    app['service_type'] == 'domicilio'
                        ? 'Técnico a Domicilio 🏠'
                        : 'Atención en Local 🏬',
                  ),
                  _buildDetailRow(
                    'Fecha',
                    DateFormat(
                      'dd/MM/yyyy',
                    ).format(DateTime.parse(app['scheduled_date'])),
                  ),
                  _buildDetailRow(
                    'Hora',
                    app['scheduled_time'].substring(0, 5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Client/Location card
            _buildInfoCard(
              title: 'Lugar de Servicio',
              icon: Icons.location_on_outlined,
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDetailRow(
                    'Cliente',
                    '${app['client_names'] ?? ''} ${app['client_surnames'] ?? ''}'
                            .trim()
                            .isEmpty
                        ? (app['client_username'] ?? 'Sin nombre')
                        : '${app['client_names']} ${app['client_surnames']}',
                  ),
                  if (app['service_address'] != null)
                    _buildDetailRow('Dirección', app['service_address'])
                  else
                    _buildDetailRow(
                      'Dirección',
                      'No se marcó punto en el mapa',
                    ),
                  if (app['service_lat'] != null &&
                      app['service_lng'] != null) ...[
                    _buildDetailRow(
                      'Coordenadas',
                      '${double.tryParse(app['service_lat'].toString())?.toStringAsFixed(5)}, ${double.tryParse(app['service_lng'].toString())?.toStringAsFixed(5)}',
                    ),
                    const SizedBox(height: 16),
                    MiniLocationMap(
                      latitude: double.parse(app['service_lat'].toString()),
                      longitude: double.parse(app['service_lng'].toString()),
                      height: 180,
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          final lat = app['service_lat'].toString();
                          final lng = app['service_lng'].toString();
                          final url = Uri.parse(
                            'https://www.google.com/maps/search/?api=1&query=$lat,$lng',
                          );
                          if (await canLaunchUrl(url)) {
                            await launchUrl(
                              url,
                              mode: LaunchMode.externalApplication,
                            );
                          }
                        },
                        icon: const Icon(Icons.map_outlined),
                        label: const Text('Ver en Google Maps'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ] else
                    ElevatedButton.icon(
                      onPressed: null,
                      icon: const Icon(Icons.location_off_outlined),
                      label: const Text('Sin ubicación registrada'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF1F1F1),
                        foregroundColor: Colors.grey,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Payment Info Card
            _buildInfoCard(
              title: 'Gestión de Pago',
              icon: Icons.payments_outlined,
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDetailRow(
                    'Monto',
                    app['price'] != null
                        ? 'S/ ${app['price']}'
                        : 'Pendiente por definir',
                  ),
                  _buildDetailRow(
                    'Método',
                    app['payment_method']?.toString().toUpperCase() ??
                        'No seleccionado',
                  ),
                  _buildDetailRow(
                    'Estado Pago',
                    app['payment_status'] == 'paid'
                        ? 'Pagado ✅'
                        : (app['payment_status'] == 'waiting_confirmation'
                              ? 'Esperando Confirmación ⏳'
                              : 'Pendiente'),
                  ),
                  if (app['payment_confirmed_at'] != null)
                    _buildDetailRow(
                      'Confirmado el',
                      DateFormat('dd/MM HH:mm').format(
                        DateTime.parse(app['payment_confirmed_at']).toLocal(),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 40),

            // Footer Info
            if (isPaid)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green.withOpacity(0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.lock_outline, color: Colors.green),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Esta cita está pagada y asegurada. No se puede cancelar.',
                        style: TextStyle(
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 24),
            _buildActionButtons(app),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(Map<String, dynamic> app) {
    final status = app['status']?.toString().trim().toLowerCase();
    final serviceType = app['service_type']?.toString().trim().toLowerCase();
    final paymentStatus = app['payment_status']?.toString().toLowerCase();

    final authProvider = context.watch<AuthProvider>();
    final currentUser = authProvider.user;
    
    // Get ID and Role from multiple sources to be absolutely sure
    final String? currentUserId = currentUser?.id.toString() ?? 
                                 LocalCacheService.getUserId()?.toString();
    final String? userRole = currentUser?.role ?? 
                            LocalCacheService.getRole();

    // Role verification (simplified, trusting backend auth)
    final bool isTech = userRole == 'tech' || userRole == 'store';
    final bool isClient = userRole == 'client';

    List<Widget> buttons = [];

    // 0. Poner Precio (Solo Tech, si no tiene precio y está pendiente)
    if (status == 'pending' && isTech && app['price'] == null) {
      buttons.add(
        _buildActionButton(
          label: 'Establecer Precio',
          icon: Icons.sell_outlined,
          color: Colors.blueGrey,
          onPressed: _setPrice,
        ),
      );
    }

    // 0.1 Aceptar Cita (Tech/Store only, solo si ya tiene precio)
    if (status == 'pending' && isTech && app['price'] != null) {
      buttons.add(
        _buildActionButton(
          label: 'Aceptar Cita',
          icon: Icons.check_circle_outline,
          color: AppColors.primary,
          onPressed: () => _updateStatus('confirmed'),
        ),
      );
    }

    // 0.2 Pagar Cita (Solo Cliente, si tiene precio y no ha pagado)
    if (status == 'pending' && isClient && app['price'] != null && paymentStatus == 'pending') {
      buttons.add(
        _buildActionButton(
          label: 'Pagar Cita',
          icon: Icons.payment_outlined,
          color: Colors.green,
          onPressed: _payAppointment,
        ),
      );
    }

    // 0.3 Confirmar Pago (Solo Tech, si está en espera de confirmación)
    if (paymentStatus == 'waiting_confirmation' && isTech) {
      buttons.add(
        _buildActionButton(
          label: 'Confirmar Pago Recibido',
          icon: Icons.verified_user_outlined,
          color: Colors.green,
          onPressed: _confirmPayment,
        ),
      );
    }

    // 1. Mark "En Camino"
    // Habilitar si está confirmado O si ya está pagado (aunque siga en pending por delay)
    if (status == 'confirmed' ||
        (status == 'pending' && paymentStatus == 'paid')) {
      if ((serviceType == 'domicilio' && isTech) ||
          (serviceType == 'local' && isClient)) {
        buttons.add(
          _buildActionButton(
            label: isTech ? 'Marcar En Camino' : 'Voy hacia el Local',
            icon: Icons.directions_run,
            color: const Color(0xFF3B28FF),
            onPressed: () => _updateStatus('on_the_way'),
          ),
        );
      }
    }

    // 2. Mark "Llegué"
    if (status == 'on_the_way') {
      if (isTech) {
        buttons.add(
          _buildActionButton(
            label: serviceType == 'domicilio'
                ? 'He Llegado'
                : 'Cliente ha Llegado',
            icon: Icons.location_on,
            color: Colors.indigo,
            onPressed: () => _updateStatus('arrived'),
          ),
        );
      } else if (serviceType == 'local' && isClient) {
        buttons.add(
          _buildActionButton(
            label: 'He Llegado al Local',
            icon: Icons.store,
            color: Colors.indigo,
            onPressed: () => _updateStatus('arrived'),
          ),
        );
      }
    }

    // 3. Start Work (Tech only)
    if (status == 'arrived' && isTech) {
      buttons.add(
        _buildActionButton(
          label: 'Iniciar Trabajo',
          icon: Icons.play_arrow,
          color: Colors.orange,
          onPressed: () => _updateStatus('in_progress'),
        ),
      );
    }

    // 4. Terminar Trabajo (Tech only)
    if (status == 'in_progress' && isTech) {
      buttons.add(
        _buildActionButton(
          label: 'Trabajo Terminado',
          icon: Icons.check_circle,
          color: Colors.green,
          onPressed: () => _updateStatus('completed'),
        ),
      );
    }

    // 5. Client Confirmation
    if (status == 'completed' &&
        isClient &&
        app['client_confirmed_completion'] != true &&
        app['client_confirmed_completion'] != 1) {
      buttons.add(
        _buildActionButton(
          label: 'Confirmar Trabajo Terminado',
          icon: Icons.thumb_up_alt,
          color: Colors.green,
          onPressed: _confirmCompletion,
        ),
      );
    }

    // Add a refresh button for tech/store if things seem stuck
    if (isTech && buttons.length < 2) {
      buttons.add(
        TextButton.icon(
          onPressed: _loadAppointment,
          icon: const Icon(Icons.refresh, size: 16),
          label: const Text('Actualizar Estado'),
        ),
      );
    }

    if (app['client_confirmed_completion'] == true ||
        app['client_confirmed_completion'] == 1) {
      buttons.add(
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.verified, color: Colors.green),
              SizedBox(width: 8),
              Text(
                'Trabajo Finalizado y Confirmado',
                style: TextStyle(
                  color: Colors.green,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (buttons.isEmpty) return const SizedBox.shrink();

    return Column(
      children: buttons
          .map(
            (b) =>
                Padding(padding: const EdgeInsets.only(bottom: 12), child: b),
          )
          .toList(),
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon),
        label: Text(
          label,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 2,
        ),
      ),
    );
  }

  Future<void> _updateStatus(String status) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Cambio'),
        content: Text(
          '¿Deseas cambiar el estado a "${_getStatusTranslation(status)}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);
    try {
      final res = await _appointmentService.updateAppointmentStatus(
        id: widget.appointmentId,
        status: status,
      );
      if (res.success) {
        _loadAppointment();
      } else {
        setState(() => _isLoading = false);
        if (mounted)
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(res.message ?? 'Error')));
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _setPrice() async {
    final TextEditingController _priceController = TextEditingController();
    final price = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Establecer Precio'),
        content: TextField(
          controller: _priceController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Monto en Soles (S/)',
            prefixText: 'S/ ',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          TextButton(
            onPressed: () => Navigator.pop(context, _priceController.text),
            child: const Text('Guardar'),
          ),
        ],
      ),
    );

    if (price == null || price.isEmpty) return;

    setState(() => _isLoading = true);
    try {
      final res = await _appointmentService.setPrice(
        widget.appointmentId,
        double.parse(price),
      );
      if (res.success) {
        _loadAppointment();
      } else {
        setState(() => _isLoading = false);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.message ?? 'Error')));
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _payAppointment() async {
    final method = await showDialog<String>(
      context: context,
      builder: (context) => SimpleDialog(
        title: const Text('Seleccionar Método de Pago'),
        children: [
          SimpleDialogOption(onPressed: () => Navigator.pop(context, 'yape'), child: const Text('Yape')),
          SimpleDialogOption(onPressed: () => Navigator.pop(context, 'plin'), child: const Text('Plin')),
          SimpleDialogOption(onPressed: () => Navigator.pop(context, 'transfer'), child: const Text('Transferencia')),
        ],
      ),
    );

    if (method == null) return;

    setState(() => _isLoading = true);
    try {
      final res = await _appointmentService.payAppointment(widget.appointmentId, method);
      if (res.success) {
        _loadAppointment();
      } else {
        setState(() => _isLoading = false);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.message ?? 'Error')));
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _confirmPayment() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Pago'),
        content: const Text('¿Confirmas que has recibido el pago del cliente?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Sí, Confirmar')),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);
    try {
      final res = await _appointmentService.confirmPayment(widget.appointmentId);
      if (res.success) {
        _loadAppointment();
      } else {
        setState(() => _isLoading = false);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.message ?? 'Error')));
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _confirmCompletion() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Finalización'),
        content: const Text(
          '¿Confirmas que el técnico ha terminado el trabajo satisfactoriamente?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);
    try {
      final res = await _appointmentService.confirmCompletion(
        widget.appointmentId,
      );
      if (res.success) {
        _loadAppointment();
      } else {
        setState(() => _isLoading = false);
        if (mounted)
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(res.message ?? 'Error')));
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Widget _buildServiceJourney(Map<String, dynamic> app) {
    final status = app['status']?.toString().toLowerCase() ?? '';
    
    // Solo mostrar si no está cancelado o expirado
    if (['cancelled', 'expired', 'pending'].contains(status)) return const SizedBox.shrink();

    final steps = [
      {'id': 'confirmed', 'label': 'Confirmado', 'icon': Icons.verified},
      {'id': 'on_the_way', 'label': 'En Camino', 'icon': Icons.directions_car},
      {'id': 'arrived', 'label': 'Llegó', 'icon': Icons.location_on},
      {'id': 'in_progress', 'label': 'En Servicio', 'icon': Icons.build},
      {'id': 'completed', 'label': 'Finalizado', 'icon': Icons.check_circle},
    ];

    int currentIndex = steps.indexWhere((s) => s['id'] == status);
    
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(left: 8, bottom: 16),
            child: Text(
              'Recorrido del Servicio',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: Color(0xFF2D3142),
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(steps.length, (index) {
              final step = steps[index];
              final bool isPast = index < currentIndex;
              final bool isCurrent = index == currentIndex;
              final bool isFuture = index > currentIndex;
              
              Color color;
              if (isPast) color = const Color(0xFF4CAF50);
              else if (isCurrent) color = AppColors.primary;
              else color = Colors.grey.shade300;

              return Expanded(
                child: Column(
                  children: [
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        // Line connection
                        if (index < steps.length - 1)
                          Positioned(
                            left: 20,
                            right: -20,
                            child: Container(
                              height: 2,
                              color: index < currentIndex 
                                  ? const Color(0xFF4CAF50) 
                                  : Colors.grey.shade200,
                            ),
                          ),
                        // Circle Icon
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: isCurrent ? color : Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: color,
                              width: 2,
                            ),
                            boxShadow: isCurrent ? [
                              BoxShadow(
                                color: color.withOpacity(0.3),
                                blurRadius: 8,
                                spreadRadius: 2,
                              )
                            ] : null,
                          ),
                          child: Icon(
                            step['icon'] as IconData,
                            size: 18,
                            color: isCurrent ? Colors.white : color,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      step['label'] as String,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                        color: isCurrent ? AppColors.primary : Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required IconData icon,
    required Widget content,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFEEEEEE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppColors.primary, size: 24),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const Divider(height: 32),
          content,
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(
                color: Colors.grey,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Color(0xFF333333),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
