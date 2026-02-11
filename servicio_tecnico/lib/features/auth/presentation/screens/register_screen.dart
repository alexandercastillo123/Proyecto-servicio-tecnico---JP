import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:servicio_tecnico_app/core/services/auth_service.dart';
import 'package:servicio_tecnico_app/core/services/camera_service.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/custom_button.dart';
import '../../../../core/constants/assets.dart';

class RegisterScreen extends StatefulWidget {
  final String? role;
  final String? personType; // 'natural' or 'juridical'

  const RegisterScreen({super.key, this.role, this.personType});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  int _currentStep = 0;
  bool _isPhotoTaken = false;

  // Schedules for Juridical Technicians
  final List<Map<String, dynamic>> _schedules = [
    {
      'day': 'Lunes',
      'dayEn': 'Monday',
      'startH': '08',
      'startM': '00',
      'startP': 'AM',
      'endH': '06',
      'endM': '00',
      'endP': 'PM',
      'isExpanded': false,
    },
    {
      'day': 'Martes',
      'dayEn': 'Tuesday',
      'startH': '08',
      'startM': '00',
      'startP': 'AM',
      'endH': '06',
      'endM': '00',
      'endP': 'PM',
      'isExpanded': false,
    },
    {
      'day': 'Miércoles',
      'dayEn': 'Wednesday',
      'startH': '08',
      'startM': '00',
      'startP': 'AM',
      'endH': '06',
      'endM': '00',
      'endP': 'PM',
      'isExpanded': false,
    },
    {
      'day': 'Jueves',
      'dayEn': 'Thursday',
      'startH': '08',
      'startM': '00',
      'startP': 'AM',
      'endH': '06',
      'endM': '00',
      'endP': 'PM',
      'isExpanded': false,
    },
    {
      'day': 'Viernes',
      'dayEn': 'Friday',
      'startH': '08',
      'startM': '00',
      'startP': 'AM',
      'endH': '06',
      'endM': '00',
      'endP': 'PM',
      'isExpanded': false,
    },
    {
      'day': 'Sábado',
      'dayEn': 'Saturday',
      'startH': '08',
      'startM': '00',
      'startP': 'AM',
      'endH': '06',
      'endM': '00',
      'endP': 'PM',
      'isExpanded': false,
    },
    {
      'day': 'Domingo',
      'dayEn': 'Sunday',
      'startH': '08',
      'startM': '00',
      'startP': 'AM',
      'endH': '06',
      'endM': '00',
      'endP': 'PM',
      'isExpanded': false,
    },
  ];

  // Camera
  CameraController? _cameraController;
  final CameraService _cameraService = CameraService();
  bool _isCameraInitialized = false;
  XFile? _capturedFile;

