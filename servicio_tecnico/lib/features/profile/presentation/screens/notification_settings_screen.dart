import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/services/notification_service.dart';
import '../../../../core/providers/auth_provider.dart';
import 'package:provider/provider.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  final NotificationService _notificationService = NotificationService();
  bool _pushEnabled = true;
  bool _appointmentsReminders = true;
  bool _chatNotifications = true;
  bool _orderUpdates = true;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final res = await _notificationService.getSettings();
      if (res.success && res.data != null) {
        setState(() {
          _pushEnabled = res.data!['push_enabled'] == 1 || res.data!['push_enabled'] == true;
          _appointmentsReminders = res.data!['appointment_reminders'] == 1 || res.data!['appointment_reminders'] == true;
          _chatNotifications = res.data!['chat_notifications'] == 1 || res.data!['chat_notifications'] == true;
          _orderUpdates = res.data!['order_updates'] == 1 || res.data!['order_updates'] == true;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveSettings() async {
    setState(() => _isLoading = true);
    try {
      final res = await _notificationService.updateSettings(
        pushEnabled: _pushEnabled,
        appointmentsReminders: _appointmentsReminders,
        chatNotifications: _chatNotifications,
        orderUpdates: _orderUpdates,
      );
      
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res.success ? '✅ Preferencias guardadas correctamente' : '❌ Error al guardar'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Notificaciones', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _buildSectionHeader('CANALES ACTIVOS'),
              _buildSwitchTile(
                title: 'Notificaciones Push',
                subtitle: 'Recibe alertas instantáneas en tu dispositivo',
                value: _pushEnabled,
                onChanged: (val) => setState(() => _pushEnabled = val),
              ),
              
              const SizedBox(height: 24),
              _buildSectionHeader('ALERTAS DE SERVICIO'),
              _buildSwitchTile(
                title: auth.user?.role == 'tech' ? 'Nuevos Servicios y Citas' : 'Recordatorios de Citas',
                subtitle: auth.user?.role == 'tech' ? 'Recibe avisos de nuevos clientes y citas programadas' : 'Avisos antes de tus servicios agendados',
                value: _appointmentsReminders,
                onChanged: (val) => setState(() => _appointmentsReminders = val),
              ),
              _buildSwitchTile(
                title: auth.user?.role == 'store' ? 'Mensajes de Clientes' : 'Mensajes de Chat',
                subtitle: 'Notificar cuando alguien te escriba un mensaje',
                value: _chatNotifications,
                onChanged: (val) => setState(() => _chatNotifications = val),
              ),
              _buildSwitchTile(
                title: auth.user?.role == 'store' ? 'Nuevos Pedidos y Ventas' : 'Estado de Pedidos',
                subtitle: auth.user?.role == 'store' ? 'Alertas sobre compras realizadas en tu tienda' : 'Cambios en el estado de tus compras',
                value: _orderUpdates,
                onChanged: (val) => setState(() => _orderUpdates = val),
              ),

              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: _saveSettings,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 4,
                  shadowColor: AppColors.primary.withOpacity(0.4),
                ),
                child: Text('Guardar Preferencias', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
              ),
              const SizedBox(height: 20),
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
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: SwitchListTile(
        title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 15)),
        subtitle: Text(subtitle, style: GoogleFonts.outfit(fontSize: 12, color: AppColors.textSecondary)),
        value: value,
        onChanged: onChanged,
        activeColor: AppColors.primary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}