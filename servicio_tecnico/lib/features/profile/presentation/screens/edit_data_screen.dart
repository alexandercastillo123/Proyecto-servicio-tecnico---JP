import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/custom_button.dart';

class EditDataScreen extends StatefulWidget {
  const EditDataScreen({super.key});
  @override
  State<EditDataScreen> createState() => _EditDataScreenState();
}

class _EditDataScreenState extends State<EditDataScreen> {
  final _userService = UserService();
  final _nameCtrl     = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _idCtrl       = TextEditingController();
  final _phoneCtrl    = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _descCtrl     = TextEditingController();
  final _emailCtrl    = TextEditingController();

  bool _isLoading = true, _isSaving = false;
  Map<String, dynamic>? _profile;

  @override
  void initState() { super.initState(); _load(); }

  @override
  void dispose() {
    _nameCtrl.dispose(); _usernameCtrl.dispose(); _idCtrl.dispose();
    _phoneCtrl.dispose(); _locationCtrl.dispose(); _descCtrl.dispose(); _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await _userService.getProfile();
      if (res.success && mounted) {
        final d = res.data;
        final isNat = (d?['person_type'] ?? '') == 'natural';
        setState(() {
          _profile = d;
          _nameCtrl.text = isNat
              ? '${d?['names'] ?? ''} ${d?['surnames'] ?? ''}'.trim()
              : (d?['company_name'] ?? '');
          _idCtrl.text       = isNat ? (d?['dni'] ?? '') : (d?['ruc'] ?? '');
          _phoneCtrl.text    = d?['phone'] ?? '';
          _usernameCtrl.text = d?['username'] ?? '';
          _locationCtrl.text = d?['reference_address'] ?? d?['address'] ?? '';
          _descCtrl.text     = d?['description'] ?? '';
          _emailCtrl.text    = d?['email'] ?? '';
          _isLoading = false;
        });
      } else if (mounted) setState(() => _isLoading = false);
    } catch (_) { if (mounted) setState(() => _isLoading = false); }
  }

  Future<void> _save() async {
    if (_usernameCtrl.text.trim().isEmpty) { _snack('El nombre de usuario no puede estar vacío'); return; }
    setState(() => _isSaving = true);
    try {
      final isNat = (_profile?['person_type'] ?? '') == 'natural';
      String? names, surnames;
      if (isNat) {
        final parts = _nameCtrl.text.trim().split(' ');
        names    = parts[0];
        surnames = parts.length > 1 ? parts.sublist(1).join(' ') : '';
      }
      final res = await _userService.updateProfile(
        username: _usernameCtrl.text.trim(),
        phone: _phoneCtrl.text,
        names: names,
        surnames: surnames,
        dni: isNat ? _idCtrl.text : null,
        companyName: !isNat ? _nameCtrl.text : null,
        ruc: !isNat ? _idCtrl.text : null,
        referenceAddress: _locationCtrl.text,
        description: _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
      );
      if (mounted) {
        setState(() => _isSaving = false);
        if (res.success) { _snack('Datos actualizados', isError: false); context.pop(); }
        else _snack(res.message ?? 'Error al actualizar');
      }
    } catch (_) { if (mounted) { setState(() => _isSaving = false); _snack('Error de conexión'); } }
  }

  void _snack(String msg, {bool isError = true}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: GoogleFonts.outfit()),
      backgroundColor: isError ? AppColors.error : AppColors.success,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      margin: const EdgeInsets.all(16),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.primary)));
    final isNat  = _profile?['person_type'] == 'natural';
    final isTech = _profile?['role'] == 'tech';
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppColors.getBackgroundColor(context),
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
        title: Text('Editar Datos',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800, color: AppColors.getTextPrimary(context))),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            FadeInDown(duration: const Duration(milliseconds: 500),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: AppColors.heroGradient,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: AppColors.premiumShadow,
                ),
                child: Row(children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(14)),
                    child: const Icon(Icons.edit_rounded, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Actualiza tu perfil', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                    Text('Los cambios se reflejarán de inmediato', style: GoogleFonts.outfit(color: Colors.white60, fontSize: 12)),
                  ])),
                ]),
              )),

            const SizedBox(height: 28),
            _label('Nombre de Usuario'),
            const SizedBox(height: 8),
            FadeInUp(duration: const Duration(milliseconds: 400), delay: const Duration(milliseconds: 60),
              child: CustomTextField(label: '', hint: 'usuario123', controller: _usernameCtrl,
                prefixIcon: const Icon(Icons.alternate_email_rounded, color: AppColors.primary, size: 20))),

            const SizedBox(height: 16),
            _label(isNat ? 'Nombre Completo' : 'Nombre de Empresa'),
            const SizedBox(height: 8),
            FadeInUp(duration: const Duration(milliseconds: 400), delay: const Duration(milliseconds: 100),
              child: CustomTextField(label: '', hint: isNat ? 'Juan Pérez' : 'Mi Empresa S.A.C', controller: _nameCtrl,
                prefixIcon: const Icon(Icons.person_outline_rounded, color: AppColors.primary, size: 20))),

            const SizedBox(height: 16),
            _label(isNat ? 'DNI' : 'RUC'),
            const SizedBox(height: 8),
            FadeInUp(duration: const Duration(milliseconds: 400), delay: const Duration(milliseconds: 140),
              child: CustomTextField(label: '', hint: isNat ? '12345678' : '12345678901', controller: _idCtrl,
                readOnly: true,
                prefixIcon: const Icon(Icons.badge_outlined, color: AppColors.textLight, size: 20))),

            const SizedBox(height: 16),
            _label('Correo Electrónico'),
            const SizedBox(height: 8),
            FadeInUp(duration: const Duration(milliseconds: 400), delay: const Duration(milliseconds: 180),
              child: CustomTextField(label: '', hint: 'correo@ejemplo.com', controller: _emailCtrl,
                readOnly: true,
                prefixIcon: const Icon(Icons.email_outlined, color: AppColors.textLight, size: 20))),

            const SizedBox(height: 16),
            _label('Teléfono'),
            const SizedBox(height: 8),
            FadeInUp(duration: const Duration(milliseconds: 400), delay: const Duration(milliseconds: 220),
              child: CustomTextField(label: '', hint: '987654321', controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                prefixIcon: const Icon(Icons.phone_outlined, color: AppColors.primary, size: 20))),

            const SizedBox(height: 16),
            _label('Dirección de Referencia'),
            const SizedBox(height: 8),
            FadeInUp(duration: const Duration(milliseconds: 400), delay: const Duration(milliseconds: 260),
              child: CustomTextField(label: '', hint: 'Av. Principal 123, Lima', controller: _locationCtrl,
                prefixIcon: const Icon(Icons.location_on_outlined, color: AppColors.primary, size: 20))),

            if (isTech) ...[
              const SizedBox(height: 16),
              _label('Descripción Profesional'),
              const SizedBox(height: 8),
              FadeInUp(duration: const Duration(milliseconds: 400), delay: const Duration(milliseconds: 300),
                child: CustomTextField(label: '', hint: 'Especialista en reparación de laptops...', controller: _descCtrl,
                  maxLines: 3,
                  prefixIcon: const Icon(Icons.info_outline_rounded, color: AppColors.primary, size: 20))),
            ],

            const SizedBox(height: 36),
            FadeInUp(duration: const Duration(milliseconds: 400), delay: const Duration(milliseconds: 340),
              child: CustomButton(text: 'Guardar Cambios', isLoading: _isSaving, onPressed: _save,
                icon: Icons.check_rounded)),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) => Text(text,
    style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700,
      color: AppColors.getTextSecondary(context), letterSpacing: 0.2));
}
