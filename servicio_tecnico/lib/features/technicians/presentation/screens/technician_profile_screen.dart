import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/technician_service.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/widgets/custom_avatar.dart';
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
  bool _isLoading = true;
  String? _errorMessage;
  // Service location passed from the map
  double? _serviceLat;
  double? _serviceLng;
  String? _serviceAddress;

  @override
  void initState() {
    super.initState();
    _loadTechnician();
  }

  Future<void> _loadTechnician() async {
    // Get technician ID from GoRouter state or previous screen
    // For now, let's assume we might receive it via extra or path params
    // If not provided, we might need to handle it.
    // In this MVP, we'll try to get it from the widget context if possible or just use a placeholder
    // But since context.push('/technician-profile', extra: tech.id) was called:

    // Note: StatefulWidgets can't easily access GoRouter state in initState
    // We'll use a post-frame callback or access it in build.
    // Better to use didChangeDependencies or just fetch in build if not already fetching.
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isLoading && _technicianData == null) {
      final extra = GoRouterState.of(context).extra;
      int? techId;

      if (extra is int) {
        techId = extra;
      } else if (extra is String) {
        techId = int.tryParse(extra);
      } else if (extra is Map<String, dynamic>) {
        // Mapa nuevo con coordenadas: {techId, serviceLat, serviceLng, serviceAddress}
        final id = extra['techId'] ?? extra['id'];
        if (id is int)
          techId = id;
        else if (id is String)
          techId = int.tryParse(id);
        _serviceLat = (extra['serviceLat'] as num?)?.toDouble();
        _serviceLng = (extra['serviceLng'] as num?)?.toDouble();
        _serviceAddress = extra['serviceAddress'] as String?;
      }

      if (techId != null) {
        _fetchDetails(techId);
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'ID de técnico no proporcionado o inválido';
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
        setState(() {
          _technicianData = response.data;
          _isLoading = false;
        });
        // We no longer strictly check for appointments here to allow reviewing freely
        // _checkEligibleAppointment(id);
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
    final name =
        ((tech['username'] != null &&
            tech['username'].toString().trim().isNotEmpty)
        ? tech['username'].toString().trim()
        : (tech['company_name'] != null &&
                  tech['company_name'].toString().trim().isNotEmpty
              ? tech['company_name'].toString().trim()
              : '${tech['names'] ?? ''} ${tech['surnames'] ?? ''}'
                    .trim()
                    .isEmpty
              ? 'Técnico'
              : '${tech['names'] ?? ''} ${tech['surnames'] ?? ''}'.trim()));
    final dniRuc = tech['dni'] ?? tech['ruc'] ?? 'N/A';
    final rating = double.tryParse(tech['rating']?.toString() ?? '') ?? 0.0;
    final profileImg = tech['profile_image_url'] ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 115,
        leading: TextButton.icon(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_left, color: Color(0xFF3B28FF)),
          label: const Text(
            'Regresar',
            style: TextStyle(
              color: Color(0xFF3B28FF),
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 3),
            Center(
              child: CustomAvatar(
                imageUrl: profileImg.isNotEmpty
                    ? ApiConstants.getStorageUrl(profileImg)
                    : null,
                name: name,
                size: 120,
                fontSize: 48,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              name,
              style: const TextStyle(
                color: Color(0xFF3B28FF),
                fontSize: 24,
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              dniRuc,
              style: const TextStyle(color: Color(0xFF3B28FF), fontSize: 18),
            ),
            if (tech['company_name'] != null && tech['company_name'].toString().isNotEmpty && tech['company_name'] != tech['username']) ...[
              const SizedBox(height: 4),
              Text(
                'Empresa: ${tech['company_name']}',
                style: const TextStyle(color: Colors.grey, fontSize: 14, fontStyle: FontStyle.italic),
              ),
            ],
            if (tech['description'] != null && tech['description'].toString().isNotEmpty) ...[
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Text(
                  tech['description'].toString(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.black87,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 15),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                if (index < rating.floor()) {
                  return const Icon(
                    Icons.star,
                    color: Color(0xFFFFD700),
                    size: 40,
                  );
                } else if (index < rating) {
                  return const Icon(
                    Icons.star_half,
                    color: Color(0xFFFFD700),
                    size: 40,
                  );
                } else {
                  return const Icon(
                    Icons.star,
                    color: Color(0xFFE0E0E0),
                    size: 40,
                  );
                }
              }),
            ),
            const SizedBox(height: 5),
            SizedBox(
              width: 150,
              child: ElevatedButton(
                onPressed: () => _showRatingDialog(context, name),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B28FF),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                ),
                child: const Text(
                  'Reseñar',
                  style: TextStyle(color: Colors.white, fontSize: 18),
                ),
              ),
            ),
            const SizedBox(height: 3),
            SizedBox(
              width: 150,
              child: ElevatedButton(
                onPressed: () => context.push(
                  '/appointment-scheduling',
                  extra: {
                    'id': tech['id'],
                    'name': name,
                    'serviceLat': _serviceLat,
                    'serviceLng': _serviceLng,
                    'serviceAddress': _serviceAddress,
                  },
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B28FF),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                ),
                child: const Text(
                  'Agendar Cita',
                  style: TextStyle(color: Colors.white, fontSize: 18),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFEEEEEE),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Center(
                child: Column(
                  children: [
                    Icon(Icons.rate_review_outlined, size: 40, color: Colors.grey),
                    SizedBox(height: 12),
                    Text(
                      'No hay reseñas recientes\nSé el primero en valorar a este técnico.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 23),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.push(
                    '/chat',
                    extra: {
                      'receiverId': tech['id'],
                      'receiverName': name,
                      'receiverRole': 'tech',
                    },
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD9D9D9),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Enviar Mensaje',
                    style: TextStyle(
                      color: Color(0xFF3B28FF),
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
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
            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.star_rounded, color: AppColors.primary, size: 40),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Valorar a $techName',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '¿Cómo fue tu experiencia con el servicio?',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        return GestureDetector(
                          onTap: () => setDialogState(() => selectedStars = index + 1),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Icon(
                              Icons.star_rounded,
                              color: index < selectedStars ? Colors.amber : Colors.grey[300],
                              size: 44,
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: commentController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: 'Cuéntanos más detalles (opcional)...',
                        hintStyle: GoogleFonts.outfit(fontSize: 14),
                        filled: true,
                        fillColor: Colors.grey[50],
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: Text('Cancelar', style: GoogleFonts.outfit(color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () async {
                              final techId = _technicianData!['id'];
                              final response = await _technicianService.addReview(
                                technicianId: techId,
                                rating: selectedStars,
                                comment: commentController.text,
                                appointmentId: null,
                              );

                              if (context.mounted) {
                                Navigator.pop(context);
                                if (response.success) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('✅ Reseña enviada con éxito'), backgroundColor: Colors.green),
                                  );
                                  _fetchDetails(techId);
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('❌ ${response.message ?? "Error al enviar reseña"}')),
                                  );
                                }
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: Text('Enviar', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
