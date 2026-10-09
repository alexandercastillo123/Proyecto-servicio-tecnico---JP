import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/services/user_service.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final UserService _userService = UserService();
  final _newPassController = TextEditingController();
  final _confirmPassController = TextEditingController();
  bool _isLoading = false;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  Future<void> _changePassword() async {
    final newPass = _newPassController.text;
    final confirmPass = _confirmPassController.text;

    if (newPass.isEmpty || confirmPass.isEmpty) {
      _showMsg('Por favor completa todos los campos');
      return;
    }
    if (newPass.length < 6) {
      _showMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPass != confirmPass) {
      _showMsg('Las contraseñas no coinciden');
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('¿Confirmar cambio?'),
        content: const Text('¿Estás seguro de que deseas cambiar tu contraseña?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('CANCELAR')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('CAMBIAR')),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);
    try {
      final res = await _userService.changePassword(newPass);
      if (res.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('✅ Contraseña actualizada con éxito')),
          );
          context.pop();
        }
      } else {
        _showMsg(res.message ?? 'Error al actualizar contraseña');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showMsg(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Cambiar Contraseña', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.lock_reset_rounded, size: 80, color: AppColors.primary),
            const SizedBox(height: 16),
            Text(
              'Actualiza tu seguridad',
              style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Ingresa tu nueva contraseña y confírmala para actualizar tu acceso.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 32),
            _buildField(
              _newPassController,
              'Nueva Contraseña',
              _obscureNew,
              () => setState(() => _obscureNew = !_obscureNew),
            ),
            const SizedBox(height: 16),
            _buildField(
              _confirmPassController,
              'Confirmar Contraseña',
              _obscureConfirm,
              () => setState(() => _obscureConfirm = !_obscureConfirm),
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _changePassword,
                style: ElevatedButton.styleFrom(
                  elevation: 4,
                  shadowColor: AppColors.primary.withOpacity(0.3),
                ),
                child: _isLoading 
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text('Actualizar Contraseña', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(TextEditingController controller, String label, bool obscure, VoidCallback onToggle) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.lock_outline),
        suffixIcon: IconButton(
          icon: Icon(obscure ? Icons.visibility_off : Icons.visibility),
          onPressed: onToggle,
        ),
      ),
    );
  }
}
