import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/custom_text_field.dart';

class EditDataScreen extends StatefulWidget {
  const EditDataScreen({super.key});

  @override
  State<EditDataScreen> createState() => _EditDataScreenState();
}

class _EditDataScreenState extends State<EditDataScreen> {
  final UserService _userService = UserService();
  final _nameController = TextEditingController();
  final _idController = TextEditingController();
  final _phoneController = TextEditingController();
  final _locationController = TextEditingController();

  bool _isLoading = true;
  bool _isSaving = false;
  Map<String, dynamic>? _profileData;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final response = await _userService.getProfile();
      if (response.success && mounted) {
        final data = response.data;
        setState(() {
          _profileData = data;
          final bool isNat = (data?['person_type'] ?? '') == 'natural';
          if (isNat) {
            _nameController.text = '${data?['names'] ?? ''} ${data?['surnames'] ?? ''}'.trim();
            _idController.text = data?['dni'] ?? '';
          } else {
            _nameController.text = data?['company_name'] ?? '';
            _idController.text = data?['ruc'] ?? '';
          }
          _phoneController.text = data?['phone'] ?? '';
          _locationController.text = data?['reference_address'] ?? data?['address'] ?? '';
          _isLoading = false;
        });
      } else if (mounted) {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateProfile() async {
    setState(() => _isSaving = true);
    try {
      final bool isNatural = (_profileData?['person_type'] ?? '') == 'natural';
      String? names;
      String? surnames;
      if (isNatural) {
        final parts = _nameController.text.trim().split(' ');
        if (parts.length > 1) {
          names = parts[0];
          surnames = parts.sublist(1).join(' ');
        } else {
          names = parts[0];
          surnames = '';
        }
      }

      final response = await _userService.updateProfile(
        phone: _phoneController.text,
        names: names,
        surnames: surnames,
        dni: isNatural ? _idController.text : null,
        companyName: !isNatural ? _nameController.text : null,
        ruc: !isNatural ? _idController.text : null,
        referenceAddress: _locationController.text,
      );

      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.success ? 'Datos actualizados con éxito' : (response.message ?? 'Error al actualizar')),
            backgroundColor: response.success ? AppColors.success : AppColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            margin: const EdgeInsets.all(16),
          ),
        );
        if (response.success) context.pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Error de conexión'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    final isNatural = _profileData?['person_type'] == 'natural';

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        leadingWidth: 120,
        leading: TextButton.icon(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          label: const Text('Regresar', style: TextStyle(fontWeight: FontWeight.w600)),
          style: TextButton.styleFrom(
            padding: const EdgeInsets.only(left: 8),
            alignment: Alignment.centerLeft,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              const Text(
                'Editar Datos',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Actualice su información personal',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 28),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.divider.withOpacity(0.5)),
                  boxShadow: AppColors.cardShadow,
                ),
                child: Column(
                  children: [
                    CustomTextField(
                      label: isNatural ? 'Nombre Completo' : 'Nombre de Empresa',
                      hint: isNatural ? 'Ingrese su nombre' : 'Nombre de empresa',
                      controller: _nameController,
                      prefixIcon: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Icon(
                          isNatural ? Icons.person_outline : Icons.business_outlined,
                          color: AppColors.textLight,
                          size: 22,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    CustomTextField(
                      label: isNatural ? 'DNI' : 'RUC',
                      hint: isNatural ? 'Ingrese su DNI' : 'Ingrese su RUC',
                      controller: _idController,
                      keyboardType: TextInputType.number,
                      prefixIcon: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Icon(Icons.badge_outlined, color: AppColors.textLight, size: 22),
                      ),
                    ),
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
                      label: 'Ubicación',
                      hint: 'Ingrese su ubicación',
                      controller: _locationController,
                      prefixIcon: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Icon(Icons.location_on_outlined, color: AppColors.textLight, size: 22),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: AppColors.elevatedShadow,
                  ),
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _updateProfile,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _isSaving
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.save_rounded, color: Colors.white, size: 20),
                              SizedBox(width: 10),
                              Text(
                                'Actualizar Datos',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
