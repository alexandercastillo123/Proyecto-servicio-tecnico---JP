import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:provider/provider.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/services/message_service.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/widgets/custom_avatar.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  final _userService    = UserService();
  final _picker         = ImagePicker();
  final _messageService = MessageService();
  Map<String, dynamic>? _userData;
  List<dynamic> _recentTechs = [];
  bool _isLoading = true, _isLoadingRecent = false;
  String? _errorMessage;

  late AnimationController _heroCtrl;
  late Animation<double> _heroAnim;

  @override
  void initState() {
    super.initState();
    _heroCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..forward();
    _heroAnim = CurvedAnimation(parent: _heroCtrl, curve: Curves.easeOutCubic);
    _loadProfile();
    _loadRecentTechs();
  }

  @override
  void dispose() { _heroCtrl.dispose(); super.dispose(); }

  Future<void> _loadRecentTechs() async {
    setState(() => _isLoadingRecent = true);
    try {
      final res = await _messageService.getConversations();
      if (res.success && mounted) setState(() { _recentTechs = res.data ?? []; _isLoadingRecent = false; });
    } catch (_) { if (mounted) setState(() => _isLoadingRecent = false); }
  }

  Future<void> _pickAndUploadImage() async {
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

  Future<void> _loadProfile() async {
    try {
      final res = await _userService.getProfile();
      if (res.success) setState(() { _userData = res.data; _isLoading = false; });
      else setState(() { _errorMessage = res.message; _isLoading = false; });
    } catch (_) { setState(() { _errorMessage = 'Error al cargar perfil'; _isLoading = false; }); }
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
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.primary)));
    if (_errorMessage != null) return Scaffold(body: Center(child: Text(_errorMessage!)));

    final user = _userData!;
    final name = (user['username']?.toString().isNotEmpty == true)
        ? user['username'].toString()
        : (user['person_type'] == 'natural'
            ? '${user['names'] ?? ''} ${user['surnames'] ?? ''}'.trim()
            : user['company_name'] ?? 'Usuario');
    final dniRuc   = user['dni'] ?? user['ruc'] ?? 'N/A';
    final email    = user['email'] ?? 'N/A';
    final imgUrl   = user['profile_image_url'] ?? '';
    final isDark   = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppColors.getBackgroundColor(context),
      body: CustomScrollView(
        slivers: [
          // ── Hero ──────────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 290,
            pinned: true,
            backgroundColor: AppColors.primary,
            elevation: 0,
            automaticallyImplyLeading: false,
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
                    // Decorative circles
                    Positioned(top: -50, right: -50,
                      child: Container(width: 220, height: 220,
                        decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.05)))),
                    Positioned(bottom: 10, left: -40,
                      child: Container(width: 150, height: 150,
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
                                  name: name, size: 96, fontSize: 34,
                                ),
                              ),
                              Positioned(
                                bottom: 2, right: 2,
                                child: GestureDetector(
                                  onTap: _pickAndUploadImage,
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
                          Text(name, style: GoogleFonts.outfit(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(email, style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.85), fontSize: 12)),
                          ),
                          const SizedBox(height: 4),
                          Text(dniRuc, style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.5), fontSize: 11)),
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
                  FadeInUp(duration: const Duration(milliseconds: 500),
                    child: _sectionTitle('Últimos servicios')),
                  const SizedBox(height: 12),
                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 80),
                    child: _recentCard(isDark)),
                  const SizedBox(height: 24),
                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 160),
                    child: _sectionTitle('Cuenta')),
                  const SizedBox(height: 12),
                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 200),
                    child: _actionTile(context, icon: Icons.settings_outlined, title: 'Configuración General',
                      subtitle: 'Privacidad, notificaciones y más', onTap: () => context.push('/settings'), isDark: isDark)),
                  const SizedBox(height: 8),
                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 250),
                    child: _actionTile(context, icon: Icons.logout_rounded, title: 'Cerrar Sesión',
                      subtitle: 'Salir de tu cuenta', isDestructive: true, isDark: isDark,
                      onTap: () async {
                        await context.read<AuthProvider>().logout();
                        if (context.mounted) context.go('/login');
                      })),
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

  Widget _recentCard(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF112044) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white.withOpacity(0.07) : AppColors.border),
        boxShadow: isDark ? [] : AppColors.softShadow,
      ),
      child: _isLoadingRecent
          ? const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator(color: AppColors.primary)))
          : _recentTechs.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(children: [
                    Icon(Icons.history_rounded, size: 44, color: AppColors.textLight),
                    const SizedBox(height: 10),
                    Text('No has contactado técnicos aún',
                      style: GoogleFonts.outfit(color: AppColors.textSecondary, fontSize: 14)),
                  ]),
                )
              : Column(
                  children: _recentTechs.take(3).toList().asMap().entries.map((e) {
                    final i = e.key; final t = e.value;
                    return Column(children: [
                      _techItem(t['username'] ?? 'Técnico', t['profile_image_url'],
                        (t['rating'] ?? 5.0).toDouble(), t['other_user_id'], isDark),
                      if (i < (_recentTechs.take(3).length - 1))
                        Divider(height: 1, color: isDark ? Colors.white.withOpacity(0.06) : AppColors.divider, indent: 72),
                    ]);
                  }).toList(),
                ),
    );
  }

  Widget _techItem(String name, String? imgUrl, double rating, dynamic uid, bool isDark) {
    return InkWell(
      onTap: () => context.push('/technician-profile', extra: uid),
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(children: [
          CustomAvatar(
            imageUrl: imgUrl != null && imgUrl.isNotEmpty ? ApiConstants.getStorageUrl(imgUrl) : null,
            name: name, size: 44, fontSize: 16,
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15,
              color: AppColors.getTextPrimary(context))),
            Row(children: [
              ...List.generate(5, (i) => Icon(
                i < rating.round() ? Icons.star_rounded : Icons.star_outline_rounded,
                color: const Color(0xFFFBBF24), size: 14)),
              const SizedBox(width: 4),
              Text(rating.toStringAsFixed(1), style: GoogleFonts.outfit(fontSize: 11,
                color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
            ]),
          ])),
          Icon(Icons.chevron_right_rounded, color: AppColors.textLight, size: 20),
        ]),
      ),
    );
  }

  Widget _actionTile(BuildContext context, {
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
