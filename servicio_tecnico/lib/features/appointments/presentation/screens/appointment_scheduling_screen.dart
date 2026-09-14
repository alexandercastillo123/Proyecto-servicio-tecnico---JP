import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/appointment_service.dart';
import '../../../../core/services/technician_service.dart';
import '../../../../core/services/store_service.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import '../../../../core/services/message_service.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

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
  final StoreService _storeService = StoreService();

  Map<String, dynamic>? _techInfo;
  List<dynamic> _schedule = [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _isStore = false;
  String _serviceType = 'local';
  // Ubicacion del servicio
  double? _serviceLat;
  double? _serviceLng;
  String? _serviceAddress;
  bool _isSubmitting = false; // Guard against double submission

  final TextEditingController _timeController = TextEditingController();
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
        _isStore = extra['isStore'] ?? false;
        _serviceLat = (extra['serviceLat'] as num?)?.toDouble();
        _serviceLng = (extra['serviceLng'] as num?)?.toDouble();
        _serviceAddress = extra['serviceAddress'] as String?;
        
        // Technicians only do domicile services
        if (!_isStore) {
          _serviceType = 'domicilio';
        } else if (_serviceAddress != null && _serviceAddress!.isNotEmpty) {
          _serviceType = 'domicilio';
        }
        
        // Handle both 'id' (tech) and 'storeId' (branch)
        final targetId = extra['id'] ?? extra['storeId'];
        if (targetId != null) {
          _fetchSchedule(targetId);
        } else {
          setState(() {
            _isLoading = false;
            _errorMessage = 'ID de destino no encontrado';
          });
        }
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Información no proporcionada';
        });
      }
    }
  }

  Future<void> _fetchSchedule(int targetId) async {
    try {
      final response = _isStore 
          ? await _storeService.getStoreSchedules(targetId)
          : await _technicianService.getTechnicianSchedule(targetId);
          
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

  // Helper to ensure coordinates are captured if domicile is selected
  Future<void> _ensureLocation() async {
    if (_serviceLat != null && _serviceLng != null) return;
    
    try {
      Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);
      setState(() {
        _serviceLat = position.latitude;
        _serviceLng = position.longitude;
      });

      final uri = Uri.parse(
          'https://nominatim.openstreetmap.org/reverse?format=json&lat=$_serviceLat&lon=$_serviceLng&zoom=18&addressdetails=1');
      final response = await http.get(uri, headers: {
        'User-Agent': 'com.jp.serviciotecnico.servicio_tecnico_app',
      }).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['display_name'] != null) {
          setState(() {
            _serviceAddress = data['display_name'];
          });
        }
      }
    } catch (e) {
      debugPrint('GPS capture error: $e');
    }
  }

  Future<void> _createAppointment() async {
    if (_techInfo == null || _isSubmitting) return;

    final targetId = _techInfo!['id'] ?? _techInfo!['storeUserId'];
    if (targetId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ID de destino no encontrado')),
      );
      return;
    }

    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor selecciona una fecha')),
      );
      return;
    }

    if (_timeController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor selecciona una hora')),
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

    setState(() => _isSubmitting = true);

    if (_serviceType == 'domicilio') {
      if (_serviceLat == null || _serviceLng == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Validando ubicación de servicio...')),
        );
        await _ensureLocation();
      }
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
              app['technician_id'] == targetId &&
              (app['status'] == 'pending' || app['status'] == 'confirmed'),
        );

        if (hasActive) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Ya tienes una cita activa con este destino'),
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
        technicianId: targetId,
        scheduledDate: scheduledDate,
        scheduledTime: _timeController.text,
        description: description,
        serviceLat: _serviceLat,
        serviceLng: _serviceLng,
        serviceAddress: _serviceAddress,
        serviceType: _serviceType,
      );

      if (mounted) {
        if (response.success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cita agendada con éxito')),
          );

          // Redirect to Chat Screen
          context.pushReplacement('/chat', extra: targetId);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.message ?? 'Error al agendar cita'),
            ),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
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
                              _timeController.text.isEmpty ? 'Seleccionar hora' : _timeController.text,
                              style: TextStyle(
                                color: _timeController.text.isEmpty
                                    ? Colors.grey[600]
                                    : const Color(0xFF3B28FF),
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
                  if (_isStore) ...[
                    const SizedBox(height: 16),
                    _buildFormField(
                      label: 'Servicio:',
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8E8E8),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _serviceType,
                            isExpanded: true,
                            dropdownColor: Colors.white,
                            items: const [
                              DropdownMenuItem(
                                value: 'local',
                                child: Text('Atención en Local'),
                              ),
                              DropdownMenuItem(
                                value: 'domicilio',
                                child: Text('Técnico a Domicilio'),
                              ),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _serviceType = val;
                                });
                                if (val == 'domicilio') {
                                  _ensureLocation();
                                }
                              }
                            },
                            style: const TextStyle(
                              color: Color(0xFF3B28FF),
                              fontSize: 16,
                            ),
                            icon: const Icon(
                              Icons.keyboard_arrow_down,
                              color: Color(0xFF3B28FF),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                  if (_serviceType == 'domicilio') ...[
                    const SizedBox(height: 16),
                    _buildFormField(
                      label: 'Ubicación:',
                      child: GestureDetector(
                        onTap: () => _showMapDialog(LatLng(_serviceLat ?? -12.0464, _serviceLng ?? -77.0428)),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8E8E8),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  _serviceAddress ?? 'Seleccionar ubicación en mapa',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: _serviceAddress == null ? Colors.grey[600] : const Color(0xFF3B28FF),
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                              const Icon(Icons.map_outlined, color: Color(0xFF3B28FF), size: 20),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 32),
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
                      child: _isSubmitting 
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF3B28FF)),
                          )
                        : const Text(
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

  void _showMapDialog(LatLng initialCoordinates) {
    LatLng currentMarker = initialCoordinates;
    DateTime? lastTapTime;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFFD9D9D9),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: const Text(
                'Seleccionar Ubicación',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF3B28FF), fontWeight: FontWeight.bold, fontSize: 18),
              ),
              content: SizedBox(
                width: 320,
                height: 350,
                child: Column(
                  children: [
                    const Text(
                      'Doble click para marcar la ubicación del servicio.',
                      style: TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.w500),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 10),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(15),
                        child: FlutterMap(
                          options: MapOptions(
                            initialCenter: initialCoordinates,
                            initialZoom: 15.0,
                            onTap: (tapPosition, latLng) {
                              final now = DateTime.now();
                              if (lastTapTime != null && now.difference(lastTapTime!) < const Duration(milliseconds: 500)) {
                                setDialogState(() {
                                  currentMarker = latLng;
                                });
                                // Update main state immediately
                                setState(() {
                                  _serviceLat = latLng.latitude;
                                  _serviceLng = latLng.longitude;
                                  _serviceAddress = 'Cargando dirección...';
                                });
                                // Reverse geocode
                                _reverseGeocode(latLng);
                              } else {
                                lastTapTime = now;
                              }
                            },
                          ),
                          children: [
                            TileLayer(
                              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.jp.serviciotecnico.servicio_tecnico_app',
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: currentMarker,
                                  width: 50,
                                  height: 50,
                                  child: const Icon(Icons.location_on, color: Colors.red, size: 40),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Confirmar', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _reverseGeocode(LatLng latLng) async {
    try {
      final uri = Uri.parse(
          'https://nominatim.openstreetmap.org/reverse?format=json&lat=${latLng.latitude}&lon=${latLng.longitude}&zoom=18&addressdetails=1');
      final response = await http.get(uri, headers: {
        'User-Agent': 'com.jp.serviciotecnico.servicio_tecnico_app',
      }).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['display_name'] != null) {
          setState(() {
            _serviceAddress = data['display_name'];
            _serviceLat = latLng.latitude;
            _serviceLng = latLng.longitude;
          });
        }
      }
    } catch (e) {
      debugPrint('Reverse geocoding error: $e');
    }
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
