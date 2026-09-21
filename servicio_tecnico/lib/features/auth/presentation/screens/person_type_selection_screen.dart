import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

class PersonTypeSelectionScreen extends StatelessWidget {
  const PersonTypeSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final role = GoRouterState.of(context).uri.queryParameters['role'];

    return Scaffold(
      backgroundColor: AppColors.background,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: AppColors.softShadow,
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.primary, size: 18),
            onPressed: () => context.pop(),
          ),
        ),
      ),
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.primary.withOpacity(0.05),
              Colors.white,
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                const Text(
                  'Tipo de Contribuyente',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  '¿Cómo se registra\nen el sistema?',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Esta información es necesaria para la emisión de comprobantes y validación fiscal.',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 48),
                Expanded(
                  child: Column(
                    children: [
                      _buildSelectionCard(
                        context: context,
                        title: 'Persona Natural',
                        description: 'Individuos sin empresa o trabajadores independientes (DNI).',
                        icon: Icons.person_outline_rounded,
                        onTap: () => context.push('/register/form?role=$role&type=natural'),
                        color: AppColors.primary,
                      ),
                      const SizedBox(height: 24),
                      _buildSelectionCard(
                        context: context,
                        title: 'Persona Jurídica',
                        description: 'Empresas constituidas, corporaciones y negocios (RUC).',
                        icon: Icons.business_rounded,
                        onTap: () => context.push('/register/form?role=$role&type=juridical'),
                        color: AppColors.textPrimary,
                        isSecondary: true,
                      ),
                    ],
                  ),
                ),
                const Center(
                  child: Text(
                    'Infraestructura Fiscal J&P • 2026',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textLight,
                      letterSpacing: 2,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSelectionCard({
    required BuildContext context,
    required String title,
    required String description,
    required IconData icon,
    required VoidCallback onTap,
    required Color color,
    bool isSecondary = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(
            color: isSecondary ? AppColors.border : AppColors.primary.withOpacity(0.1),
            width: 1,
          ),
          boxShadow: AppColors.premiumShadow,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: AppColors.primary.withOpacity(0.3),
            ),
          ],
        ),
      ),
    );
  }
}
