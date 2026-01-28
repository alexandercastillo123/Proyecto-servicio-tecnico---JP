import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/user_service.dart';

class ProviderProfileScreen extends StatefulWidget {
  const ProviderProfileScreen({super.key});

  @override
  State<ProviderProfileScreen> createState() => _ProviderProfileScreenState();
}

class _ProviderProfileScreenState extends State<ProviderProfileScreen> {
  final UserService _userService = UserService();
  Map<String, dynamic>? _profileData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final response = await _userService.getProfile();
      if (response.success && mounted) {
        setState(() {
          _profileData = response.data;
          _isLoading = false;
        });
      } else if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final Map<String, dynamic> data = _profileData ?? {};
    final bool isNatural = (data['person_type'] ?? '') == 'natural';

    final String name = isNatural
        ? '${data['names'] ?? ''} ${data['surnames'] ?? ''}'.trim()
        : (data['company_name'] ?? 'TECNICO EMPRESA');
    final String idNumber = isNatural
        ? (data['dni'] ?? 'DNI')
        : (data['ruc'] ?? 'RUC');
    final String phone = data['phone'] ?? 'TELEFONO';
    final String location =
        data['reference_address'] ?? data['address'] ?? 'UBICACIÓN';

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

              // Profile Icon with Pencil
              Center(
                child: Stack(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(30),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF3B28FF),
                          width: 4,
                        ),
                      ),
                      child: const Icon(
                        Icons.person_outline,
                        color: Color(0xFF3B28FF),
                        size: 200,
                      ),
                    ),
                    Positioned(
                      bottom: 20,
                      right: 15,
                      child: GestureDetector(
                        onTap: () => context.push('/change-photo'),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Color(0xFF3B28FF),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.edit,
                            color: Colors.white,
                            size: 40,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 30),

              // Tech Info
              Text(
                name.toUpperCase(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF3B28FF),
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                idNumber,
                style: const TextStyle(
                  color: Color(0xFF3B28FF),
                  fontSize: 20,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                phone,
                style: const TextStyle(
                  color: Color(0xFF3B28FF),
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  location.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFF3B28FF),
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),

              const SizedBox(height: 60),

              // Action Buttons
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 50),
                child: Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD9D9D9),
                          foregroundColor: const Color(0xFF3B28FF),
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () async {
                          await context.push('/edit-data');
                          if (mounted) _loadProfile(); // Refresh after edit
                        },
                        child: const Text(
                          'Editar Datos',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD9D9D9),
                          foregroundColor: const Color(0xFF3B28FF),
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () => context.go('/login'),
                        child: const Text(
                          'Cerrar Sesión',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
