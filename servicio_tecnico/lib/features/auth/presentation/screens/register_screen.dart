import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:servicio_tecnico_app/core/services/auth_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/custom_button.dart';
import '../../../../core/constants/assets.dart';

class RegisterScreen extends StatefulWidget {
  final String? role;
  final String? personType;

  const RegisterScreen({super.key, this.role, this.personType});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> with SingleTickerProviderStateMixin {
  int _currentStep = 0;
  bool _isRegistering = false;
  XFile? _pickedImage;
  final ImagePicker _picker = ImagePicker();
  late AnimationController _stepAnimController;

  final _namesController = TextEditingController();
  final _surnamesController = TextEditingController();
  final _dniController = TextEditingController();
  final _rucController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _referenceAddressController = TextEditingController();
  final _userController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _stepAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _stepAnimController.forward();
  }

  @override
  void dispose() {
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
    _stepAnimController.dispose();
    super.dispose();
  }

  void _nextStep() {
    bool isJuridical = widget.personType == 'juridical';

    if (_currentStep == 1) {
      if (_passwordController.text != _confirmPasswordController.text) {
        _showSnackBar('Las contraseñas no coinciden', AppColors.error);
        return;
      }
      if (_passwordController.text.length < 6) {
        _showSnackBar('La contraseña debe tener al menos 6 caracteres', AppColors.warning);
        return;
      }
    }

    int maxStep = isJuridical ? 3 : 2;
    if (_currentStep < maxStep) {
      _stepAnimController.reset();
      setState(() => _currentStep++);
      _stepAnimController.forward();
    }
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) setState(() => _pickedImage = image);
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      _stepAnimController.reset();
      setState(() => _currentStep--);
      _stepAnimController.forward();
    } else {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isJuridical = widget.personType == 'juridical';
    bool isProvider = widget.role == 'tech';
    int totalSteps = isJuridical ? 4 : 3;
    double progress = (_currentStep + 1) / totalSteps;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            // Header with progress
            _buildHeader(progress, totalSteps),

            // Content
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 400),
                  transitionBuilder: (child, animation) {
                    return FadeTransition(
                      opacity: animation,
                      child: SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0.05, 0),
                          end: Offset.zero,
                        ).animate(CurvedAnimation(
                          parent: animation,
                          curve: Curves.easeOutCubic,
                        )),
                        child: child,
                      ),
                    );
                  },
                  child: Container(
                    key: ValueKey<int>(_currentStep),
                    child: _buildCurrentStepContent(isJuridical, isProvider),
                  ),
                ),
              ),
            ),

            // Bottom buttons
            Padding(
              padding: const EdgeInsets.fromLTRB(28, 0, 28, 24),
              child: Column(
                children: [
                  if (_shouldShowContinue(isJuridical))
                    CustomButton(
                      text: _currentStep == (isJuridical ? 2 : 1)
                          ? 'Siguiente: Foto'
                          : 'Continuar',
                      onPressed: () {
                        if (_currentStep == 0 && isProvider) {
                          _showAddressConfirmationDialog();
                        } else {
                          _nextStep();
                        }
                      },
                      icon: Icons.arrow_forward_rounded,
                    ),
                  if (_currentStep == 0) ...[
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          '¿Tiene una cuenta? ',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                        ),
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: const Text(
                            'Inicie sesión',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(double progress, int totalSteps) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                onPressed: _previousStep,
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.primarySoft.withOpacity(0.3),
                  padding: const EdgeInsets.all(10),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Paso ${_currentStep + 1} de $totalSteps',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: TweenAnimationBuilder<double>(
                        duration: const Duration(milliseconds: 500),
                        tween: Tween(begin: 0, end: progress),
                        curve: Curves.easeOutCubic,
                        builder: (context, value, child) {
                          return LinearProgressIndicator(
                            value: value,
                            backgroundColor: AppColors.primarySoft.withOpacity(0.3),
                            color: AppColors.primary,
                            minHeight: 6,
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Image.asset(AppAssets.logo, height: 36, fit: BoxFit.contain),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentStepContent(bool isJuridical, bool isProvider) {
    if (_currentStep == 0) return _buildPersonalInfoStep(isJuridical, isProvider);
    if (_currentStep == 1) return _buildAccountInfoStep();
    if (isJuridical && _currentStep == 2) return _buildOperatingHoursStep();
    return _buildPhotoUploadStep();
  }

  bool _shouldShowContinue(bool isJuridical) {
    if (isJuridical) return _currentStep < 3;
    return _currentStep < 2;
  }

  Widget _buildPersonalInfoStep(bool isJuridical, bool isProvider) {
    return Column(
      key: const ValueKey('personal'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        const Text(
          'Datos Personales',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 24,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Complete su información personal',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 24),
        if (!isJuridical) ...[
          CustomTextField(
            label: 'Nombres',
            hint: 'Ingrese sus nombres',
            controller: _namesController,
            prefixIcon: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Icon(Icons.person_outline, color: AppColors.textLight, size: 22),
            ),
          ),
          const SizedBox(height: 16),
          CustomTextField(
            label: 'Apellidos',
            hint: 'Ingrese sus apellidos',
            controller: _surnamesController,
            prefixIcon: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Icon(Icons.person_outline, color: AppColors.textLight, size: 22),
            ),
          ),
          const SizedBox(height: 16),
          CustomTextField(
            label: 'DNI',
            hint: 'Ingrese su DNI',
            controller: _dniController,
            keyboardType: TextInputType.number,
            prefixIcon: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Icon(Icons.badge_outlined, color: AppColors.textLight, size: 22),
            ),
          ),
        ] else ...[
          CustomTextField(
            label: 'Razón Social',
            hint: 'Nombre de la empresa',
            controller: _namesController,
            prefixIcon: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Icon(Icons.business_outlined, color: AppColors.textLight, size: 22),
            ),
          ),
          const SizedBox(height: 16),
          CustomTextField(
            label: 'RUC',
            hint: 'Ingrese su RUC',
            controller: _rucController,
            keyboardType: TextInputType.number,
            prefixIcon: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Icon(Icons.badge_outlined, color: AppColors.textLight, size: 22),
            ),
          ),
        ],
        const SizedBox(height: 16),
        CustomTextField(
          label: 'Teléfono',
          hint: 'Ingrese su teléfono',
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          prefixIcon: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Icon(Icons.phone_outlined, color: AppColors.textLight, size: 22),
          ),
        ),
        const SizedBox(height: 16),
        CustomTextField(
          label: 'Correo Electrónico',
          hint: 'correo@ejemplo.com',
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          prefixIcon: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Icon(Icons.email_outlined, color: AppColors.textLight, size: 22),
          ),
        ),
        if (isProvider) ...[
          const SizedBox(height: 16),
          CustomTextField(
            label: 'Dirección de Referencia',
            hint: 'Ingrese su dirección',
            controller: _referenceAddressController,
            prefixIcon: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Icon(Icons.location_on_outlined, color: AppColors.textLight, size: 22),
            ),
            suffixIcon: IconButton(
              icon: const Icon(Icons.info_outline_rounded, color: AppColors.primary, size: 22),
              onPressed: _showReferenceInfoDialog,
            ),
          ),
        ],
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildAccountInfoStep() {
    return Column(
      key: const ValueKey('account'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        const Text(
          'Datos de Cuenta',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 24,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Cree sus credenciales de acceso',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 24),
        CustomTextField(
          label: 'Usuario',
          hint: 'Ingrese su usuario',
          controller: _userController,
          prefixIcon: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Icon(Icons.alternate_email_rounded, color: AppColors.textLight, size: 22),
          ),
        ),
        const SizedBox(height: 16),
        CustomTextField(
          label: 'Contraseña',
          hint: 'Mínimo 6 caracteres',
          controller: _passwordController,
          isPassword: true,
          prefixIcon: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Icon(Icons.lock_outline, color: AppColors.textLight, size: 22),
          ),
        ),
        const SizedBox(height: 16),
        CustomTextField(
          label: 'Confirmar Contraseña',
          hint: 'Repita la contraseña',
          controller: _confirmPasswordController,
          isPassword: true,
          prefixIcon: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Icon(Icons.lock_outline, color: AppColors.textLight, size: 22),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildOperatingHoursStep() {
    return Column(
      key: const ValueKey('hours'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        const Text(
          'Horario de Atención',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 24,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Configure su disponibilidad',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 24),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.divider, width: 1),
          ),
          child: Column(
            children: [
              _buildDayRow('Lunes'),
              _buildDayRow('Martes'),
              _buildDayRow('Miércoles'),
              _buildDayRow('Jueves'),
              _buildDayRow('Viernes'),
              _buildDayRow('Sábado'),
              _buildDaySelectorRow('Domingo'),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildDayRow(String day) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider.withOpacity(0.5)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 20),
          const SizedBox(width: 12),
          Text(
            day,
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
          const Spacer(),
          const Text(
            '8:00 AM - 6:00 PM',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildDaySelectorRow(String day) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.warningLight.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.warning.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.schedule_rounded, color: AppColors.warning, size: 20),
              const SizedBox(width: 12),
              Text(
                day,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Text('Desde: ', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
              _buildTimeDropdown('12h'),
              _buildTimeDropdown('00min'),
              _buildTimeDropdown('AM'),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Text('Hasta:  ', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: AppColors.primary,
              fontSize: 13,
            ),
          ),
          const Icon(Icons.arrow_drop_down, size: 18, color: AppColors.primary),
        ],
      ),
    );
  }

  Widget _buildPhotoUploadStep() {
    return Column(
      key: const ValueKey('photo'),
      children: [
        const SizedBox(height: 16),
        const Text(
          'Foto de Perfil',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 24,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Agregue una foto para su perfil',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 32),
        if (_pickedImage == null) ...[
          GestureDetector(
            onTap: _pickImage,
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                color: AppColors.primarySoft.withOpacity(0.3),
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.primary.withOpacity(0.2),
                  width: 2,
                  strokeAlign: BorderSide.strokeAlignInside,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.camera_alt_rounded,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Tocar para\nseleccionar',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ] else ...[
          Stack(
            alignment: Alignment.bottomCenter,
            children: [
              Container(
                width: double.infinity,
                height: 350,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: AppColors.cardShadow,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Image.file(
                    File(_pickedImage!.path),
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: AppColors.errorLight,
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.error_outline, size: 48, color: AppColors.error),
                            SizedBox(height: 12),
                            Text('Error al cargar la imagen', style: TextStyle(color: AppColors.error)),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
              Positioned(
                bottom: 16,
                child: Row(
                  children: [
                    _buildPhotoAction(Icons.camera_alt_rounded, _pickImage),
                    const SizedBox(width: 16),
                    _buildPhotoAction(
                      Icons.refresh_rounded,
                      () => setState(() => _pickedImage = null),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          CustomButton(
            text: 'Registrarme',
            onPressed: _handleRegister,
            isLoading: _isRegistering,
            icon: Icons.how_to_reg_rounded,
          ),
        ],
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildPhotoAction(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: AppColors.cardShadow,
        ),
        child: Icon(icon, color: AppColors.primary, size: 28),
      ),
    );
  }

  Future<void> _handleRegister() async {
    if (_pickedImage == null) {
      _showSnackBar('Por favor tome una foto de perfil', AppColors.error);
      return;
    }
    if (_isRegistering) return;
    setState(() => _isRegistering = true);

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
        city: 'Lima',
        referenceAddress: widget.role == 'tech' ? _referenceAddressController.text : null,
      );

      if (response.success) {
        if (context.mounted) {
          context.go(widget.role == 'tech' ? '/home' : '/client-home');
        }
      } else {
        if (context.mounted) {
          _showSnackBar(response.message ?? 'Error al registrarse', AppColors.error);
        }
      }
    } catch (e) {
      if (context.mounted) {
        _showSnackBar('Error: ${e.toString()}', AppColors.error);
      }
    } finally {
      if (mounted) setState(() => _isRegistering = false);
    }
  }

  void _showReferenceInfoDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        icon: Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: AppColors.infoLight,
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.info_outline_rounded, color: AppColors.info, size: 32),
        ),
        title: const Text(
          'Dirección de referencia',
          textAlign: TextAlign.center,
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        content: const Text(
          'La dirección que inserte en este campo se usará para determinar su área de recomendaciones.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5),
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          SizedBox(
            width: 120,
            child: CustomButton(
              text: 'Entendido',
              onPressed: () => Navigator.pop(context),
              variant: ButtonVariant.secondary,
            ),
          ),
        ],
      ),
    );
  }

  void _showAddressConfirmationDialog() {
    Future.delayed(Duration.zero, () {
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) {
          return AlertDialog(
            backgroundColor: AppColors.surface,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            icon: Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.primarySoft,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 32),
            ),
            title: const Text(
              '¿Su dirección es correcta?',
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
            ),
            content: Container(
              width: 300,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      height: 120,
                      width: double.infinity,
                      color: AppColors.surfaceLight,
                      child: Image.asset(
                        AppAssets.mapPlaceholder,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            const Center(child: Icon(Icons.map_rounded, size: 48, color: AppColors.primary)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _referenceAddressController.text.isEmpty
                        ? 'Dirección no proporcionada'
                        : _referenceAddressController.text,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                  ),
                ],
              ),
            ),
            actionsAlignment: MainAxisAlignment.spaceEvenly,
            actions: [
              SizedBox(
                width: 100,
                child: CustomButton(
                  text: 'No',
                  onPressed: () => Navigator.pop(context),
                  variant: ButtonVariant.outline,
                ),
              ),
              SizedBox(
                width: 100,
                child: CustomButton(
                  text: 'Sí',
                  onPressed: () {
                    Navigator.pop(context);
                    _stepAnimController.reset();
                    setState(() => _currentStep = 1);
                    _stepAnimController.forward();
                  },
                ),
              ),
            ],
          );
        },
      );
    });
  }
}
