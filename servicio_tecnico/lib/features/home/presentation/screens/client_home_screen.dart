import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/technician_service.dart';
import '../../../technicians/domain/models/technician.dart';
import '../widgets/service_location_map.dart';

class ClientHomeScreen extends StatefulWidget {
  const ClientHomeScreen({super.key});

  @override
  State<ClientHomeScreen> createState() => _ClientHomeScreenState();
}

class _ClientHomeScreenState extends State<ClientHomeScreen> {
  final TechnicianService _technicianService = TechnicianService();
  List<Technician> _technicians = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNearbyTechnicians();
  }

  Future<void> _loadNearbyTechnicians() async {
    try {
      final response = await _technicianService.getTechnicians();
      if (response.success && mounted) {
        setState(() {
          _technicians = response.data ?? [];
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
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // 1. Custom Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Logo
                  const Text(
                    'J&P',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      color: Color(0xFF3B28FF),
                      fontSize: 40,
                      fontWeight: FontWeight.w900,
                    ),
                  ),

                  // Profile Icon
                  GestureDetector(
                    onTap: () => context.push('/profile'),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF3B28FF),
                          width: 2.5,
                        ),
                      ),
                      child: const Icon(
                        Icons.person_outline,
                        color: Color(0xFF3B28FF),
                        size: 34,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 2. Map Container with rounded corners
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(30),
                  child: Stack(
                    children: [
                      // The Map Widget
                      ServiceLocationMap(technicians: _technicians),

                      if (_isLoading)
                        const Center(child: CircularProgressIndicator()),

                      // 3. Search Button inside the Map Card
                      Positioned(
                        bottom: 24,
                        left: 20,
                        right: 20,
                        child: Center(
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 280),
                            child: ElevatedButton(
                              onPressed: () => context.push('/technician-list'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFF0F0F0),
                                foregroundColor: const Color(0xFF3B28FF),
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: const Center(
                                child: Text(
                                  'Buscar Técnicos',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
