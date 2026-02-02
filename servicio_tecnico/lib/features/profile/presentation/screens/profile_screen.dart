import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/theme/app_colors.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final UserService _userService = UserService();
  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final response = await _userService.getProfile();
      if (response.success) {
        setState(() {
          _userData = response.data;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response.message;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error al cargar perfil';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Text(_errorMessage!)),
      );
    }

    final user = _userData!;
    final name = user['person_type'] == 'natural'
        ? '${user['names'] ?? ''} ${user['surnames'] ?? ''}'.trim()
        : user['company_name'] ?? 'Usuario';
    final dniRuc = user['dni'] ?? user['ruc'] ?? 'N/A';
    final email = user['email'] ?? 'N/A';
    final profileImg = user['profile_image_url'] ?? '';

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: () => context.pop(),
                    icon: const Icon(
                      Icons.arrow_left,
                      color: AppColors.primary,
                    ),
                    label: const Text(
                      'Regresar',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary, width: 4),
                  ),
                  child: CircleAvatar(
                    radius: 75,
                    backgroundColor: Colors.white,
                    backgroundImage: profileImg.isNotEmpty
                        ? NetworkImage(profileImg)
                        : null,
                    child: profileImg.isEmpty
                        ? const Icon(
                            Icons.person_outline,
                            color: AppColors.primary,
                            size: 80,
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  name,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  dniRuc,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  email,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 18,
                    decoration: TextDecoration.underline,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 48),
                const Text(
                  'Ultimos servicios:',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 20,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8E8E8),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Column(
                    children: [
                      _buildServiceItem('Nombre Técnico Ejemplo'),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: 200,
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFCDCDCD),
                            foregroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'Mostrar Más',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 60),
                SizedBox(
                  width: double.infinity,
                  height: 60,
                  child: ElevatedButton(
                    onPressed: () => context.go('/login'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFCDCDCD),
                      foregroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Cerrar Sesión',
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
      ),
    );
  }

  Widget _buildServiceItem(String name) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primary, width: 2),
            ),
            child: const Icon(
              Icons.person_outline,
              color: AppColors.primary,
              size: 32,
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Row(
                children: List.generate(
                  5,
                  (index) => const Icon(
                    Icons.star,
                    color: Color(0xFFFFD700),
                    size: 22,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
