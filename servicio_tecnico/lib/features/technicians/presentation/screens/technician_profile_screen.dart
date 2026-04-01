import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/technician_service.dart';
import '../../../../core/theme/app_colors.dart';

class TechnicianProfileScreen extends StatefulWidget {
  const TechnicianProfileScreen({super.key});

  @override
  State<TechnicianProfileScreen> createState() =>
      _TechnicianProfileScreenState();
}

class _TechnicianProfileScreenState extends State<TechnicianProfileScreen> {
  final TechnicianService _technicianService = TechnicianService();
  Map<String, dynamic>? _technicianData;
  List<dynamic> _reviews = [];
  bool _isLoading = true;
  bool _isLoadingReviews = false;
  String? _errorMessage;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isLoading && _technicianData == null) {
      final extra = GoRouterState.of(context).extra;
      if (extra != null && extra is String) {
        _fetchDetails(int.parse(extra));
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'ID de técnico no proporcionado';
        });
      }
    }
  }

  Future<void> _fetchDetails(int id) async {
    try {
      final response = await _technicianService.getTechnicianById(id);
      if (response.success) {
        setState(() {
          _technicianData = response.data;
          _isLoading = false;
        });
        _fetchReviews(id);
      } else {
        setState(() {
          _errorMessage = response.message;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error al cargar detalles del técnico';
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchReviews(int technicianId) async {
    setState(() => _isLoadingReviews = true);
    try {
      final response = await _technicianService.getTechnicianReviews(technicianId);
      if (response.success) {
        setState(() {
          _reviews = response.data ?? [];
          _isLoadingReviews = false;
        });
      } else {
        setState(() => _isLoadingReviews = false);
      }
    } catch (e) {
      setState(() => _isLoadingReviews = false);
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

    final tech = _technicianData!;
    final name = tech['person_type'] == 'natural'
        ? '${tech['names'] ?? ''} ${tech['surnames'] ?? ''}'.trim()
        : tech['company_name'] ?? 'Técnico';
    final dniRuc = tech['dni'] ?? tech['ruc'] ?? 'N/A';
    final rating = double.tryParse(tech['rating']?.toString() ?? '') ?? 0.0;
    final profileImg = tech['profile_image_url'] ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // App Bar with gradient
          SliverAppBar(
            expandedHeight: 80,
            pinned: true,
            backgroundColor: AppColors.surface,
            leadingWidth: 120,
            leading: TextButton.icon(
              onPressed: () => context.pop(),
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
              label: const Text('Regresar', style: TextStyle(fontWeight: FontWeight.w600)),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.only(left: 8),
                alignment: Alignment.centerLeft,
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  const SizedBox(height: 8),

                  // Profile Avatar
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.primaryGradient,
                      boxShadow: AppColors.elevatedShadow,
                    ),
                    child: CircleAvatar(
                      radius: 56,
                      backgroundColor: AppColors.surface,
                      backgroundImage: profileImg.isNotEmpty
                          ? NetworkImage(profileImg)
                          : null,
                      child: profileImg.isEmpty
                          ? const Icon(Icons.person_rounded, size: 56, color: AppColors.primary)
                          : null,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Name & Info
                  Text(
                    name,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    dniRuc,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Rating Stars
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7).withOpacity(0.5),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ...List.generate(5, (index) {
                          return Icon(
                            index < rating.floor()
                                ? Icons.star_rounded
                                : (index < rating
                                    ? Icons.star_half_rounded
                                    : Icons.star_outline_rounded),
                            color: const Color(0xFFFBBF24),
                            size: 28,
                          );
                        }),
                        const SizedBox(width: 8),
                        Text(
                          rating.toStringAsFixed(1),
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Action Buttons Row
                  Row(
                    children: [
                      Expanded(
                        child: _buildActionButton(
                          'Reseñar',
                          Icons.rate_review_rounded,
                          AppColors.primarySoft,
                          AppColors.primary,
                          () => _showRatingDialog(context, name),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildActionButton(
                          'Agendar Cita',
                          Icons.calendar_month_rounded,
                          AppColors.primary,
                          Colors.white,
                          () => context.push(
                            '/appointment-scheduling',
                            extra: {'id': tech['id'], 'name': name},
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Reviews Section
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.divider.withOpacity(0.5)),
                      boxShadow: AppColors.cardShadow,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.reviews_rounded, color: AppColors.primary, size: 22),
                            const SizedBox(width: 8),
                            const Text(
                              'Reseñas',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              '${_reviews.length}',
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        if (_isLoadingReviews)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(20),
                              child: CircularProgressIndicator(),
                            ),
                          )
                        else if (_reviews.isEmpty)
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                children: [
                                  Icon(Icons.rate_review_outlined, color: AppColors.textSecondary.withOpacity(0.5), size: 40),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Sin reseñas aún',
                                    style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else
                          ..._reviews.take(3).map((review) {
                            final name = review['person_type'] == 'natural'
                                ? '${review['names'] ?? ''} ${review['surnames'] ?? ''}'.trim()
                                : review['company_name'] ?? 'Usuario';
                            final rating = review['rating'] ?? 0;
                            final comment = review['comment'] ?? '';
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: _buildReviewItem(name, rating, comment),
                            );
                          }),
                        if (_reviews.length > 3)
                          Center(
                            child: SizedBox(
                              width: 180,
                              child: OutlinedButton(
                                onPressed: () => _showAllReviews(context),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.primary,
                                  side: BorderSide(color: AppColors.primary.withOpacity(0.3)),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: Text('Ver ${_reviews.length - 3} más', style: const TextStyle(fontWeight: FontWeight.w600)),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Send Message Button
                  SizedBox(
                    width: double.infinity,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.primary, width: 1.5),
                        boxShadow: AppColors.softShadow,
                      ),
                      child: ElevatedButton.icon(
                        onPressed: () => context.push('/chat', extra: tech['id']),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        icon: const Icon(Icons.chat_bubble_outline_rounded, size: 22),
                        label: const Text(
                          'Enviar Mensaje',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
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

  Widget _buildActionButton(
    String text,
    IconData icon,
    Color bgColor,
    Color fgColor,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: bgColor == AppColors.primary ? AppColors.elevatedShadow : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: fgColor, size: 20),
            const SizedBox(width: 8),
            Text(
              text,
              style: TextStyle(
                color: fgColor,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewItem(String name, int stars, String comment) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primarySoft.withOpacity(0.3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.person_rounded, color: AppColors.primary, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    ...List.generate(5, (index) {
                      return Icon(
                        index < stars ? Icons.star_rounded : Icons.star_outline_rounded,
                        color: const Color(0xFFFBBF24),
                        size: 16,
                      );
                    }),
                    const SizedBox(width: 8),
                    Text(
                      comment,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showRatingDialog(BuildContext context, String techName) {
    int selectedStars = 5;
    final commentController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.surface,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              icon: Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Color(0xFFFEF3C7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.star_rounded, color: Color(0xFFFBBF24), size: 36),
              ),
              title: Text(
                'Valora a $techName',
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Puntua tu satisfacción de 1 a 5 estrellas',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        return GestureDetector(
                          onTap: () => setDialogState(() => selectedStars = index + 1),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Icon(
                              Icons.star_rounded,
                              color: index < selectedStars
                                  ? const Color(0xFFFBBF24)
                                  : AppColors.divider,
                              size: 40,
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: commentController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: 'Escribe un comentario (opcional)...',
                        hintStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.divider),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.primary),
                        ),
                        contentPadding: const EdgeInsets.all(12),
                      ),
                    ),
                  ],
                ),
              ),
              actionsAlignment: MainAxisAlignment.spaceEvenly,
              actions: [
                SizedBox(
                  width: 110,
                  child: OutlinedButton(
                    onPressed: () {
                      commentController.dispose();
                      Navigator.pop(context);
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      side: const BorderSide(color: AppColors.divider),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Cancelar', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
                SizedBox(
                  width: 110,
                  child: ElevatedButton(
                    onPressed: () async {
                      final techId = _technicianData!['id'];
                      final response = await _technicianService.addReview(
                        technicianId: techId,
                        rating: selectedStars,
                        comment: commentController.text.trim(),
                        appointmentId: null,
                      );

                      if (context.mounted) {
                        commentController.dispose();
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(response.success ? 'Reseña enviada con éxito' : (response.message ?? 'Error al enviar reseña')),
                            backgroundColor: response.success ? AppColors.success : AppColors.error,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            margin: const EdgeInsets.all(16),
                          ),
                        );
                        if (response.success) {
                          _fetchDetails(techId);
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Valorar', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showAllReviews(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.divider,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const Icon(Icons.reviews_rounded, color: AppColors.primary, size: 22),
                    const SizedBox(width: 8),
                    const Text(
                      'Todas las Reseñas',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${_reviews.length}',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _reviews.length,
                  itemBuilder: (context, index) {
                    final review = _reviews[index];
                    final name = review['person_type'] == 'natural'
                        ? '${review['names'] ?? ''} ${review['surnames'] ?? ''}'.trim()
                        : review['company_name'] ?? 'Usuario';
                    final rating = review['rating'] ?? 0;
                    final comment = review['comment'] ?? '';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _buildReviewItem(name, rating, comment),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
