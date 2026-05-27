import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/technician_service.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/widgets/custom_avatar.dart';
import '../../../../core/theme/app_colors.dart';

class TechnicianProfileScreen extends StatefulWidget {
  const TechnicianProfileScreen({super.key});
  @override
  State<TechnicianProfileScreen> createState() => _TechnicianProfileScreenState();
}

class _TechnicianProfileScreenState extends State<TechnicianProfileScreen> {
  final _service = TechnicianService();
  Map<String, dynamic>? _data;
  bool _isLoading = true;
  String? _error;
  double? _serviceLat, _serviceLng;
  String? _serviceAddress;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isLoading && _data == null) {
      final extra = GoRouterState.of(context).extra;
      int? id;
      if (extra is int) id = extra;
      else if (extra is String) id = int.tryParse(extra);
      else if (extra is Map<String, dynamic>) {
        final raw = extra['techId'] ?? extra['id'];
        id = raw is int ? raw : int.tryParse(raw?.toString() ?? '');
        _serviceLat = (extra['serviceLat'] as num?)?.toDouble();
        _serviceLng = (extra['serviceLng'] as num?)?.toDouble();
        _serviceAddress = extra['serviceAddress'] as String?;
      }
      if (id != null) _fetch(id);
      else setState(() { _isLoading = false; _error = 'ID inválido'; });
    }
  }

  Future<void> _fetch(int id) async {
    try {
      final res = await _service.getTechnicianById(id);
      if (res.success) setState(() { _data = res.data; _isLoading = false; });
      else setState(() { _error = res.message; _isLoading = false; });
    } catch (_) { setState(() { _error = 'Error al cargar técnico'; _isLoading = false; }); }
  }

  String get _name {
    final t = _data!;
    if (t['username']?.toString().trim().isNotEmpty == true) return t['username'].toString().trim();
    if (t['company_name']?.toString().trim().isNotEmpty == true) return t['company_name'].toString().trim();
    final full = '${t['names'] ?? ''} ${t['surnames'] ?? ''}'.trim();
    return full.isEmpty ? 'Técnico' : full;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.primary)));
    if (_error != null) return Scaffold(appBar: AppBar(), body: Center(child: Text(_error!)));

    final t      = _data!;
    final name   = _name;
    final dniRuc = t['dni'] ?? t['ruc'] ?? 'N/A';
    final rating = double.tryParse(t['rating']?.toString() ?? '') ?? 0.0;
    final img    = t['profile_image_url'] ?? '';
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppColors.getBackgroundColor(context),
      body: CustomScrollView(
        slivers: [
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
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft, end: Alignment.bottomRight,
                        colors: [Color(0xFF1A56DB), Color(0xFF0A1F6B), Color(0xFF060D1F)],
                        stops: [0.0, 0.55, 1.0],
                      ),
                    ),
                  ),
                  Positioned(top: -50, right: -50,
                    child: Container(width: 220, height: 220,
                      decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.05)))),
                  SafeArea(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: 16),
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white.withOpacity(0.3), width: 3),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 24, offset: const Offset(0, 8))],
                          ),
                          child: CustomAvatar(
                            imageUrl: img.isNotEmpty ? ApiConstants.getStorageUrl(img) : null,
                            name: name, size: 92, fontSize: 32,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(name, style: GoogleFonts.outfit(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
                        const SizedBox(height: 3),
                        Text(dniRuc, style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.55), fontSize: 12)),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            ...List.generate(5, (i) {
                              if (i < rating.floor()) return const Icon(Icons.star_rounded, color: Color(0xFFFBBF24), size: 22);
                              if (i < rating) return const Icon(Icons.star_half_rounded, color: Color(0xFFFBBF24), size: 22);
                              return Icon(Icons.star_outline_rounded, color: Colors.white.withOpacity(0.3), size: 22);
                            }),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
                              child: Text(rating.toStringAsFixed(1),
                                style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Description
                  if (t['description']?.toString().isNotEmpty == true) ...[
                    FadeInUp(duration: const Duration(milliseconds: 500),
                      child: _infoCard(t['description'].toString(), isDark)),
                    const SizedBox(height: 14),
                  ],

                  // Action buttons
                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 80),
                    child: Row(children: [
                      Expanded(child: _actionBtn(
                        icon: Icons.calendar_today_rounded, label: 'Agendar Cita',
                        isPrimary: true,
                        onTap: () => context.push('/appointment-scheduling', extra: {
                          'id': t['id'], 'name': name,
                          'serviceLat': _serviceLat, 'serviceLng': _serviceLng, 'serviceAddress': _serviceAddress,
                        }),
                      )),
                      const SizedBox(width: 12),
                      Expanded(child: _actionBtn(
                        icon: Icons.chat_bubble_rounded, label: 'Mensaje',
                        isPrimary: false, isDark: isDark,
                        onTap: () => context.push('/chat', extra: {
                          'receiverId': t['id'], 'receiverName': name, 'receiverRole': 'tech',
                        }),
                      )),
                    ])),

                  const SizedBox(height: 12),

                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 140),
                    child: _outlineBtn(
                      icon: Icons.star_rounded, label: 'Dejar una Reseña',
                      onTap: () => _showRatingDialog(context, name), isDark: isDark,
                    )),

                  const SizedBox(height: 24),

                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 180),
                    child: Text('Reseñas', style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w800,
                      color: AppColors.getTextPrimary(context), letterSpacing: -0.3))),
                  const SizedBox(height: 12),
                  FadeInUp(duration: const Duration(milliseconds: 500), delay: const Duration(milliseconds: 220),
                    child: Container(
                      padding: const EdgeInsets.all(28),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF112044) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: isDark ? Colors.white.withOpacity(0.07) : AppColors.border),
                        boxShadow: isDark ? [] : AppColors.softShadow,
                      ),
                      child: Column(children: [
                        Icon(Icons.rate_review_outlined, size: 44, color: AppColors.textLight),
                        const SizedBox(height: 10),
                        Text('Sin reseñas aún', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700,
                          color: AppColors.getTextPrimary(context))),
                        const SizedBox(height: 4),
                        Text('Sé el primero en valorar a este técnico.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(color: AppColors.textSecondary, fontSize: 13)),
                      ]),
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

  Widget _infoCard(String text, bool isDark) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: isDark ? const Color(0xFF112044) : AppColors.primaryLight,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: isDark ? Colors.white.withOpacity(0.07) : AppColors.primary.withOpacity(0.15)),
    ),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Icon(Icons.info_outline_rounded, color: AppColors.primary, size: 18),
      const SizedBox(width: 10),
      Expanded(child: Text(text, style: GoogleFonts.outfit(color: AppColors.getTextSecondary(context), fontSize: 13, height: 1.6))),
    ]),
  );

  Widget _actionBtn({required IconData icon, required String label, required bool isPrimary, bool isDark = false, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          gradient: isPrimary ? AppColors.heroGradient : null,
          color: isPrimary ? null : (isDark ? const Color(0xFF112044) : Colors.white),
          borderRadius: BorderRadius.circular(16),
          border: isPrimary ? null : Border.all(color: isDark ? Colors.white.withOpacity(0.1) : AppColors.border),
          boxShadow: isPrimary ? AppColors.premiumShadow : (isDark ? [] : AppColors.softShadow),
        ),
        child: Column(children: [
          Icon(icon, color: isPrimary ? Colors.white : AppColors.primary, size: 22),
          const SizedBox(height: 6),
          Text(label, style: GoogleFonts.outfit(
            color: isPrimary ? Colors.white : AppColors.primary,
            fontWeight: FontWeight.w700, fontSize: 13)),
        ]),
      ),
    );
  }

  Widget _outlineBtn({required IconData icon, required String label, required VoidCallback onTap, required bool isDark}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? Colors.white.withOpacity(0.12) : AppColors.border, width: 1.5),
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.star_rounded, color: Color(0xFFFBBF24), size: 20),
          const SizedBox(width: 8),
          Text(label, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15,
            color: AppColors.getTextPrimary(context))),
        ]),
      ),
    );
  }

  void _showRatingDialog(BuildContext context, String techName) {
    int stars = 5;
    final commentCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, set) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFFFBBF24), Color(0xFFF59E0B)]),
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: const Color(0xFFFBBF24).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 8))],
                ),
                child: const Icon(Icons.star_rounded, color: Colors.white, size: 32),
              ),
              const SizedBox(height: 16),
              Text('Valorar a $techName', textAlign: TextAlign.center,
                style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.getTextPrimary(context))),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) => GestureDetector(
                  onTap: () => set(() => stars = i + 1),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(Icons.star_rounded,
                      color: i < stars ? const Color(0xFFFBBF24) : Colors.grey[300], size: 44),
                  ),
                )),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: commentCtrl,
                maxLines: 3,
                style: GoogleFonts.outfit(color: AppColors.getTextPrimary(context), fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Cuéntanos más (opcional)...',
                  hintStyle: GoogleFonts.outfit(fontSize: 14, color: AppColors.textLight),
                  filled: true,
                  fillColor: AppColors.getSurfaceColor(context),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.all(14),
                ),
              ),
              const SizedBox(height: 20),
              Row(children: [
                Expanded(child: TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: Text('Cancelar', style: GoogleFonts.outfit(color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                )),
                const SizedBox(width: 10),
                Expanded(child: Container(
                  decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(14)),
                  child: ElevatedButton(
                    onPressed: () async {
                      final id = _data!['id'];
                      final res = await _service.addReview(technicianId: id, rating: stars, comment: commentCtrl.text, appointmentId: null);
                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: Text(res.success ? '✅ Reseña enviada' : (res.message ?? 'Error'), style: GoogleFonts.outfit()),
                          backgroundColor: res.success ? AppColors.success : AppColors.error,
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          margin: const EdgeInsets.all(16),
                        ));
                        if (res.success) _fetch(id);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent, shadowColor: Colors.transparent,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text('Enviar', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                )),
              ]),
            ]),
          ),
        ),
      ),
    );
  }
}
