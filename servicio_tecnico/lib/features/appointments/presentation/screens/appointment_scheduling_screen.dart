import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
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

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF060D1F) : const Color(0xFFF5F8FF),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0D1B3E) : Colors.white,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: Container(
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.08) : AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.primary, size: 18),
              onPressed: () => context.pop(),
            ),
          ),
        ),
        title: Text('Agendar Cita',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800, color: AppColors.getTextPrimary(context))),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tech header card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: AppColors.premiumShadow,
              ),
              child: Row(children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(16)),
                  child: const Icon(Icons.engineering_rounded, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(_techInfo?['name'] ?? 'Técnico',
                    style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                  Text('Coordina tu cita a continuación',
                    style: GoogleFonts.outfit(color: Colors.white60, fontSize: 12)),
                ])),
              ]),
            ),

            const SizedBox(height: 20),

            // Schedule card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF112044) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isDark ? Colors.white.withOpacity(0.07) : AppColors.border),
                boxShadow: isDark ? [] : AppColors.softShadow,
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Container(padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.schedule_rounded, color: AppColors.primary, size: 18)),
                  const SizedBox(width: 10),
                  Text('Horario de Atención',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 15,
                      color: AppColors.getTextPrimary(context))),
                ]),
                const SizedBox(height: 14),
                if (_schedule.isEmpty)
                  Text('Sin horario registrado', style: GoogleFonts.outfit(color: AppColors.textSecondary, fontSize: 13))
                else
                  ..._schedule.map((s) => _buildScheduleRow('${s['day_of_week']}:', '${s['start_time']} - ${s['end_time']}')),
              ]),
            ),

            const SizedBox(height: 20),

            // Form card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF112044) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isDark ? Colors.white.withOpacity(0.07) : AppColors.border),
                boxShadow: isDark ? [] : AppColors.softShadow,
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Container(padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.calendar_today_rounded, color: AppColors.primary, size: 18)),
                  const SizedBox(width: 10),
                  Text('Coordinar Cita',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 15,
                      color: AppColors.getTextPrimary(context))),
                ]),
                const SizedBox(height: 18),

                // Date picker
                Text('Fecha', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700,
                  color: AppColors.getTextSecondary(context))),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () => _selectDate(context),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0D1B3E) : AppColors.background,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: isDark ? Colors.white.withOpacity(0.1) : AppColors.border, width: 1.5),
                    ),
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text(_dateLabel,
                        style: GoogleFonts.outfit(
                          color: _selectedDate == null ? AppColors.textLight : AppColors.getTextPrimary(context),
                          fontSize: 15, fontWeight: FontWeight.w500)),
                      const Icon(Icons.calendar_today_rounded, color: AppColors.primary, size: 18),
                    ]),
                  ),
                ),

                const SizedBox(height: 14),

                // Time picker
                Text('Hora', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700,
                  color: AppColors.getTextSecondary(context))),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () => _selectTime(context),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0D1B3E) : AppColors.background,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: isDark ? Colors.white.withOpacity(0.1) : AppColors.border, width: 1.5),
                    ),
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text(_timeController.text.isEmpty ? 'Seleccionar hora' : _timeController.text,
                        style: GoogleFonts.outfit(
                          color: _timeController.text.isEmpty ? AppColors.textLight : AppColors.getTextPrimary(context),
                          fontSize: 15, fontWeight: FontWeight.w500)),
                      const Icon(Icons.access_time_rounded, color: AppColors.primary, size: 18),
                    ]),
                  ),
                ),

                if (_isStore) ...[
                  const SizedBox(height: 14),
                  Text('Tipo de Servicio', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700,
                    color: AppColors.getTextSecondary(context))),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0D1B3E) : AppColors.background,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: isDark ? Colors.white.withOpacity(0.1) : AppColors.border, width: 1.5),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _serviceType,
                        isExpanded: true,
                        dropdownColor: isDark ? const Color(0xFF112044) : Colors.white,
                        style: GoogleFonts.outfit(color: AppColors.getTextPrimary(context), fontSize: 15),
                        icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.primary),
                        items: [
                          DropdownMenuItem(value: 'local',
                            child: Text('Atención en Local', style: GoogleFonts.outfit())),
                          DropdownMenuItem(value: 'domicilio',
                            child: Text('Técnico a Domicilio', style: GoogleFonts.outfit())),
                        ],
                        onChanged: (val) {
                          if (val != null) { setState(() => _serviceType = val); if (val == 'domicilio') _ensureLocation(); }
                        },
                      ),
                    ),
                  ),
                ],

                if (_serviceType == 'domicilio') ...[
                  const SizedBox(height: 14),
                  Text('Ubicación del Servicio', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700,
                    color: AppColors.getTextSecondary(context))),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () => _showMapDialog(LatLng(_serviceLat ?? -12.0464, _serviceLng ?? -77.0428)),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0D1B3E) : AppColors.background,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: isDark ? Colors.white.withOpacity(0.1) : AppColors.border, width: 1.5),
                      ),
                      child: Row(children: [
                        const Icon(Icons.location_on_outlined, color: AppColors.primary, size: 18),
                        const SizedBox(width: 10),
                        Expanded(child: Text(
                          _serviceAddress ?? 'Seleccionar en mapa',
                          maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                            color: _serviceAddress == null ? AppColors.textLight : AppColors.getTextPrimary(context),
                            fontSize: 14, fontWeight: FontWeight.w500))),
                        const Icon(Icons.map_outlined, color: AppColors.primary, size: 18),
                      ]),
                    ),
                  ),
                ],

                const SizedBox(height: 14),
                Text('Descripción del Problema', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700,
                  color: AppColors.getTextSecondary(context))),
                const SizedBox(height: 8),
                TextField(
                  controller: _descriptionController,
                  maxLines: 4,
                  style: GoogleFonts.outfit(color: AppColors.getTextPrimary(context), fontSize: 14),
                  decoration: InputDecoration(
                    hintText: '¿Qué problema tiene tu equipo?',
                    hintStyle: GoogleFonts.outfit(color: AppColors.textLight, fontSize: 14),
                    filled: true,
                    fillColor: isDark ? const Color(0xFF0D1B3E) : AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: isDark ? Colors.white.withOpacity(0.1) : AppColors.border, width: 1.5),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: isDark ? Colors.white.withOpacity(0.1) : AppColors.border, width: 1.5),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: AppColors.primary, width: 2),
                    ),
                    contentPadding: const EdgeInsets.all(16),
                  ),
                ),
              ]),
            ),

            const SizedBox(height: 24),

            // Submit button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: Container(
                decoration: BoxDecoration(
                  gradient: AppColors.heroGradient,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: AppColors.premiumShadow,
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: _isSubmitting ? null : _createAppointment,
                    borderRadius: BorderRadius.circular(14),
                    child: Center(
                      child: _isSubmitting
                          ? const SizedBox(width: 22, height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                          : Row(mainAxisSize: MainAxisSize.min, children: [
                              const Icon(Icons.calendar_today_rounded, color: Colors.white, size: 20),
                              const SizedBox(width: 10),
                              Text('Agendar Cita',
                                style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                            ]),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleRow(String day, String time) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Expanded(flex: 1, child: Text(day,
          style: GoogleFonts.outfit(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w600))),
        Expanded(flex: 2, child: Text(time,
          textAlign: TextAlign.center,
          style: GoogleFonts.outfit(color: AppColors.textSecondary, fontSize: 13))),
      ]),
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
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              title: Text('Seleccionar Ubicación',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 18)),
              content: SizedBox(
                width: 320,
                height: 350,
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.warning.withOpacity(0.3)),
                      ),
                      child: Row(children: [
                        Icon(Icons.info_outline_rounded, color: AppColors.warning, size: 16),
                        const SizedBox(width: 8),
                        Expanded(child: Text('Doble toque para marcar la ubicación.',
                          style: GoogleFonts.outfit(fontSize: 12, color: AppColors.warning, fontWeight: FontWeight.w600))),
                      ]),
                    ),
                    const SizedBox(height: 10),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: FlutterMap(
                          options: MapOptions(
                            initialCenter: initialCoordinates,
                            initialZoom: 15.0,
                            onTap: (tapPosition, latLng) {
                              final now = DateTime.now();
                              if (lastTapTime != null && now.difference(lastTapTime!) < const Duration(milliseconds: 500)) {
                                setDialogState(() => currentMarker = latLng);
                                setState(() { _serviceLat = latLng.latitude; _serviceLng = latLng.longitude; _serviceAddress = 'Cargando dirección...'; });
                                _reverseGeocode(latLng);
                              } else { lastTapTime = now; }
                            },
                          ),
                          children: [
                            TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.jp.serviciotecnico.servicio_tecnico_app'),
                            MarkerLayer(markers: [
                              Marker(point: currentMarker, width: 50, height: 50,
                                child: const Icon(Icons.location_on, color: Colors.red, size: 40)),
                            ]),
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
                  child: Text('Confirmar', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppColors.primary)),
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
