import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/user_service.dart';

class EditDataScreen extends StatefulWidget {
  const EditDataScreen({super.key});

  @override
  State<EditDataScreen> createState() => _EditDataScreenState();
}

class _EditDataScreenState extends State<EditDataScreen> {
  final UserService _userService = UserService();
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _idController = TextEditingController();
  final _phoneController = TextEditingController();
  final _locationController = TextEditingController();

  bool _isLoading = true;
  bool _isSaving = false;
  Map<String, dynamic>? _profileData;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final response = await _userService.getProfile();
      if (response.success && mounted) {
        final data = response.data;
        setState(() {
          _profileData = data;
          final bool isNat = (data?['person_type'] ?? '') == 'natural';
          if (isNat) {
            _nameController.text =
                '${data?['names'] ?? ''} ${data?['surnames'] ?? ''}'.trim();
            _idController.text = data?['dni'] ?? '';
          } else {
            _nameController.text = data?['company_name'] ?? '';
            _idController.text = data?['ruc'] ?? '';
          }
          _phoneController.text = data?['phone'] ?? '';
          _usernameController.text = data?['username'] ?? '';
          _locationController.text =
              data?['reference_address'] ?? data?['address'] ?? '';
          _isLoading = false;
        });
      } else if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateProfile() async {
    if (_usernameController.text.trim().isEmpty) {
      _showError('El nombre de usuario no puede estar vacío');
      return;
    }

    setState(() => _isSaving = true);
    try {
      final bool isNatural = (_profileData?['person_type'] ?? '') == 'natural';

      // Basic splitting for names/surnames if natural
      String? names;
      String? surnames;
      if (isNatural) {
        final parts = _nameController.text.trim().split(' ');
        if (parts.length > 1) {
          names = parts[0];
          surnames = parts.sublist(1).join(' ');
        } else {
          names = parts[0];
          surnames = '';
        }
      }

      final response = await _userService.updateProfile(
        username: _usernameController.text.trim(),
        phone: _phoneController.text,
        names: names,
        surnames: surnames,
        dni: isNatural ? _idController.text : null,
        companyName: !isNatural ? _nameController.text : null,
        ruc: !isNatural ? _idController.text : null,
        referenceAddress: _locationController.text,
      );

      if (mounted) {
        setState(() => _isSaving = false);
        if (response.success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Datos actualizados con éxito')),
          );
          context.pop();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response.message ?? 'Error al actualizar')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        _showError('Error de conexión');
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final isNatural = _profileData?['person_type'] == 'natural';

    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(height: 10),
              // Back Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: () => context.pop(),
                    icon: const Icon(
                      Icons.arrow_left,
                      color: Color(0xFF3B28FF),
                    ),
                    label: const Text(
                      'Regresar',
                      style: TextStyle(
                        color: Color(0xFF3B28FF),
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero),
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Logo
              Column(
                children: [
                  const Text(
                    'J&P',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 80,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF3B28FF),
                      height: 0.9,
                    ),
                  ),
                  const Text(
                    'PERIFÉRICOS  S.A.C',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF3B28FF),
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    '¡QUE SOPORTE!',
                    style: TextStyle(
                      color: Color(0xFF3B28FF),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 40),

              // Form
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Column(
                  children: [
                    _buildField(_usernameController, 'Nombre de Usuario'),
                    const SizedBox(height: 16),
                    _buildField(
                      _nameController,
                      isNatural ? 'Nombre Completo' : 'Nombre de Empresa',
                    ),
                    const SizedBox(height: 16),
                    _buildField(_idController, isNatural ? 'DNI' : 'RUC'),
                    const SizedBox(height: 16),
                    _buildField(_phoneController, 'Teléfono'),
                    const SizedBox(height: 16),
                    _buildField(
                      _locationController,
                      'Ubicación Cuartel General',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              // Update Button
              SizedBox(
                width: 200,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE8E8E8),
                    foregroundColor: const Color(0xFF3B28FF),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: _isSaving ? null : _updateProfile,
                  child: _isSaving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text(
                          'Actualizar Datos',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(TextEditingController controller, String hint) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFE8E8E8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          hintText: hint,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 16,
          ),
        ),
        style: const TextStyle(
          color: Color(0xFF3B28FF),
          fontWeight: FontWeight.w500,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}
