import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/technician_service.dart';

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
    final name = tech['person_type'] == 'natural'
        ? '${tech['names'] ?? ''} ${tech['surnames'] ?? ''}'.trim()
        : tech['company_name'] ?? 'Técnico';
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
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF3B28FF), width: 4),
                ),
                child: CircleAvatar(
                  radius: 60,
                  backgroundColor: Colors.white,
                  backgroundImage: profileImg.isNotEmpty
                      ? NetworkImage(profileImg)
                      : null,
                  child: profileImg.isEmpty
                      ? const Icon(
                          Icons.person_outline,
                          size: 80,
                          color: Color(0xFF3B28FF),
                        )
                      : null,
                ),
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
            const SizedBox(height: 5),
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
                  extra: {'id': tech['id'], 'name': name},
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
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEEEEEE),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  _buildReviewItem('Usuario Ejemplo', 5),
                  const SizedBox(height: 10),
                  _buildReviewItem('Otro Usuario', 4),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: 180,
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD9D9D9),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Mostrar Más',
                        style: TextStyle(
                          color: Color(0xFF3B28FF),
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 23),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.push('/chat', extra: tech['id']),
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

  Widget _buildReviewItem(String name, int stars) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(5),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFF3B28FF), width: 2),
            ),
            child: const Icon(
              Icons.person_outline,
              size: 25,
              color: Color(0xFF3B28FF),
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  color: Color(0xFF3B28FF),
                  fontWeight: FontWeight.w500,
                ),
              ),
              Row(
                children: List.generate(5, (index) {
                  return Icon(
                    index < stars ? Icons.star : Icons.star_border,
                    color: const Color(0xFFFFD700),
                    size: 18,
                  );
                }),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showRatingDialog(BuildContext context, String techName) {
    int selectedStars = 5;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFD9D9D9),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Valora tu experiencia con\n$techName',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF3B28FF),
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Puntua tu satisfacción con el técnico de 1 a 5 estrellas',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF3B28FF), fontSize: 14),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        return GestureDetector(
                          onTap: () {
                            setDialogState(() {
                              selectedStars = index + 1;
                            });
                          },
                          child: Icon(
                            Icons.star,
                            color: index < selectedStars
                                ? const Color(0xFFFFD700)
                                : const Color(0xFFBDBDBD),
                            size: 40,
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 30),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () => Navigator.pop(context),
                            style: TextButton.styleFrom(
                              backgroundColor: const Color(0xFFBDBDBD),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'Cancelar',
                              style: TextStyle(
                                color: Color(0xFF3B28FF),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextButton(
                            onPressed: () async {
                              final techId = _technicianData!['id'];
                              final response = await _technicianService.addReview(
                                technicianId: techId,
                                rating: selectedStars,
                                comment:
                                    '', // User didn't ask for comment field yet
                              );

                              if (context.mounted) {
                                Navigator.pop(context);
                                if (response.success) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Reseña enviada con éxito'),
                                    ),
                                  );
                                  _fetchDetails(techId); // Refresh profile
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        response.message ??
                                            'Error al enviar reseña',
                                      ),
                                    ),
                                  );
                                }
                              }
                            },
                            style: TextButton.styleFrom(
                              backgroundColor: const Color(0xFFEEEEEE),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              side: const BorderSide(color: Color(0xFFBDBDBD)),
                            ),
                            child: const Text(
                              'Valorar',
                              style: TextStyle(
                                color: Color(0xFF3B28FF),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
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
