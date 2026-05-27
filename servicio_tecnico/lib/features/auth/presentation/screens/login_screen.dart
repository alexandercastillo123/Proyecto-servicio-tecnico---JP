import 'dart:math' as math;
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

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _showPass  = false;
  bool _isLoading = false;

  late AnimationController _orbitCtrl;
  late AnimationController _waveCtrl;
  late AnimationController _shimmerCtrl;

  @override
  void initState() {
    super.initState();
    _orbitCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 12))..repeat();
    _waveCtrl  = AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat(reverse: true);
    _shimmerCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat();
  }

  @override
  void dispose() {
    _orbitCtrl.dispose();
    _waveCtrl.dispose();
    _shimmerCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final h = MediaQuery.of(context).size.height;

    return Scaffold(
      body: Stack(
        children: [
          // ── Deep blue background ─────────────────────────────────────
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark
                    ? [const Color(0xFF060D1F), const Color(0xFF0A1F6B), const Color(0xFF060D1F)]
                    : [const Color(0xFF1A56DB), const Color(0xFF0A1F6B), const Color(0xFF060D1F)],
                stops: const [0.0, 0.45, 1.0],
              ),
            ),
          ),

          // ── Orbiting circles ────────────────────────────────────────
          AnimatedBuilder(
            animation: _orbitCtrl,
            builder: (_, __) {
              final angle = _orbitCtrl.value * 2 * math.pi;
              return Stack(
                children: [
                  Positioned(
                    top: h * 0.08 + math.sin(angle) * 30,
                    right: -60 + math.cos(angle) * 20,
                    child: _glowCircle(260, Colors.white.withOpacity(0.04)),
                  ),
                  Positioned(
                    top: h * 0.15 + math.cos(angle) * 20,
                    left: -80 + math.sin(angle) * 15,
                    child: _glowCircle(180, AppColors.accent.withOpacity(0.07)),
                  ),
                  Positioned(
                    top: h * 0.28 + math.sin(angle + 1) * 12,
                    right: 40 + math.cos(angle + 1) * 18,
                    child: _glowCircle(80, Colors.white.withOpacity(0.06)),
                  ),
                ],
              );
            },
          ),

          // ── Wave divider ─────────────────────────────────────────────
          AnimatedBuilder(
            animation: _waveCtrl,
            builder: (_, __) {
              final offset = _waveCtrl.value * 20;
              return Positioned(
                top: h * 0.42 - offset,
                left: 0,
                right: 0,
                child: CustomPaint(
                  size: Size(MediaQuery.of(context).size.width, 60),
                  painter: _WavePainter(isDark ? const Color(0xFF060D1F) : Colors.white),
                ),
              );
            },
          ),

          // ── White card bottom ────────────────────────────────────────
          Positioned(
            top: h * 0.44,
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(color: isDark ? const Color(0xFF060D1F) : Colors.white),
          ),

          // ── Content ──────────────────────────────────────────────────
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(height: h * 0.05),

                  // Logo
                  FadeInDown(
                    duration: const Duration(milliseconds: 800),
                    child: Center(
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withOpacity(0.35),
                                  blurRadius: 32,
                                  offset: const Offset(0, 12),
                                ),
                              ],
                            ),
                            child: Image.asset(AppAssets.logo, height: 64, fit: BoxFit.contain),
                          ),
                          const SizedBox(height: 14),
                          // Shimmer badge
                          AnimatedBuilder(
                            animation: _shimmerCtrl,
                            builder: (_, __) {
                              return ShaderMask(
                                shaderCallback: (bounds) => LinearGradient(
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                  colors: const [
                                    Colors.white54,
                                    Colors.white,
                                    Colors.white54,
                                  ],
                                  stops: [
                                    (_shimmerCtrl.value - 0.3).clamp(0.0, 1.0),
                                    _shimmerCtrl.value.clamp(0.0, 1.0),
                                    (_shimmerCtrl.value + 0.3).clamp(0.0, 1.0),
                                  ],
                                ).createShader(bounds),
                                child: Text(
                                  'J&P SERVICE PLATFORM',
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                    letterSpacing: 2.5,
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),

                  SizedBox(height: h * 0.05),

                  // Title
                  FadeInLeft(
                    duration: const Duration(milliseconds: 700),
                    delay: const Duration(milliseconds: 200),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Bienvenido',
                          style: GoogleFonts.outfit(
                            fontSize: 38,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : AppColors.textPrimary,
                            letterSpacing: -1.2,
                            height: 1.0,
                          ),
                        ),
                        Row(
                          children: [
                            Text(
                              'de nuevo ',
                              style: GoogleFonts.outfit(
                                fontSize: 38,
                                fontWeight: FontWeight.w900,
                                color: AppColors.primary,
                                letterSpacing: -1.2,
                                height: 1.1,
                              ),
                            ),
                            const Text('👋', style: TextStyle(fontSize: 32)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Ingresa tus credenciales para continuar',
                          style: GoogleFonts.outfit(
                            fontSize: 14,
                            color: AppColors.getTextSecondary(context),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Fields
                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    delay: const Duration(milliseconds: 350),
                    child: CustomTextField(
                      label: 'Correo Electrónico',
                      hint: 'ejemplo@correo.com',
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      prefixIcon: const Icon(Icons.email_outlined, color: AppColors.primary, size: 20),
                    ),
                  ),
                  const SizedBox(height: 16),
                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    delay: const Duration(milliseconds: 450),
                    child: CustomTextField(
                      label: 'Contraseña',
                      hint: '••••••••',
                      controller: _passwordCtrl,
                      isPassword: !_showPass,
                      prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.primary, size: 20),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _showPass ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          color: AppColors.textLight,
                          size: 20,
                        ),
                        onPressed: () => setState(() => _showPass = !_showPass),
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),
                  FadeIn(
                    delay: const Duration(milliseconds: 500),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => context.push('/forgot-password'),
                        child: Text(
                          '¿Olvidaste tu contraseña?',
                          style: GoogleFonts.outfit(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    delay: const Duration(milliseconds: 550),
                    child: CustomButton(
                      text: 'Iniciar Sesión',
                      isLoading: _isLoading,
                      onPressed: _handleLogin,
                      icon: Icons.arrow_forward_rounded,
                    ),
                  ),

                  const SizedBox(height: 28),

                  FadeIn(
                    delay: const Duration(milliseconds: 700),
                    child: Row(
                      children: [
                        Expanded(child: Divider(color: AppColors.getDividerColor(context))),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          child: Text(
                            '¿No tienes cuenta?',
                            style: GoogleFonts.outfit(color: AppColors.getTextSecondary(context), fontSize: 13),
                          ),
                        ),
                        Expanded(child: Divider(color: AppColors.getDividerColor(context))),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    delay: const Duration(milliseconds: 800),
                    child: CustomButton(
                      text: 'Crear cuenta',
                      isSecondary: true,
                      onPressed: () => context.push('/role-selection'),
                    ),
                  ),

                  const SizedBox(height: 40),
                  FadeIn(
                    delay: const Duration(milliseconds: 900),
                    child: Center(
                      child: Text(
                        'J&P Premium Service • v6.0',
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          color: AppColors.textLight,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _glowCircle(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }

  Future<void> _handleLogin() async {
    if (_emailCtrl.text.isEmpty || _passwordCtrl.text.isEmpty) {
      _showError('Por favor, ingresa tu correo y contraseña.');
      return;
    }
    setState(() => _isLoading = true);
    try {
      final res = await AuthService().login(
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
      );
      if (res.success && res.data != null) {
        final role   = res.data!['role'];
        final userId = res.data!['id'];
        await LocalCacheService.saveRole(role);
        if (userId != null) await LocalCacheService.saveUserId(userId);
        await LocalCacheService.saveLastActivity();
        if (mounted) {
          if (role == 'client')     context.go('/client-home');
          else if (role == 'tech')  context.go('/home');
          else if (role == 'store') context.go('/store-home');
        }
      } else {
        _showError(res.message ?? 'Correo o contraseña incorrectos.');
      }
    } catch (_) {
      _showError('Sin conexión. Verifica tu internet.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        const Icon(Icons.error_outline, color: Colors.white, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text(msg, style: GoogleFonts.outfit(fontSize: 13))),
      ]),
      backgroundColor: AppColors.error,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      margin: const EdgeInsets.all(16),
    ));
  }
}

class _WavePainter extends CustomPainter {
  final Color color;
  _WavePainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final path = Path()
      ..moveTo(0, 40)
      ..quadraticBezierTo(size.width * 0.25, 0, size.width * 0.5, 30)
      ..quadraticBezierTo(size.width * 0.75, 60, size.width, 20)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_WavePainter old) => old.color != color;
}
