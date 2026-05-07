import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:servicio_tecnico_app/core/services/auth_service.dart';
import 'package:servicio_tecnico_app/core/services/local_cache_service.dart';
import '../../../../core/constants/assets.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/custom_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Fondo con gradiente premium
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFFEBE9FF), // Primary Light
                  Colors.white,
                ],
                stops: [0.0, 0.4],
              ),
            ),
          ),
          
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 60),
                  
                  // Logo con animación y sombra suave
                  FadeInDown(
                    duration: const Duration(milliseconds: 1000),
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: AppColors.softShadow,
                        ),
                        child: Image.asset(
                          AppAssets.logo,
                          height: 100,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 48),

                  FadeInUp(
                    duration: const Duration(milliseconds: 800),
                    delay: const Duration(milliseconds: 200),
                    child: Column(
                      children: [
                        Text(
                          'Bienvenido de nuevo',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Ingresa tus credenciales para continuar',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 48),

                  FadeInUp(
                    duration: const Duration(milliseconds: 800),
                    delay: const Duration(milliseconds: 400),
                    child: Column(
                      children: [
                        CustomTextField(
                          label: 'Correo Electrónico',
                          hint: 'ejemplo@correo.com',
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          prefixIcon: const Icon(Icons.email_outlined, color: AppColors.primary, size: 20),
                        ),
                        const SizedBox(height: 24),
                        CustomTextField(
                          label: 'Contraseña',
                          hint: '••••••••',
                          controller: _passwordController,
                          isPassword: !_isPasswordVisible,
                          prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.primary, size: 20),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _isPasswordVisible
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: AppColors.textLight,
                              size: 20,
                            ),
                            onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),
                  
                  FadeIn(
                    delay: const Duration(milliseconds: 600),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => context.push('/forgot-password'),
                        child: Text(
                          '¿Olvidaste tu contraseña?',
                          style: GoogleFonts.outfit(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 40),

                  FadeInUp(
                    duration: const Duration(milliseconds: 800),
                    delay: const Duration(milliseconds: 600),
                    child: CustomButton(
                      text: 'Iniciar Sesión',
                      isLoading: _isLoading,
                      onPressed: _handleLogin,
                    ),
                  ),

                  const SizedBox(height: 32),
                  
                  FadeInUp(
                    duration: const Duration(milliseconds: 800),
                    delay: const Duration(milliseconds: 800),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '¿No tienes cuenta? ',
                          style: GoogleFonts.outfit(
                            color: AppColors.textSecondary,
                            fontSize: 15,
                          ),
                        ),
                        GestureDetector(
                          onTap: () => context.push('/role-selection'),
                          child: Text(
                            'Regístrate aquí',
                            style: GoogleFonts.outfit(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      _showError('Por favor completa todos los campos');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authService = AuthService();
      final response = await authService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (response.success && response.data != null) {
        final role = response.data!['role'];
        final userId = response.data!['id'];
        await LocalCacheService.saveRole(role);
        if (userId != null) {
          await LocalCacheService.saveUserId(userId);
        }
        await LocalCacheService.saveLastActivity(); // Initialize activity tracking
        
        if (mounted) {
          if (role == 'client') {
            context.go('/client-home');
          } else if (role == 'tech') {
            context.go('/home');
          } else if (role == 'store') {
            context.go('/store-home');
          }
        }
      } else {
        _showError(response.message ?? 'Crendeciales inválidas');
      }
    } catch (e) {
      _showError('Error de conexión');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: GoogleFonts.outfit()),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}

