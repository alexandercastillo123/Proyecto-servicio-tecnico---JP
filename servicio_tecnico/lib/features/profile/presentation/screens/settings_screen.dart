import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/theme_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppColors.getBackgroundColor(context),
      appBar: AppBar(
        title: Text(
          'Configuración',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800),
        ),
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: Container(
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.white.withOpacity(0.08)
                  : AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(
                Icons.arrow_back_ios_new_rounded,
                color: AppColors.primary,
                size: 18,
              ),
              onPressed: () => context.pop(),
            ),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildSectionHeader(context, 'Cuenta y Seguridad'),
          _buildSettingsTile(
            context,
            icon: Icons.person_outline_rounded,
            title: 'Información del Perfil',
            subtitle: 'Edita tus datos personales y de contacto',
            onTap: () => context.push('/edit-data'),
          ),
          _buildSettingsTile(
            context,
            icon: Icons.lock_outline_rounded,
            title: 'Cambiar Contraseña',
            subtitle: 'Actualiza tus credenciales de acceso',
            onTap: () => context.push('/change-password'),
          ),
          _buildSettingsTile(
            context,
            icon: Icons.delete_forever_outlined,
            title: 'Eliminar Cuenta',
            subtitle: 'Esta acción es irreversible',
            textColor: AppColors.error,
            onTap: () => _showDeleteAccountConfirm(context),
          ),

          const SizedBox(height: 24),
          _buildSectionHeader(context, 'Preferencias'),
          _buildSettingsTile(
            context,
            icon: Icons.notifications_none_rounded,
            title: 'Notificaciones',
            subtitle: 'Gestiona alertas, sonidos y avisos',
            onTap: () => context.push('/notification-settings'),
          ),
          _buildThemeTile(context),
          _buildSettingsTile(
            context,
            icon: Icons.language_rounded,
            title: 'Idioma',
            subtitle: 'Español (Perú)',
            onTap: () => _showComingSoon(context),
          ),

          const SizedBox(height: 24),
          _buildSectionHeader(context, 'Legal y Soporte'),
          _buildSettingsTile(
            context,
            icon: Icons.description_outlined,
            title: 'Términos y Condiciones',
            subtitle: 'Reglas de uso de la plataforma',
            onTap: () => context.push('/legal', extra: {
              'title': 'Términos y Condiciones',
              'content': _termsContent,
            }),
          ),
          _buildSettingsTile(
            context,
            icon: Icons.privacy_tip_outlined,
            title: 'Política de Privacidad',
            subtitle: 'Cómo protegemos tus datos',
            onTap: () => context.push('/legal', extra: {
              'title': 'Política de Privacidad',
              'content': _privacyContent,
            }),
          ),
          _buildSettingsTile(
            context,
            icon: Icons.info_outline_rounded,
            title: 'Sobre J&P',
            subtitle: 'Versión 1.0.0 (Beta)',
            onTap: () => _showAboutDialog(context),
          ),

          const SizedBox(height: 32),

          // Logout button
          Container(
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.06),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.error.withOpacity(0.2),
              ),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () async {
                  await context.read<AuthProvider>().logout();
                  if (context.mounted) context.go('/login');
                },
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.logout_rounded,
                        color: AppColors.error,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Cerrar Sesión',
                        style: GoogleFonts.outfit(
                          color: AppColors.error,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12, top: 4),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.outfit(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: AppColors.primary.withOpacity(0.7),
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildThemeTile(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.06)
              : AppColors.border,
        ),
        boxShadow: isDark ? [] : AppColors.softShadow,
      ),
      child: SwitchListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        secondary: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            Icons.dark_mode_outlined,
            color: AppColors.primary,
            size: 18,
          ),
        ),
        title: Text(
          'Modo Oscuro',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w700,
            color: AppColors.getTextPrimary(context),
            fontSize: 15,
          ),
        ),
        subtitle: Text(
          'Cambia la apariencia de la app',
          style: GoogleFonts.outfit(
            fontSize: 12,
            color: AppColors.getTextSecondary(context),
          ),
        ),
        value: themeProvider.isDarkMode,
        onChanged: (val) => themeProvider.toggleTheme(val),
        activeColor: AppColors.primary,
      ),
    );
  }

  Widget _buildSettingsTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color? textColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = textColor ?? AppColors.primary;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: textColor != null
              ? textColor.withOpacity(0.15)
              : (isDark ? Colors.white.withOpacity(0.06) : AppColors.border),
        ),
        boxShadow: isDark ? [] : AppColors.softShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 18),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w700,
                          color: textColor ?? AppColors.getTextPrimary(context),
                          fontSize: 15,
                        ),
                      ),
                      Text(
                        subtitle,
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          color: AppColors.getTextSecondary(context),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.textLight,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Próximamente disponible',
          style: GoogleFonts.outfit(),
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _showDeleteAccountConfirm(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          '¿Eliminar cuenta?',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800),
        ),
        content: Text(
          'Esta acción borrará todos tus datos, citas e historial de forma permanente.',
          style: GoogleFonts.outfit(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancelar',
              style: GoogleFonts.outfit(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Eliminar',
              style: GoogleFonts.outfit(
                color: AppColors.error,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showAboutDialog(
      context: context,
      applicationName: 'J&P Service Platform',
      applicationVersion: '1.0.0-beta',
      applicationIcon: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(
          Icons.settings_suggest_rounded,
          size: 32,
          color: Colors.white,
        ),
      ),
      children: [
        Text(
          'Plataforma integral para servicios técnicos y tiendas especializadas.',
          style: GoogleFonts.outfit(color: AppColors.textSecondary),
        ),
      ],
    );
  }

  static const String _termsContent = '''
1. ACEPTACIÓN DE LOS TÉRMINOS
Al acceder o utilizar la plataforma J&P, usted acepta estar sujeto a estos Términos y Condiciones.

2. DESCRIPCIÓN DEL SERVICIO
J&P es un intermediario que conecta a clientes con técnicos independientes y tiendas de servicio técnico.

3. REGISTRO DE USUARIO
Usted debe proporcionar información verídica y mantener la seguridad de su cuenta.

4. PAGOS Y COMISIONES
Los pagos realizados a través de Culqi están sujetos a sus propias políticas de seguridad.

5. PROPIEDAD INTELECTUAL
Todos los logos y marcas son propiedad de J&P o sus respectivos dueños.
''';

  static const String _privacyContent = '''
1. RECOLECCIÓN DE DATOS
Recopilamos información personal como nombre, DNI/RUC, dirección y ubicación para facilitar los servicios.

2. USO DE LA INFORMACIÓN
Sus datos se utilizan para conectar técnicos con clientes, procesar pagos y enviar notificaciones.

3. COMPARTIR INFORMACIÓN
Solo compartimos sus datos con la contraparte del servicio una vez confirmada la cita.

4. SEGURIDAD
Implementamos medidas técnicas para proteger su información contra accesos no autorizados.
''';
}
