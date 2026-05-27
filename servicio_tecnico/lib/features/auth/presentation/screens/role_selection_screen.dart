import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import '../../../../core/theme/app_colors.dart';

class RoleSelectionScreen extends StatefulWidget {
  const RoleSelectionScreen({super.key});
  @override
  State<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends State<RoleSelectionScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _bgCtrl;

  @override
  void initState() {
    super.initState();
    _bgCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 8))..repeat();
  }

  @override
  void dispose() { _bgCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
              onPressed: () => context.pop(),
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          // Animated blue background
          AnimatedBuilder(
            animation: _bgCtrl,
            builder: (_, __) {
              final t = _bgCtrl.value;
              return Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color.lerp(const Color(0xFF1A56DB), const Color(0xFF0A1F6B), math.sin(t * math.pi).abs())!,
                      const Color(0xFF060D1F),
                    ],
                  ),
                ),
              );
            },
          ),

          // Floating orbs
          AnimatedBuilder(
            animation: _bgCtrl,
            builder: (_, __) {
              final t = _bgCtrl.value * 2 * math.pi;
              return Stack(children: [
                Positioned(
                  top: -60 + math.sin(t) * 20,
                  right: -80 + math.cos(t) * 15,
                  child: Container(
                    width: 300, height: 300,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withOpacity(0.04),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 80 + math.cos(t) * 15,
                  left: -60 + math.sin(t) * 10,
                  child: Container(
                    width: 200, height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.accent.withOpacity(0.06),
                    ),
                  ),
                ),
              ]);
            },
          ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),

                  // Header
                  FadeInDown(
                    duration: const Duration(milliseconds: 700),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white.withOpacity(0.2)),
                          ),
                          child: Text(
                            'BIENVENIDO A J&P',
                            style: GoogleFonts.outfit(
                              fontSize: 11, fontWeight: FontWeight.w800,
                              color: Colors.white, letterSpacing: 2.5,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Selecciona tu\nperfil de usuario',
                          style: GoogleFonts.outfit(
                            fontSize: 36, fontWeight: FontWeight.w900,
                            color: Colors.white, letterSpacing: -1, height: 1.1,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Para brindarte la mejor experiencia técnica.',
                          style: GoogleFonts.outfit(
                            fontSize: 14, color: Colors.white60, height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 36),

                  // Cards
                  Expanded(
                    child: Column(
                      children: [
                        FadeInUp(
                          duration: const Duration(milliseconds: 600),
                          delay: const Duration(milliseconds: 200),
                          child: _RoleCard(
                            title: 'Proveedor Técnico',
                            description: 'Ofrece servicios especializados y gestiona sucursales.',
                            icon: Icons.engineering_rounded,
                            features: ['Gestión de citas', 'Mapa de cobertura', 'Chat con clientes'],
                            isPrimary: true,
                            onTap: () => context.push('/register/type-selection?role=tech'),
                          ),
                        ),
                        const SizedBox(height: 16),
                        FadeInUp(
                          duration: const Duration(milliseconds: 600),
                          delay: const Duration(milliseconds: 350),
                          child: _RoleCard(
                            title: 'Cliente Final',
                            description: 'Solicita soporte técnico y adquiere repuestos originales.',
                            icon: Icons.person_rounded,
                            features: ['Técnicos cercanos', 'Tiendas autorizadas', 'Pagos seguros'],
                            isPrimary: false,
                            onTap: () => context.push('/register/type-selection?role=client'),
                          ),
                        ),
                      ],
                    ),
                  ),

                  FadeIn(
                    delay: const Duration(milliseconds: 700),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Center(
                        child: Text(
                          'J&P Premium Service • v6.0',
                          style: GoogleFonts.outfit(
                            fontSize: 11, color: Colors.white38, letterSpacing: 1.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleCard extends StatefulWidget {
  final String title, description;
  final IconData icon;
  final List<String> features;
  final bool isPrimary;
  final VoidCallback onTap;

  const _RoleCard({
    required this.title, required this.description, required this.icon,
    required this.features, required this.isPrimary, required this.onTap,
  });

  @override
  State<_RoleCard> createState() => _RoleCardState();
}

class _RoleCardState extends State<_RoleCard> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 130));
    _scale = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) { _ctrl.reverse(); widget.onTap(); },
      onTapCancel: () => _ctrl.reverse(),
      child: AnimatedBuilder(
        animation: _scale,
        builder: (_, child) => Transform.scale(scale: _scale.value, child: child),
        child: Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: widget.isPrimary ? Colors.white : Colors.white.withOpacity(0.08),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: widget.isPrimary ? Colors.transparent : Colors.white.withOpacity(0.18),
              width: 1.5,
            ),
            boxShadow: widget.isPrimary
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.25),
                      blurRadius: 32,
                      offset: const Offset(0, 12),
                    ),
                  ]
                : [],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: widget.isPrimary
                          ? AppColors.heroGradient
                          : const LinearGradient(colors: [Colors.white24, Colors.white12]),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      widget.icon,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: widget.isPrimary
                          ? AppColors.primaryLight
                          : Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.arrow_forward_rounded,
                      color: widget.isPrimary ? AppColors.primary : Colors.white,
                      size: 18,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                widget.title,
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: widget.isPrimary ? AppColors.textPrimary : Colors.white,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                widget.description,
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  color: widget.isPrimary ? AppColors.textSecondary : Colors.white60,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: widget.features.map((f) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: widget.isPrimary
                        ? AppColors.primaryLight
                        : Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: widget.isPrimary
                          ? AppColors.primary.withOpacity(0.2)
                          : Colors.white.withOpacity(0.15),
                    ),
                  ),
                  child: Text(
                    f,
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: widget.isPrimary ? AppColors.primary : Colors.white,
                    ),
                  ),
                )).toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
