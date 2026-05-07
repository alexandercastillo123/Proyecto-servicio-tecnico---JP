import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/services/api_service.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  final ApiService _apiService = ApiService();
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
      final response = await _apiService.get<Map<String, dynamic>>(
        '${_apiService.getToken() != null ? "/api/notifications/settings" : ""}',
        requiresAuth: true,
      );
      
      // Since I don't have the ApiConstants for notifications yet, I'll use a hardcoded path for now
      // or just use the raw string.
      
      final res = await _apiService.get<Map<String, dynamic>>(
        '/api/notifications/settings',
        requiresAuth: true,
        fromJson: (data) => data as Map<String, dynamic>
      );

      if (res.success && res.data != null) {
        setState(() {
          _appointmentsReminders = res.data!['appointments_reminders'] == 1 || res.data!['appointments_reminders'] == true;
          _chatNotifications = res.data!['chat_notifications'] == 1 || res.data!['chat_notifications'] == true;
          _orderUpdates = res.data!['order_updates'] == 1 || res.data!['order_updates'] == true;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveSettings() async {
    setState(() => _isLoading = true);
    try {
      await _apiService.put<Map<String, dynamic>>(
        '/api/notifications/settings',
        {
          'appointmentsReminders': _appointmentsReminders,
          'chatNotifications': _chatNotifications,
          'orderUpdates': _orderUpdates,
        },
        requiresAuth: true,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Configuración guardada')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Configuración de Notificaciones', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _buildSwitchTile(
                title: 'Recordatorios de Citas',
                subtitle: 'Recibe avisos 30 minutos antes de tus servicios',
                value: _appointmentsReminders,
                onChanged: (val) => setState(() => _appointmentsReminders = val),
              ),
              const Divider(),
              _buildSwitchTile(
                title: 'Notificaciones de Chat',
                subtitle: 'Avisos cuando recibas mensajes nuevos',
                value: _chatNotifications,
                onChanged: (val) => setState(() => _chatNotifications = val),
              ),
              const Divider(),
              _buildSwitchTile(
                title: 'Actualizaciones de Pedidos',
                subtitle: 'Seguimiento de tus compras y ventas',
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
                ),
                child: Text('Guardar Cambios', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ],
          ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: GoogleFonts.outfit(fontSize: 13)),
      value: value,
      onChanged: onChanged,
      activeColor: AppColors.primary,
    );
  }
}
