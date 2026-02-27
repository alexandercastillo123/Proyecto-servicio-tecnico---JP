import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/appointment_service.dart';
import '../../../../core/services/technician_service.dart';
import '../../../../core/services/message_service.dart';

class AppointmentSchedulingScreen extends StatefulWidget {
  const AppointmentSchedulingScreen({super.key});

  @override
  State<AppointmentSchedulingScreen> createState() =>
      _AppointmentSchedulingScreenState();
}

class _AppointmentSchedulingScreenState
    extends State<AppointmentSchedulingScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  final TechnicianService _technicianService = TechnicianService();

  Map<String, dynamic>? _techInfo;
  List<dynamic> _schedule = [];
  bool _isLoading = true;
  String? _errorMessage;
  // Ubicacion del servicio
  double? _serviceLat;
  double? _serviceLng;
  String? _serviceAddress;

  final TextEditingController _timeController = TextEditingController(
    text: '10:00',
  );
  final TextEditingController _descriptionController = TextEditingController();
  DateTime? _selectedDate;
  String _dateLabel = 'Seleccionar fecha';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isLoading && _techInfo == null) {
      final extra = GoRouterState.of(context).extra;
      if (extra != null && extra is Map<String, dynamic>) {
        _techInfo = extra;
        _serviceLat = (extra['serviceLat'] as num?)?.toDouble();
        _serviceLng = (extra['serviceLng'] as num?)?.toDouble();
        _serviceAddress = extra['serviceAddress'] as String?;
        _fetchSchedule(extra['id']);
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Información del técnico no proporcionada';
        });
      }
    }
  }

  Future<void> _fetchSchedule(int techId) async {
    try {
      final response = await _technicianService.getTechnicianSchedule(techId);
      if (response.success) {
        setState(() {
          _schedule = response.data ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  final MessageService _messageService = MessageService();

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF3B28FF),
              onPrimary: Colors.white,
              onSurface: Color(0xFF3B28FF),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        _dateLabel =
            "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _selectTime(BuildContext context) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF3B28FF),
              onPrimary: Colors.white,
              onSurface: Color(0xFF3B28FF),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        final String hour = picked.hour.toString().padLeft(2, '0');
        final String minute = picked.minute.toString().padLeft(2, '0');
        _timeController.text = '$hour:$minute';
      });
    }
  }

  Future<void> _createAppointment() async {
    if (_techInfo == null) return;

    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor selecciona una fecha')),
      );
      return;
    }

    final description = _descriptionController.text.trim();
    if (description.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor ingrese una descripción')),
      );
      return;
    }

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Agendando cita...')));

    try {
      // Check for active appointments first
      final appsResponse = await _appointmentService.getAppointments(
        status: 'pending',
      );
      if (appsResponse.success) {
        final existingApps = appsResponse.data as List<dynamic>;
        final hasActive = existingApps.any(
          (app) =>
              app['technician_id'] == _techInfo!['id'] &&
              (app['status'] == 'pending' || app['status'] == 'confirmed'),
        );

        if (hasActive) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Ya tienes una cita activa con este técnico'),
                backgroundColor: Colors.orange,
              ),
            );
          }
          return;
        }
      }

      final scheduledDate =
          "${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}";
      final response = await _appointmentService.createAppointment(
        technicianId: _techInfo!['id'],
        scheduledDate: scheduledDate,
        scheduledTime: _timeController.text,
        description: description,
        serviceLat: _serviceLat,
        serviceLng: _serviceLng,
        serviceAddress: _serviceAddress,
      );

      if (mounted) {
        if (response.success) {
          // Send automatic message to chat
          await _messageService.sendMessage(
            receiverId: _techInfo!['id'],
            messageText:
                'Cita agendada para $scheduledDate a las ${_timeController.text}\nMotivo: $description',
            messageType: 'appointment',
            appointmentId: response.data?['appointmentId'],
          );

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cita agendada con éxito')),
          );

          // Redirect to Chat Screen
          context.pushReplacement('/chat', extra: _techInfo!['id']);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.message ?? 'Error al agendar cita'),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Error de conexión')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Text(_errorMessage!)),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 115,
        leading: TextButton.icon(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_left, color: Color(0xFF3B28FF)),
          label: const Text(
            'Regresar',
            style: TextStyle(
              color: Color(0xFF3B28FF),
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 10),
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF3B28FF), width: 4),
                ),
                child: const Icon(
                  Icons.person_outline,
                  size: 80,
                  color: Color(0xFF3B28FF),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              _techInfo?['name'] ?? 'Técnico',
              style: const TextStyle(
                color: Color(0xFF3B28FF),
                fontSize: 24,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 16),

            // Horario de Atencion
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const Text(
                    'Horario de Atencion',
                    style: TextStyle(
                      color: Color(0xFF3B28FF),
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: const [
                      Text(
                        'Dia',
                        style: TextStyle(
                          color: Color(0xFF3B28FF),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        'Horario',
                        style: TextStyle(
                          color: Color(0xFF3B28FF),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                  const Divider(color: Color(0xFFBDBDBD)),
                  if (_schedule.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Text(
                        'Cargando horario...',
                        style: TextStyle(color: Colors.grey),
                      ),
                    )
                  else
                    ..._schedule.map(
                      (s) => _buildScheduleRow(
                        '${s['day_of_week']}:',
                        '${s['start_time']} - ${s['end_time']}',
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Text(
              'Coordinar Cita',
              style: TextStyle(
                color: Color(0xFF3B28FF),
                fontSize: 22,
                fontWeight: FontWeight.w500,
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: Divider(color: Color(0xFFBDBDBD)),
            ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: Column(
                children: [
                  _buildFormField(
                    label: 'Dia:',
                    child: GestureDetector(
                      onTap: () => _selectDate(context),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8E8E8),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _dateLabel,
                              style: TextStyle(
                                color: _selectedDate == null
                                    ? Colors.grey[600]
                                    : const Color(0xFF3B28FF),
                                fontSize: 16,
                              ),
                            ),
                            const Icon(
                              Icons.calendar_today,
                              color: Color(0xFF3B28FF),
                              size: 20,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildFormField(
                    label: 'Hora:',
                    child: GestureDetector(
                      onTap: () => _selectTime(context),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8E8E8),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _timeController.text,
                              style: const TextStyle(
                                color: Color(0xFF3B28FF),
                                fontSize: 16,
                              ),
                            ),
                            const Icon(
                              Icons.access_time,
                              color: Color(0xFF3B28FF),
                              size: 20,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildFormField(
                    label: 'Descripcion:',
                    alignTop: true,
                    child: _buildTextField(
                      '¿Qué problema tiene?',
                      maxLines: 4,
                      controller: _descriptionController,
                    ),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: 200,
                    child: ElevatedButton(
                      onPressed: _createAppointment,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE8E8E8),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text(
                        'Agendar Cita',
                        style: TextStyle(
                          color: Color(0xFF3B28FF),
                          fontWeight: FontWeight.w500,
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleRow(String day, String time) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(
            flex: 1,
            child: Text(
              day,
              style: const TextStyle(color: Color(0xFF7A8DFF), fontSize: 13),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              time,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF7A8DFF), fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormField({
    required String label,
    required Widget child,
    bool alignTop = false,
  }) {
    return Row(
      crossAxisAlignment: alignTop
          ? CrossAxisAlignment.start
          : CrossAxisAlignment.center,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: const TextStyle(color: Color(0xFF3B28FF), fontSize: 16),
          ),
        ),
        Expanded(child: child),
      ],
    );
  }

  Widget _buildTextField(
    String hint, {
    int maxLines = 1,
    TextEditingController? controller,
  }) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      style: const TextStyle(color: Color(0xFF3B28FF), fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: const Color(0xFFE8E8E8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }
}
