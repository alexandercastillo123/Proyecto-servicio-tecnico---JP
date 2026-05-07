import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:servicio_tecnico_app/core/services/auth_service.dart';
import 'package:servicio_tecnico_app/core/services/camera_service.dart';
import 'package:servicio_tecnico_app/core/services/local_cache_service.dart';
import 'package:servicio_tecnico_app/core/services/user_service.dart';
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
  double? _techLat;
  double? _techLng;
  bool _isGeocoding = false;
  bool _policiesAccepted = false;

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
    _cameraService.dispose();
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

  bool _isInitializingCamera = false;

  Future<void> _initializeCamera() async {
    // Guard: prevent concurrent calls that trigger duplicate permission requests
    if (_isInitializingCamera) return;
    if (_cameraController != null && _cameraController!.value.isInitialized)
      return;

    setState(() => _isInitializingCamera = true);

    try {
      // Request permission first and wait for it to fully resolve
      final status = await Permission.camera.request();
      if (!mounted) return;

      if (status.isGranted) {
        final controller = await _cameraService.getController();
        if (mounted) {
          setState(() {
            _cameraController = controller;
            _isCameraInitialized = controller?.value.isInitialized ?? false;
          });
        }
      } else if (status.isPermanentlyDenied) {
        if (mounted) {
          _showError(
            'Permiso de cámara denegado. Actívalo en la configuración del dispositivo.',
          );
          openAppSettings();
        }
      } else {
        if (mounted) _showError('Se requiere permiso de cámara para continuar');
      }
    } catch (e) {
      if (mounted) _showError('Error al abrir la cámara: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _isInitializingCamera = false);
    }
  }

  Future<void> _takePicture() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized)
      return;

    final file = await _cameraService.takePicture();
    if (file != null && mounted) {
      setState(() {
        _capturedFile = file;
        _isPhotoTaken = true;
      });
      // Detener cámara después de tomar la foto para liberar recursos
      _cameraService.dispose();
      setState(() {
        _isCameraInitialized = false;
        _cameraController = null;
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

  Future<void> _nextStep() async {
    bool isJuridical = widget.personType == 'juridical';
    bool isClient = widget.role == 'client';

    // For clients, max step is 1 (Step 0: Info, Step 1: Account)
    int maxStep = isClient ? 1 : (isJuridical ? 3 : 2);

    if (_currentStep < maxStep) {
      if (_validateLocalFields()) {
        // Validacion asincrona contra el servidor
        setState(() => _isGeocoding = true); // Usar el mismo loading
        try {
          final authService = AuthService();
          if (_currentStep == 0) {
            final res = await authService.validateEmail(
              _emailController.text.trim(),
            );
            if (!res.success) {
              if (mounted)
                _showError(res.message ?? 'Email inválido o ya registrado');
              return;
            }
          } else if (_currentStep == 1) {
            final res = await authService.validateUsername(
              _userController.text.trim(),
            );
            if (!res.success) {
              if (mounted) _showError(res.message ?? 'Usuario no disponible');
              return;
            }
            // Validar password minimo 6 caracteres
            if (_passwordController.text.length < 6) {
              if (mounted)
                _showError('La contraseña debe tener al menos 6 caracteres');
              return;
            }
          }

          if (mounted) {
            setState(() {
              _currentStep++;
            });
          }
        } catch (e) {
          if (mounted) _showError('Error de conexión al validar');
        } finally {
          if (mounted) setState(() => _isGeocoding = false);
        }
      }
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
                    isLoading: _isGeocoding,
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

  bool _validateLocalFields() {
    if (_currentStep == 0) {
      if (widget.personType == 'natural') {
        if (_namesController.text.trim().isEmpty ||
            _surnamesController.text.trim().isEmpty ||
            _dniController.text.trim().isEmpty ||
            _emailController.text.trim().isEmpty) {
          _showError('Por favor rellene todos los campos personales');
          return false;
        }

        if (_dniController.text.trim().length != 8) {
          _showError('El DNI debe tener exactamente 8 dígitos');
          return false;
        }
      } else if (widget.personType == 'juridical') {
        if (_namesController.text.trim().isEmpty ||
            _rucController.text.trim().isEmpty ||
            _emailController.text.trim().isEmpty) {
          _showError('Por favor rellene los datos de la empresa');
          return false;
        }

        if (_rucController.text.trim().length != 11) {
          _showError('El RUC debe tener exactamente 11 dígitos');
          return false;
        }
      }

      // Email format
      final emailRegex = RegExp(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
      );
      if (!emailRegex.hasMatch(_emailController.text.trim())) {
        _showError('Formato de correo electrónico inválido');
        return false;
      }

      if (widget.role == 'tech') {
        if (_phoneController.text.trim().isEmpty) {
          _showError('Por favor rellene su teléfono');
          return false;
        }
        if (_phoneController.text.trim().length != 9) {
          _showError('El teléfono debe tener exactamente 9 dígitos');
          return false;
        }
      }
    } else if (_currentStep == 1) {
      if (_userController.text.trim().isEmpty ||
          _passwordController.text.isEmpty ||
          _confirmPasswordController.text.isEmpty) {
        _showError('Por favor complete los datos de acceso');
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
            const SizedBox(height: 16),
            _buildPoliciesCheckbox(),
            const SizedBox(height: 16),
            CustomButton(text: 'Registrarme', onPressed: _submitRegistration),
          ] else ...[
            const SizedBox(height: 16),
            _buildPoliciesCheckbox(),
          ],
        ],
      ),
    );
  }

  Widget _buildPoliciesCheckbox() {
    return Row(
      children: [
        Checkbox(
          value: _policiesAccepted,
          onChanged: (val) => setState(() => _policiesAccepted = val ?? false),
          activeColor: AppColors.primary,
        ),
        Expanded(
          child: GestureDetector(
            onTap: _showPoliciesDialog,
            child: RichText(
              text: TextSpan(
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontFamily: 'Outfit',
                ),
                children: [
                  const TextSpan(text: 'Acepto los '),
                  TextSpan(
                    text: 'Términos de Servicio y la Política de Privacidad',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _showPoliciesDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Políticas Generales - J&P',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF3B28FF),
          ),
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text(
                '1. Uso de la Plataforma',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                'Esta aplicación es exclusiva para la gestión de servicios técnicos y adquisición de repuestos proporcionados por J&P y sus aliados.',
              ),
              SizedBox(height: 12),
              Text(
                '2. Privacidad de Datos',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                'Su información personal y geolocalización solo se utilizarán para facilitar la llegada del técnico o la entrega de pedidos.',
              ),
              SizedBox(height: 12),
              Text(
                '3. Compromiso de Servicio',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                'Los técnicos se comprometen a cumplir con los horarios establecidos. Los clientes deben proporcionar una ubicación precisa.',
              ),
              SizedBox(height: 12),
              Text(
                '4. Pagos y Comisiones',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                'Los pagos realizados a través de la app están protegidos. No se recomienda realizar pagos externos para servicios gestionados aquí.',
              ),
              SizedBox(height: 12),
              Text(
                '5. Conducta del Usuario',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                'Se prohíbe el uso de lenguaje ofensivo en el chat. El incumplimiento puede resultar en la suspensión de la cuenta.',
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Entendido',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submitRegistration() async {
    if (!_validateLocalFields()) return;

    if (!_policiesAccepted) {
      _showError('Debes aceptar los términos y condiciones');
      return;
    }

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
        username: _userController.text.trim(), // Nuevo campo
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
        latitude: widget.role == 'tech' ? _techLat : null,
        longitude: widget.role == 'tech' ? _techLng : null,
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
        policiesAccepted: _policiesAccepted,
      );

      // Cerrar loading
      if (context.mounted) Navigator.pop(context);

      if (response.success) {
        // Subir foto si existe
        if (_capturedFile != null) {
          await UserService().uploadPhoto(_capturedFile!.path);
        }

        if (response.success && response.data != null) {
          final role = response.data!['role'] ?? widget.role;
          final userId = response.data!['id'];
          await LocalCacheService.saveRole(role);
          if (userId != null) {
            await LocalCacheService.saveUserId(userId);
          }
          await LocalCacheService.saveLastActivity();

          if (context.mounted) {
            final target = role == 'client' ? '/client-home' : '/home';
            context.go(target);
          }
        } else {
          if (context.mounted)
            _showError(response.message ?? 'Error al registrarse');
        }
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
                  size: 64,
                  color: AppColors.primary,
                ),
              ),
            )
          else
            Column(
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 40),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Seguridad Biométrica',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Capture su identidad para el perfil',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(40),
                    child: Container(
                      height: 450,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(40),
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Transform.scale(
                            scale: 1.1,
                            child: CameraPreview(_cameraController!),
                          ),
                          // Face Guide Overlay
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: Colors.white.withOpacity(0.2),
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(200),
                            ),
                            width: 280,
                            height: 350,
                          ),
                          // Vignette
                          Container(
                            decoration: BoxDecoration(
                              gradient: RadialGradient(
                                colors: [
                                  Colors.transparent,
                                  Colors.black.withOpacity(0.4),
                                ],
                                stops: const [0.6, 1.0],
                              ),
                            ),
                          ),
                          // Capture Button Integrated
                          Positioned(
                            bottom: 30,
                            child: GestureDetector(
                              onTap: _takePicture,
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white,
                                    width: 4,
                                  ),
                                ),
                                child: Container(
                                  width: 60,
                                  height: 60,
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.camera_alt,
                                    color: AppColors.primary,
                                    size: 28,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
        ] else ...[
          // Preview state
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Validación de Imagen',
                  style: TextStyle(
                    color: AppColors.success,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  '¿Desea usar esta fotografía?',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Stack(
              alignment: Alignment.bottomCenter,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(40),
                  child: Container(
                    height: 450,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: AppColors.primary.withOpacity(0.1),
                        width: 1,
                      ),
                      boxShadow: AppColors.premiumShadow,
                    ),
                    child: Image.file(
                      File(_capturedFile!.path),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Positioned(
                  bottom: 24,
                  child: GestureDetector(
                    onTap: () => setState(() => _isPhotoTaken = false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: AppColors.softShadow,
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.refresh_rounded,
                            color: AppColors.primary,
                            size: 20,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'REINTENTAR',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w900,
                              fontSize: 12,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: CustomButton(
              text: 'Finalizar Registro',
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

  Future<void> _showAddressConfirmationDialog() async {
    final address = _referenceAddressController.text.trim();
    if (address.isEmpty) {
      _showError('Por favor ingrese una dirección de referencia');
      return;
    }

    setState(() => _isGeocoding = true);

    try {
      // Nominatim Geocoding API (Free)
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(address)}&format=json&limit=1',
      );
      final response = await http
          .get(
            url,
            headers: {
              'User-Agent': 'com.jp.serviciotecnico.servicio_tecnico_app',
            },
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        if (data.isNotEmpty) {
          final lat = double.parse(data[0]['lat']);
          final lon = double.parse(data[0]['lon']);

          if (mounted) {
            _showMapDialog(LatLng(lat, lon));
          }
        } else {
          // Si no se encuentra la dirección exacta, abrimos el mapa en Lima
          // pero indicamos que es aproximado para que el usuario lo mueva.
          if (mounted) {
            _showMapDialog(
              const LatLng(-12.0464, -77.0428),
              isApproximate: true,
            );
          }
        }
      } else {
        _showError(
          'Error en el servicio de mapas (Status: ${response.statusCode})',
        );
      }
    } catch (e) {
      _showError('Error al validar dirección: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _isGeocoding = false);
    }
  }

  void _showMapDialog(LatLng initialCoordinates, {bool isApproximate = false}) {
    LatLng currentMarker = initialCoordinates;
    DateTime? lastTapTime;

    void handleMarkLocation(LatLng latLng, Function setDialogState) async {
      setDialogState(() {
        currentMarker = latLng;
        _referenceAddressController.text = "Cargando dirección...";
      });
      try {
        final uri = Uri.parse(
          'https://nominatim.openstreetmap.org/reverse?format=json&lat=${latLng.latitude}&lon=${latLng.longitude}&zoom=18&addressdetails=1',
        );
        final response = await http
            .get(
              uri,
              headers: {
                'User-Agent': 'com.jp.serviciotecnico.servicio_tecnico_app',
              },
            )
            .timeout(const Duration(seconds: 5));

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          if (data['display_name'] != null) {
            setDialogState(() {
              _referenceAddressController.text = data['display_name'];
            });
            setState(() {}); // Update main screen state as well
          }
        }
      } catch (e) {
        debugPrint('Error reverse geocoding: $e');
      }
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFFD9D9D9),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: Text(
                isApproximate
                    ? 'No encontramos la dirección exacta.\n¿Donde se ubica aproximadamente?'
                    : '¿Es correcta esta ubicación?',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              content: SizedBox(
                width: 320, // Definir ancho para evitar error de renderizado
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isApproximate)
                      const Padding(
                        padding: EdgeInsets.only(bottom: 10),
                        child: Text(
                          'Toca el mapa para mover el marcador a tu ubicación real.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.red,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(15),
                      child: SizedBox(
                        height: 250,
                        width: double.infinity,
                        child: FlutterMap(
                          options: MapOptions(
                            initialCenter: initialCoordinates,
                            initialZoom: 15.0,
                            onTap: (tapPosition, latLng) {
                              final now = DateTime.now();
                              if (lastTapTime != null &&
                                  now.difference(lastTapTime!) <
                                      const Duration(milliseconds: 500)) {
                                handleMarkLocation(latLng, setDialogState);
                              } else {
                                lastTapTime = now;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Doble click para marcar ubicación',
                                    ),
                                    duration: Duration(milliseconds: 600),
                                  ),
                                );
                              }
                            },
                          ),
                          children: [
                            TileLayer(
                              urlTemplate:
                                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName:
                                  'com.jp.serviciotecnico.servicio_tecnico_app',
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: currentMarker,
                                  width: 50,
                                  height: 50,
                                  child: const Icon(
                                    Icons.location_on,
                                    color: Colors.red,
                                    size: 40,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _referenceAddressController.text,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              actionsAlignment: MainAxisAlignment.spaceEvenly,
              actions: [
                SizedBox(
                  width: 115,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFC4C4C4),
                      foregroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancelar'),
                  ),
                ),
                SizedBox(
                  width: 125,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: () {
                      setState(() {
                        _techLat = currentMarker.latitude;
                        _techLng = currentMarker.longitude;
                      });
                      Navigator.pop(context); // Close dialog
                      _nextStep(); // Proceed to next step
                    },
                    child: const Text('Confirmar'),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
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
