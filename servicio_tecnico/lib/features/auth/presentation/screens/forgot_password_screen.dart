import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:servicio_tecnico_app/core/services/auth_service.dart';
import '../../../../core/constants/assets.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/custom_button.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() { _emailCtrl.dispose(); super.dispose(); }

  Future<void> _send() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) { _snack('Por favor ingresa tu correo'); return; }
    setState(() => _isLoading = true);
    try {
      final res = await AuthService().forgotPassword(email: email);
      if (mounted) {
        if (res.success) {
          _snack('Código enviado con éxito', isError: false);
          context.push('/forgot-password/verify?email=$email');
        } else {
          _snack(res.message ?? 'Error al enviar el correo');
        }
      }
    } catch (e) {
      if (mounted) _snack('Error de conexión');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
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
        backgroundColor: Colors.transparent,
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
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 32),
              FadeInDown(
                duration: const Duration(milliseconds: 700),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withOpacity(0.06) : Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: AppColors.cardShadow,
                      border: Border.all(color: isDark ? Colors.white.withOpacity(0.08) : AppColors.border),
                    ),
                    child: Image.asset(AppAssets.logo, height: 60, fit: BoxFit.contain),
                  ),
                ),
              ),
              const SizedBox(height: 40),
              FadeInLeft(
                duration: const Duration(milliseconds: 600),
                delay: const Duration(milliseconds: 150),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('¿Olvidaste tu', style: GoogleFonts.outfit(
                      fontSize: 34, fontWeight: FontWeight.w900,
                      color: AppColors.getTextPrimary(context), letterSpacing: -1, height: 1.1)),
                    Text('contraseña?', style: GoogleFonts.outfit(
                      fontSize: 34, fontWeight: FontWeight.w900,
                      color: AppColors.primary, letterSpacing: -1, height: 1.1)),
                    const SizedBox(height: 10),
                    Text('Ingresa tu correo y te enviaremos un código de verificación.',
                      style: GoogleFonts.outfit(fontSize: 14, color: AppColors.getTextSecondary(context), height: 1.5)),
                  ],
                ),
              ),
              const SizedBox(height: 36),
              FadeInUp(
                duration: const Duration(milliseconds: 600),
                delay: const Duration(milliseconds: 300),
                child: CustomTextField(
                  label: 'Correo Electrónico',
                  hint: 'ejemplo@correo.com',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: const Icon(Icons.email_outlined, color: AppColors.primary, size: 20),
                ),
              ),
              const SizedBox(height: 32),
              FadeInUp(
                duration: const Duration(milliseconds: 600),
                delay: const Duration(milliseconds: 420),
                child: CustomButton(
                  text: 'Enviar Código',
                  isLoading: _isLoading,
                  onPressed: _send,
                  icon: Icons.send_rounded,
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
