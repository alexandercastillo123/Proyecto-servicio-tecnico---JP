import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/services/user_service.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/custom_button.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});
  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _userService  = UserService();
  final _newCtrl      = TextEditingController();
  final _confirmCtrl  = TextEditingController();
  bool _isLoading = false, _showNew = false, _showConfirm = false;

  @override
  void dispose() { _newCtrl.dispose(); _confirmCtrl.dispose(); super.dispose(); }

  Future<void> _change() async {
    if (_newCtrl.text.isEmpty || _confirmCtrl.text.isEmpty) { _snack('Completa todos los campos'); return; }
    if (_newCtrl.text.length < 6) { _snack('Mínimo 6 caracteres'); return; }
    if (_newCtrl.text != _confirmCtrl.text) { _snack('Las contraseñas no coinciden'); return; }

    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('¿Confirmar cambio?', style: GoogleFonts.outfit(fontWeight: FontWeight.w800)),
        content: Text('¿Estás seguro de que deseas cambiar tu contraseña?',
          style: GoogleFonts.outfit(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false),
            child: Text('Cancelar', style: GoogleFonts.outfit(color: AppColors.textSecondary, fontWeight: FontWeight.w600))),
          TextButton(onPressed: () => Navigator.pop(context, true),
            child: Text('Cambiar', style: GoogleFonts.outfit(color: AppColors.primary, fontWeight: FontWeight.w700))),
        ],
      ),
    );
    if (ok != true) return;

    setState(() => _isLoading = true);
    try {
      final res = await _userService.changePassword(_newCtrl.text);
      if (mounted) {
        if (res.success) { _snack('✅ Contraseña actualizada', isError: false); context.pop(); }
        else _snack(res.message ?? 'Error al actualizar');
      }
    } finally { if (mounted) setState(() => _isLoading = false); }
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
        title: Text('Cambiar Contraseña',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800, color: AppColors.getTextPrimary(context))),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 16),
            FadeInDown(duration: const Duration(milliseconds: 600),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: AppColors.heroGradient,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: AppColors.premiumShadow,
                ),
                child: Column(children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), shape: BoxShape.circle),
                    child: const Icon(Icons.lock_reset_rounded, color: Colors.white, size: 36),
                  ),
                  const SizedBox(height: 14),
                  Text('Actualiza tu seguridad',
                    style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text('Ingresa y confirma tu nueva contraseña.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(color: Colors.white60, fontSize: 13)),
                ]),
              )),

            const SizedBox(height: 32),
            FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 100),
              child: CustomTextField(
                label: 'Nueva Contraseña',
                hint: '••••••••',
                controller: _newCtrl,
                isPassword: !_showNew,
                prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.primary, size: 20),
                suffixIcon: IconButton(
                  icon: Icon(_showNew ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    color: AppColors.textLight, size: 20),
                  onPressed: () => setState(() => _showNew = !_showNew),
                ),
              )),

            const SizedBox(height: 16),
            FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 180),
              child: CustomTextField(
                label: 'Confirmar Contraseña',
                hint: '••••••••',
                controller: _confirmCtrl,
                isPassword: !_showConfirm,
                prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.primary, size: 20),
                suffixIcon: IconButton(
                  icon: Icon(_showConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    color: AppColors.textLight, size: 20),
                  onPressed: () => setState(() => _showConfirm = !_showConfirm),
                ),
              )),

            const SizedBox(height: 36),
            FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 260),
              child: CustomButton(
                text: 'Actualizar Contraseña',
                isLoading: _isLoading,
                onPressed: _change,
                icon: Icons.check_rounded,
              )),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
