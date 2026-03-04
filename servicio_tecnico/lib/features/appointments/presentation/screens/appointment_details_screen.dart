import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
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
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status ?? 'Desconocido';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
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
                    const SizedBox(width: 12),
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
          ],
        ),
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
