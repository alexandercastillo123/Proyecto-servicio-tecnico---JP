import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/widgets/custom_avatar.dart';

class ProviderProfileScreen extends StatefulWidget {
  const ProviderProfileScreen({super.key});
  @override
  State<ProviderProfileScreen> createState() => _ProviderProfileScreenState();
}

class _ProviderProfileScreenState extends State<ProviderProfileScreen>
    with SingleTickerProviderStateMixin {
  final _userService = UserService();
  final _picker = ImagePicker();
  Map<String, dynamic>? _data;
  bool _isLoading = true;

  late AnimationController _heroCtrl;
  late Animation<double> _heroAnim;

  @override
  void initState() {
    super.initState();
    _heroCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..forward();
    _heroAnim = CurvedAnimation(parent: _heroCtrl, curve: Curves.easeOutCubic);
    _loadProfile();
  }

  @override
  void dispose() { _heroCtrl.dispose(); super.dispose(); }

  Future<void> _loadProfile() async {
    try {
      final res = await _userService.getProfile();
      if (res.success && mounted) setState(() { _data = res.data; _isLoading = false; });
      else if (mounted) setState(() => _isLoading = false);
    } catch (_) { if (mounted) setState(() => _isLoading = false); }
  }

  Future<void> _pickPhoto() async {
    final img = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (img == null) return;
    setState(() => _isLoading = true);
    final res = await _userService.uploadPhoto(img.path);
    if (res.success) {
      await _loadProfile();
      if (mounted) _snack('Foto actualizada', isError: false);
    } else {
      setState(() => _isLoading = false);
      if (mounted) _snack(res.message ?? 'Error al subir foto');
    }
  }

  void _snack(String msg, {bool isError = true}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: GoogleFonts.outfit()),
      backgroundColor: isError ? AppColors.error : AppColors.success,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      margin: const EdgeInsets.all(16),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.primary)));
    }

    final d = _data ?? {};
    final isNatural = (d['person_type'] ?? '') == 'natural';
    final name = isNatural
        ? '${d['names'] ?? ''} ${d['surnames'] ?? ''}'.trim().isNotEmpty
            ? '${d['names'] ?? ''} ${d['surnames'] ?? ''}'.trim()
            : (d['username'] ?? 'Técnico')
        : (d['company_name'] ?? d['username'] ?? 'Técnico');
    final displayName = d['username']?.toString().isNotEmpty == true ? d['username'].toString() : name;
    final idNum   = isNatural ? (d['dni'] ?? '') : (d['ruc'] ?? '');
    final phone   = d['phone'] ?? '';
    final address = d['reference_address'] ?? d['address'] ?? '';
    final email   = d['email'] ?? '';
    final imgUrl  = d['profile_image_url'] ?? '';
    final isDark  = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppColors.getBackgroundColor(context),
      body: CustomScrollView(
        slivers: [
          // ── Hero ──────────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: AppColors.primary,
            elevation: 0,
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                  onPressed: () => context.pop(),
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: AnimatedBuilder(
                animation: _heroAnim,
                builder: (_, child) => Opacity(opacity: _heroAnim.value, child: child),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFF1A56DB), Color(0xFF0A1F6B), Color(0xFF060D1F)],
                          stops: [0.0, 0.55, 1.0],
                        ),
                      ),
                    ),
                    Positioned(top: -50, right: -50,
                      child: Container(width: 220, height: 220,
                        decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.05)))),
                    Positioned(bottom: 0, left: -40,
                      child: Container(width: 160, height: 160,
                        decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.accent.withOpacity(0.07)))),
                    SafeArea(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 12),
                          Stack(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white.withOpacity(0.35), width: 3),
                                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 24, offset: const Offset(0, 8))],
                                ),
                                child: CustomAvatar(
                                  imageUrl: imgUrl.isNotEmpty ? ApiConstants.getStorageUrl(imgUrl) : null,
                                  name: displayName, size: 96, fontSize: 34,
                                ),
                              ),
                              Positioned(
                                bottom: 2, right: 2,
                                child: GestureDetector(
                                  onTap: _pickPhoto,
                                  child: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      gradient: AppColors.accentGradient,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2),
                                    ),
                                    child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 15),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(displayName,
                            style: GoogleFonts.outfit(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
                          const SizedBox(height: 4),
                          if (email.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(email,
                                style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.85), fontSize: 12)),
                            ),
                          if (idNum.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(idNum, style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.5), fontSize: 11)),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Body ──────────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),

                  // Info cards
                  FadeInUp(duration: const Duration(milliseconds: 500),
                    child: _sectionTitle('Información')),
                  const SizedBox(height: 12),
                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 60),
                    child: _infoCard(isDark, [
                      if (phone.isNotEmpty) _infoRow(Icons.phone_outlined, 'Teléfono', phone, isDark),
                      if (address.isNotEmpty) _infoRow(Icons.location_on_outlined, 'Dirección', address, isDark),
                      if (d['description']?.toString().isNotEmpty == true)
                        _infoRow(Icons.info_outline_rounded, 'Descripción', d['description'].toString(), isDark),
                    ])),

                  const SizedBox(height: 24),
                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 120),
                    child: _sectionTitle('Cuenta')),
                  const SizedBox(height: 12),

                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 160),
                    child: _actionTile(
                      icon: Icons.edit_outlined,
                      title: 'Editar Datos',
                      subtitle: 'Actualiza tu información personal',
                      isDark: isDark,
                      onTap: () async {
                        await context.push('/edit-data');
                        if (mounted) _loadProfile();
                      },
                    )),
                  const SizedBox(height: 8),
                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 200),
                    child: _actionTile(
                      icon: Icons.settings_outlined,
                      title: 'Configuración General',
                      subtitle: 'Privacidad, notificaciones y más',
                      isDark: isDark,
                      onTap: () => context.push('/settings'),
                    )),
                  const SizedBox(height: 8),
                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 240),
                    child: _actionTile(
                      icon: Icons.logout_rounded,
                      title: 'Cerrar Sesión',
                      subtitle: 'Salir de tu cuenta',
                      isDestructive: true,
                      isDark: isDark,
                      onTap: () async {
                        await context.read<AuthProvider>().logout();
                        if (context.mounted) context.go('/login');
                      },
                    )),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String t) => Text(t,
    style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w800,
      color: AppColors.getTextPrimary(context), letterSpacing: -0.3));

  Widget _infoCard(bool isDark, List<Widget> rows) {
    if (rows.isEmpty) return const SizedBox.shrink();
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF112044) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white.withOpacity(0.07) : AppColors.border),
        boxShadow: isDark ? [] : AppColors.softShadow,
      ),
      child: Column(
        children: rows.asMap().entries.map((e) => Column(children: [
          e.value,
          if (e.key < rows.length - 1)
            Divider(height: 1, color: isDark ? Colors.white.withOpacity(0.06) : AppColors.divider, indent: 52),
        ])).toList(),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.primary, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: GoogleFonts.outfit(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
          Text(value, style: GoogleFonts.outfit(fontSize: 14, color: AppColors.getTextPrimary(context), fontWeight: FontWeight.w600)),
        ])),
      ]),
    );
  }

  Widget _actionTile({
    required IconData icon, required String title, required String subtitle,
    required VoidCallback onTap, bool isDestructive = false, required bool isDark,
  }) {
    final color = isDestructive ? AppColors.error : AppColors.primary;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF112044) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDestructive ? AppColors.error.withOpacity(0.2)
              : (isDark ? Colors.white.withOpacity(0.07) : AppColors.border)),
        boxShadow: isDark ? [] : AppColors.softShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15,
                  color: isDestructive ? AppColors.error : AppColors.getTextPrimary(context))),
                Text(subtitle, style: GoogleFonts.outfit(fontSize: 12, color: AppColors.getTextSecondary(context))),
              ])),
              Icon(Icons.chevron_right_rounded, color: AppColors.textLight, size: 20),
            ]),
          ),
        ),
      ),
    );
  }
}
