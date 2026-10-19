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
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Configuración',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildSectionHeader('Cuenta y Seguridad'),
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
            textColor: Colors.redAccent,
            onTap: () => _showDeleteAccountConfirm(context),
          ),
          
          const SizedBox(height: 24),
          _buildSectionHeader('Preferencias'),
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
          _buildSectionHeader('Legal y Soporte'),
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

          const SizedBox(height: 40),
          ElevatedButton(
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              if (context.mounted) context.go('/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent.withOpacity(0.1),
              foregroundColor: Colors.redAccent,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Colors.redAccent, width: 1),
              ),
            ),
            child: Text(
              'Cerrar Sesión',
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12, top: 8),
      child: Text(
        title,
        style: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.primary.withOpacity(0.6),
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildThemeTile(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.getSurfaceColor(context),
        borderRadius: BorderRadius.circular(16),
        boxShadow: Theme.of(context).brightness == Brightness.dark ? [] : AppColors.softShadow,
      ),
      child: SwitchListTile(
        secondary: const Icon(Icons.dark_mode_outlined, color: AppColors.primary),
        title: Text(
          'Modo Oscuro',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: AppColors.getTextPrimary(context),
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
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.getSurfaceColor(context),
        borderRadius: BorderRadius.circular(16),
        boxShadow: Theme.of(context).brightness == Brightness.dark ? [] : AppColors.softShadow,
      ),
      child: ListTile(
        leading: Icon(icon, color: textColor ?? AppColors.primary),
        title: Text(
          title,
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: textColor ?? AppColors.getTextPrimary(context),
          ),
        ),
        subtitle: Text(
          subtitle,
          style: GoogleFonts.outfit(
            fontSize: 12, 
            color: AppColors.getTextSecondary(context)
          ),
        ),
        trailing: const Icon(Icons.chevron_right, size: 20, color: AppColors.textLight),
        onTap: onTap,
      ),
    );
  }

  void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Próximamente disponible')),
    );
  }

  void _showDeleteAccountConfirm(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('¿Eliminar cuenta?'),
        content: const Text('Esta acción borrará todos tus datos, citas e historial de forma permanente.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('CANCELAR')),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('ELIMINAR', style: TextStyle(color: Colors.red)),
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
      applicationIcon: const Icon(Icons.settings_suggest, size: 40, color: AppColors.primary),
      children: [
        const Text('Plataforma integral para servicios técnicos y tiendas especializadas.'),
      ],
    );
  }

  static const String _termsContent = '''
1. ACEPTACIÓN DE LOS TÉRMINOS
Al acceder o utilizar la plataforma J&P, usted acepta estar sujeto a estos Términos y Condiciones.

2. DESCRIPCIÓN DEL SERVICIO
J&P es un intermediario que conecta a clientes con técnicos independientes y tiendas de servicio técnico. No somos responsables directos por la calidad de los repuestos o mano de obra, aunque mediamos en disputas.

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
Sus datos se utilizan para:
- Conectar técnicos con clientes.
- Procesar pagos de forma segura.
- Enviar notificaciones de servicio.

3. COMPARTIR INFORMACIÓN
Solo compartimos sus datos con la contraparte del servicio (técnico/cliente) una vez confirmada la cita.

4. SEGURIDAD
Implementamos medidas técnicas para proteger su información contra accesos no autorizados.
''';
}