  @override
  void dispose() {
    _cameraController?.dispose();
    _namesController.dispose();
    _surnamesController.dispose();
    _dniController.dispose();
    _rucController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _referenceAddressController.dispose();
    _userController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _initializeCamera() async {
    final status = await Permission.camera.request();
    if (status.isGranted) {
      final controller = await _cameraService.getController();
      if (mounted) {
        setState(() {
          _cameraController = controller;
          _isCameraInitialized = controller?.value.isInitialized ?? false;
        });
      }
    } else {
      if (mounted) _showError('Se requiere permiso de cámara para continuar');
    }
  }

  Future<void> _takePicture() async {
    final file = await _cameraService.takePicture();
    if (file != null && mounted) {
      setState(() {
        _capturedFile = file;
        _isPhotoTaken = true;
      });
    }
  }

  // Controllers Step 1
  final _namesController = TextEditingController();
  final _surnamesController = TextEditingController();
  final _dniController = TextEditingController();
  final _rucController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _referenceAddressController = TextEditingController();

  // Controllers Step 2
  final _userController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  void _nextStep() {
    bool isJuridical = widget.personType == 'juridical';
    bool isClient = widget.role == 'client';

    // For clients, max step is 1 (Step 0: Info, Step 1: Account)
    int maxStep = isClient ? 1 : (isJuridical ? 3 : 2);

    if (_currentStep < maxStep) {
      if (_validateCurrentStep()) {
        setState(() {
          _currentStep++;
        });
      }
    } else {
      // Logic moved to "Registrarme" button in _buildAccountInfoStep for clients
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
    } else {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isJuridical = widget.personType == 'juridical';
    bool isProvider = widget.role == 'tech';

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(height: 10),
              // Back Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: _previousStep,
                    icon: const Icon(
                      Icons.arrow_left,
                      color: Color(0xFF3B28FF),
                    ),
                    label: const Text(
                      'Regresar',
                      style: TextStyle(
                        color: Color(0xFF3B28FF),
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero),
                  ),
                ),
              ),

              // Logo
              const SizedBox(height: 10),
              Center(
                child: Image.asset(
                  AppAssets.logo,
                  height: 120, // Adjust height as needed
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 10),

              const SizedBox(height: 30),

              // Content based on step
              if (_currentStep == 0)
                _buildPersonalInfoStep(isJuridical, isProvider),
              if (_currentStep == 1) _buildAccountInfoStep(),
              if (isJuridical && _currentStep == 2) _buildOperatingHoursStep(),
              if ((!isJuridical && _currentStep == 2) ||
                  (isJuridical && _currentStep == 3))
                _buildPhotoUploadStep(),

              const SizedBox(height: 30),

              // Only show "Continuar" if it's not the final step's final state
              if (_shouldShowContinuar(isJuridical))
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: CustomButton(
                    text: 'Continuar',
                    onPressed: () {
                      if (_currentStep == 0 && isProvider) {
                        _showAddressConfirmationDialog();
                      } else {
                        _nextStep();
                      }
                    },
                  ),
                ),

              const SizedBox(height: 20),
              if (_currentStep == 0) _buildLoginLink(),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  bool _shouldShowContinuar(bool isJuridical) {
    bool isClient = widget.role == 'client';
    if (isClient) {
      if (_currentStep == 1) return false; // Show Registrarme inside the step
      return true;
    }

    if (isJuridical) {
      if (_currentStep == 3) return false; // Photo step
      return true;
    } else {
      if (_currentStep == 2) return false; // Photo step
      return true;
    }
  }

  bool _validateCurrentStep() {
    if (_currentStep == 0) {
      if (widget.personType == 'natural') {
        if (_namesController.text.isEmpty ||
            _surnamesController.text.isEmpty ||
            _dniController.text.isEmpty ||
            _emailController.text.isEmpty) {
          _showError('Por favor rellene todos los campos');
          return false;
        }
      } else {
        if (_namesController.text.isEmpty ||
            _rucController.text.isEmpty ||
            _emailController.text.isEmpty) {
          _showError('Por favor rellene todos los campos');
          return false;
        }
      }

      if (widget.role == 'tech' && _phoneController.text.isEmpty) {
        _showError('Por favor rellene su teléfono');
        return false;
      }
    } else if (_currentStep == 1) {
      if (_userController.text.isEmpty ||
          _passwordController.text.isEmpty ||
          _confirmPasswordController.text.isEmpty) {
        _showError('Por favor rellene todos los campos');
        return false;
      }
      if (_passwordController.text != _confirmPasswordController.text) {
        _showError('Las contraseñas no coinciden');
        return false;
      }
    }
    return true;
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  Widget _buildPersonalInfoStep(bool isJuridical, bool isProvider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Column(
        children: [
          if (!isJuridical) ...[
            CustomTextField(
              label: 'Nombres',
              hint: 'Nombres',
              controller: _namesController,
            ),
            const SizedBox(height: 16),
            CustomTextField(
              label: 'Apellidos',
              hint: 'Apellidos',
              controller: _surnamesController,
            ),
            const SizedBox(height: 16),
            CustomTextField(
              label: 'DNI',
              hint: 'DNI / RUC',
              controller: _dniController,
              keyboardType: TextInputType.number,
            ),
          ] else ...[
            CustomTextField(
              label: 'Razón Social',
              hint: 'Razón Social',
              controller: _namesController,
            ),
            const SizedBox(height: 16),
            CustomTextField(
              label: 'RUC',
              hint: 'DNI / RUC',
              controller: _rucController,
              keyboardType: TextInputType.number,
            ),
          ],
          if (isProvider) ...[
            const SizedBox(height: 16),
            CustomTextField(
              label: 'Teléfono',
              hint: 'Teléfono',
              controller: _phoneController,
              keyboardType: TextInputType.phone,
            ),
          ],
          const SizedBox(height: 16),
          CustomTextField(
            label: 'Correo Electrónico',
            hint: 'Correo Electrónico',
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
          ),
          if (isProvider) ...[
            const SizedBox(height: 16),
            CustomTextField(
              label: 'Dirección de Referencia',
              hint: 'Dirección de Referencia',
              controller: _referenceAddressController,
              suffixIcon: IconButton(
                icon: const Icon(Icons.info_outline, color: Color(0xFF3B28FF)),
                onPressed: _showReferenceInfoDialog,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAccountInfoStep() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Column(
        children: [
          CustomTextField(
            label: 'Usuario',
            hint: 'Usuario',
            controller: _userController,
          ),
          const SizedBox(height: 16),
          CustomTextField(
            label: 'Contraseña',
            hint: 'Contraseña',
            controller: _passwordController,
            isPassword: true,
          ),
          const SizedBox(height: 16),
          CustomTextField(
            label: 'Repita la Contraseña',
            hint: 'Repita la Contraseña',
            controller: _confirmPasswordController,
            isPassword: true,
          ),
          if (widget.role == 'client') ...[
            const SizedBox(height: 30),
            CustomButton(text: 'Registrarme', onPressed: _submitRegistration),
          ],
        ],
      ),
    );
  }

  Future<void> _submitRegistration() async {
    if (!_validateCurrentStep()) return;

    // Mostrar loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final authService = AuthService();
      final isJuridical = widget.personType == 'juridical';

      final response = await authService.register(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        role: widget.role ?? 'client',
        personType: widget.personType ?? 'natural',
        names: !isJuridical ? _namesController.text : null,
        surnames: !isJuridical ? _surnamesController.text : null,
        dni: !isJuridical ? _dniController.text : null,
        companyName: isJuridical ? _namesController.text : null,
        ruc: isJuridical ? _rucController.text : null,
        phone: widget.role == 'tech' ? _phoneController.text : null,
        referenceAddress: widget.role == 'tech'
            ? _referenceAddressController.text
            : null,
        schedules: (widget.role == 'tech' && isJuridical)
            ? _schedules
                  .map(
                    (s) => {
                      'dayOfWeek': s['dayEn'],
                      'startTime': _to24h(
                        s['startH'],
                        s['startM'],
                        s['startP'],
                      ),
                      'endTime': _to24h(s['endH'], s['endM'], s['endP']),
                      'isActive': true,
                    },
                  )
                  .toList()
            : null,
      );

      // Cerrar loading
      if (context.mounted) Navigator.pop(context);

      if (response.success) {
        if (context.mounted) {
          final target = widget.role == 'tech' ? '/home' : '/client-home';
          context.go(target);
        }
      } else {
        if (context.mounted)
          _showError(response.message ?? 'Error al registrarse');
      }
    } catch (e) {
      if (context.mounted) Navigator.pop(context);
      if (context.mounted) _showError('Error: ${e.toString()}');
    }
  }

  Widget _buildOperatingHoursStep() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFE0E0E0),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                const Text(
                  'Horario de atención',
                  style: TextStyle(
                    color: Color(0xFF3B28FF),
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 15),
                ..._schedules
                    .map((schedule) => _buildDayItem(schedule))
                    .toList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDayItem(Map<String, dynamic> schedule) {
    bool isExpanded = schedule['isExpanded'];
    return Column(
      children: [
        GestureDetector(
          onTap: () {
            setState(() {
              schedule['isExpanded'] = !isExpanded;
            });
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            margin: const EdgeInsets.only(bottom: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      schedule['day'],
                      style: const TextStyle(
                        color: Color(0xFF3B28FF),
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Icon(
                      isExpanded
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      color: const Color(0xFF3B28FF),
                    ),
                  ],
                ),
                if (isExpanded) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Text(
                        'Desde: ',
                        style: TextStyle(
                          color: Color(0xFF9E92FF),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      _buildTimeSelector(schedule, true),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Text(
                        'Hasta:  ',
                        style: TextStyle(
                          color: Color(0xFF9E92FF),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      _buildTimeSelector(schedule, false),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTimeSelector(Map<String, dynamic> schedule, bool isStart) {
    String h = isStart ? schedule['startH'] : schedule['endH'];
    String m = isStart ? schedule['startM'] : schedule['endM'];
    String p = isStart ? schedule['startP'] : schedule['endP'];

    return Row(
      children: [
        _buildResponsiveDropdown(
          value: h,
          items: [for (var i = 1; i <= 12; i++) i.toString().padLeft(2, '0')],
          suffix: 'h',
          onChanged: (val) {
            if (val != null) {
              setState(
                () =>
                    isStart ? schedule['startH'] = val : schedule['endH'] = val,
              );
            }
          },
        ),
        _buildResponsiveDropdown(
          value: m,
          items: ['00', '15', '30', '45'],
          suffix: 'min',
          onChanged: (val) {
            if (val != null) {
              setState(
                () =>
                    isStart ? schedule['startM'] = val : schedule['endM'] = val,
              );
            }
          },
        ),
        _buildResponsiveDropdown(
          value: p,
          items: ['AM', 'PM'],
          onChanged: (val) {
            if (val != null) {
              setState(
                () =>
                    isStart ? schedule['startP'] = val : schedule['endP'] = val,
              );
            }
          },
        ),
      ],
    );
  }

  Widget _buildResponsiveDropdown({
    required String value,
    required List<String> items,
    String suffix = '',
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(left: 4),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFE0E0E0),
        borderRadius: BorderRadius.circular(4),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isDense: true,
          style: const TextStyle(
            color: Color(0xFF3B28FF),
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
          items: items.map((String val) {
            return DropdownMenuItem<String>(
              value: val,
              child: Text('$val$suffix'),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  String _to24h(String h, String m, String p) {
    int hour = int.parse(h);
    if (p == 'PM' && hour < 12) hour += 12;
    if (p == 'AM' && hour == 12) hour = 0;
    return '${hour.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:00';
  }

  Widget _buildPhotoUploadStep() {
    return Column(
      children: [
        if (!_isPhotoTaken) ...[
          const SizedBox(height: 20),
          if (!_isCameraInitialized)
            GestureDetector(
              onTap: _initializeCamera,
              child: Container(
                padding: const EdgeInsets.all(40),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 15,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.camera_alt_outlined,
                  size: 80,
                  color: Color(0xFF3B28FF),
                ),
              ),
            )
          else
            Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    height: 400,
                    width: 300,
                    child: CameraPreview(_cameraController!),
                  ),
                ),
                const SizedBox(height: 20),
                GestureDetector(
                  onTap: _takePicture,
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: const BoxDecoration(
                      color: Color(0xFF3B28FF),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.camera,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
        ] else ...[
          // Preview state
          const SizedBox(height: 10),
          Stack(
            alignment: Alignment.bottomCenter,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  height: 450,
                  width: double.infinity,
                  child: Image.file(
                    File(_capturedFile!.path),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              Positioned(
                bottom: 20,
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _isPhotoTaken = false;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.sync_alt,
                          size: 30,
                          color: Color(0xFF3B28FF),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 30),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: CustomButton(
              text: 'Registrarme',
              onPressed: _submitRegistration,
            ),
          ),
        ],
      ],
    );
  }

  void _showReferenceInfoDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFFD9D9D9),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Información sobre la\ndirección de referencia',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        content: const Text(
          'La dirección que inserte en este campo se usara para determinar su área de recomendaciones.\nSus servicios se le recomendarán a los usuarios que soliciten servicio técnico desde un área cercana a la dirección que escriba en este campo. Podrá editar la dirección en el futuro si lo necesita.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.primary, fontSize: 14),
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          CustomButton(
            text: 'Ok',
            width: 120,
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  void _showAddressConfirmationDialog() {
    // Usamos Future.delayed(Duration.zero) para asegurar que la UI esté lista antes de abrir el diálogo
    Future.delayed(Duration.zero, () {
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false, // Forzar a que usen los botones
        builder: (context) {
          return AlertDialog(
            backgroundColor: const Color(0xFFD9D9D9),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: const Text(
              '¿Su dirección completa es la\nque aparece a continuación?',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            content: Container(
              width: 300, // Ancho fijo para evitar problemas de layout
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      height: 150,
                      width: double.infinity,
                      color: Colors.grey[400],
                      child: Image.asset(
                        AppAssets.mapPlaceholder,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            const Center(
                              child: Icon(
                                Icons.map,
                                size: 50,
                                color: Colors.white,
                              ),
                            ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _referenceAddressController.text.isEmpty
                        ? 'Dirección no proporcionada'
                        : _referenceAddressController.text,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            actionsAlignment: MainAxisAlignment.spaceEvenly,
            actions: [
              SizedBox(
                width: 100,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFC4C4C4),
                    foregroundColor: AppColors.primary,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'No',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              SizedBox(
                width: 100,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFC4C4C4),
                    foregroundColor: AppColors.primary,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  onPressed: () {
                    Navigator.pop(context); // Close dialog
                    setState(() {
                      _currentStep = 1;
                    });
                  },
                  child: const Text(
                    'Sí',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          );
        },
      );
    });
  }

  Widget _buildLoginLink() {
    return TextButton(
      onPressed: () => context.go('/login'),
      child: const Text(
        '¿Tiene una cuenta?',
        style: TextStyle(color: AppColors.primary, fontSize: 14),
      ),
    );
  }
}
