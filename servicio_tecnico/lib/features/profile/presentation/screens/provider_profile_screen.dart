import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/theme/app_colors.dart';

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
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final Map<String, dynamic> data = _profileData ?? {};
    final bool isNatural = (data['person_type'] ?? '') == 'natural';
    final String name = isNatural
        ? '${data['names'] ?? ''} ${data['surnames'] ?? ''}'.trim()
        : (data['company_name'] ?? 'TECNICO EMPRESA');
    final String idNumber = isNatural ? (data['dni'] ?? 'DNI') : (data['ruc'] ?? 'RUC');
    final String phone = data['phone'] ?? 'TELEFONO';
    final String location = data['reference_address'] ?? data['address'] ?? 'UBICACIÓN';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 0,
            pinned: true,
            backgroundColor: AppColors.surface,
            automaticallyImplyLeading: false,
            title: const Row(
              children: [
                Icon(Icons.person_rounded, color: AppColors.primary, size: 22),
                SizedBox(width: 10),
                Text(
                  'Mi Perfil',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  // Profile Header
                  Center(
                    child: Stack(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: AppColors.primaryGradient,
                            boxShadow: AppColors.elevatedShadow,
                          ),
                          child: CircleAvatar(
                            radius: 68,
                            backgroundColor: AppColors.surface,
                            child: const Icon(Icons.person_rounded, color: AppColors.primary, size: 72),
                          ),
                        ),
                        Positioned(
                          bottom: 4,
                          right: 4,
                          child: GestureDetector(
                            onTap: () => context.push('/change-photo'),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                border: Border.all(color: AppColors.surface, width: 3),
                                boxShadow: AppColors.elevatedShadow,
                              ),
                              child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 20),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    name.toUpperCase(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildInfoChip(Icons.badge_outlined, idNumber),
                  const SizedBox(height: 6),
                  _buildInfoChip(Icons.phone_outlined, phone),
                  const SizedBox(height: 6),
                  _buildInfoChip(Icons.location_on_outlined, location.toUpperCase()),
                  const SizedBox(height: 40),

                  // Action Buttons
                  _buildActionButton(
                    'Editar Datos',
                    Icons.edit_rounded,
                    () async {
                      await context.push('/edit-data');
                      if (mounted) _loadProfile();
                    },
                  ),
                  const SizedBox(height: 14),
                  _buildActionButton(
                    'Cerrar Sesión',
                    Icons.logout_rounded,
                    () => context.go('/login'),
                    isDanger: true,
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider.withOpacity(0.5)),
        boxShadow: AppColors.softShadow,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppColors.primary, size: 18),
          const SizedBox(width: 8),
          Text(
            text,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(String text, IconData icon, VoidCallback onPressed, {bool isDanger = false}) {
    return SizedBox(
      width: double.infinity,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDanger ? AppColors.error.withOpacity(0.3) : AppColors.primary,
            width: 1.5,
          ),
          boxShadow: AppColors.cardShadow,
        ),
        child: ElevatedButton.icon(
          onPressed: onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          icon: Icon(icon, color: isDanger ? AppColors.error : AppColors.primary, size: 22),
          label: Text(
            text,
            style: TextStyle(
              color: isDanger ? AppColors.error : AppColors.primary,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
