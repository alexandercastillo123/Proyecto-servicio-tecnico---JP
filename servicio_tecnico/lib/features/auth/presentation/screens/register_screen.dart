import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:servicio_tecnico_app/core/services/auth_service.dart';
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
    int maxStep = isJuridical ? 3 : 2;

    if (_currentStep < maxStep) {
      setState(() {
        _currentStep++;
      });
    } else {
      context.go(widget.role == 'tech' ? '/home' : '/client-home');
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
              Column(
                children: [
                  Text(
                    'J&P',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: _currentStep == 0 ? 80 : 40,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF3B28FF),
                      height: 0.9,
                    ),
                  ),
                  if (_currentStep == 0)
                    const Text(
                      'PERIFÉRICOS  S.A.C',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF3B28FF),
                        letterSpacing: 2,
                      ),
                    ),
                  if (_currentStep != 0)
                    const Text(
                      'PERIFÉRICOS S.A.C',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF3B28FF),
                        letterSpacing: 1.5,
                      ),
                    ),
                ],
              ),

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
    if (isJuridical) {
      if (_currentStep == 3) return false; // Photo step
      return true;
    } else {
      if (_currentStep == 2) return false; // Photo step
      return true;
    }
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
          const SizedBox(height: 16),
          CustomTextField(
            label: 'Teléfono',
            hint: 'Teléfono',
            controller: _phoneController,
            keyboardType: TextInputType.phone,
          ),
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
        ],
      ),
    );
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
                _buildDayRow('Lunes'),
                _buildDayRow('Martes'),
                _buildDayRow('Miércoles'),
                _buildDayRow('Jueves'),
                _buildDayRow('Viernes'),
                _buildDayRow('Sabado'),
                _buildDaySelectorRow('Domingo'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDayRow(String day) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        day,
        style: const TextStyle(
          color: Color(0xFF3B28FF),
          fontWeight: FontWeight.bold,
          fontSize: 16,
        ),
      ),
    );
  }

  Widget _buildDaySelectorRow(String day) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            day,
            style: const TextStyle(
              color: Color(0xFF3B28FF),
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Text(
                'Desde: ',
                style: TextStyle(
                  color: Color(0xFF9E92FF),
                  fontWeight: FontWeight.bold,
                ),
              ),
              _buildTimeDropdown('12h'),
              _buildTimeDropdown('00min'),
              _buildTimeDropdown('AM'),
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
              _buildTimeDropdown('5h'),
              _buildTimeDropdown('00min'),
              _buildTimeDropdown('PM'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimeDropdown(String value) {
    return Container(
      margin: const EdgeInsets.only(left: 4),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFFE0E0E0),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Color(0xFF3B28FF),
            ),
          ),
          const Icon(Icons.arrow_drop_down, size: 18, color: Color(0xFF3B28FF)),
        ],
      ),
    );
  }

  Widget _buildPhotoUploadStep() {
    return Column(
      children: [
        if (!_isPhotoTaken) ...[
          const SizedBox(height: 100),
          GestureDetector(
            onTap: () {
              setState(() {
                _isPhotoTaken = true;
              });
            },
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
          ),
        ] else ...[
          // Preview state
          const SizedBox(height: 10),
          Stack(
            alignment: Alignment.bottomCenter,
            children: [
              ClipRRect(
                child: Image.asset(
                  AppAssets.providerPhoto,
                  height: 450,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    debugPrint('Error loading image: $error');
                    return Container(
                      height: 450,
                      width: double.infinity,
                      color: Colors.grey[300],
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.error_outline,
                            size: 60,
                            color: Colors.red,
                          ),
                          SizedBox(height: 10),
                          Text(
                            'Error al cargar la imagen',
                            style: TextStyle(color: Colors.red),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              Positioned(
                bottom: 20,
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.camera_alt_outlined,
                        size: 40,
                        color: Color(0xFF3B28FF),
                      ),
                    ),
                    const SizedBox(width: 20),
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
              onPressed: () async {
                // Validar que la foto esté tomada
                if (!_isPhotoTaken) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Por favor tome una foto de perfil'),
                      backgroundColor: Colors.red,
                    ),
                  );
                  return;
                }

                // Mostrar loading
                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (context) =>
                      const Center(child: CircularProgressIndicator()),
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
                    phone: _phoneController.text,
                    referenceAddress: widget.role == 'tech'
                        ? _referenceAddressController.text
                        : null,
                  );

                  // Cerrar loading
                  if (context.mounted) Navigator.pop(context);

                  if (response.success) {
                    // Navegar según el rol
                    if (context.mounted) {
                      final target = widget.role == 'tech'
                          ? '/home'
                          : '/client-home';
                      context.go(target);
                    }
                  } else {
                    // Mostrar error
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            response.message ?? 'Error al registrarse',
                          ),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  }
                } catch (e) {
                  // Cerrar loading
                  if (context.mounted) Navigator.pop(context);

                  // Mostrar error
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Error: ${e.toString()}'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              },
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
                  const Text(
                    'Calle Maple, 127, Jesus María, Lima, Perú',
                    textAlign: TextAlign.center,
                    style: TextStyle(
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
