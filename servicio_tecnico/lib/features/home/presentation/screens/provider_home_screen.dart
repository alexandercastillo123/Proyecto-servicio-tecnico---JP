import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/appointment_service.dart';
import '../../../../core/services/message_service.dart';
import '../../../../core/constants/assets.dart';

class ProviderHomeScreen extends StatefulWidget {
  const ProviderHomeScreen({super.key});

  @override
  State<ProviderHomeScreen> createState() => _ProviderHomeScreenState();
}

class _ProviderHomeScreenState extends State<ProviderHomeScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  final MessageService _messageService = MessageService();
  List<dynamic> _proposals = [];
  List<dynamic> _completedJobs = [];
  List<dynamic> _consultations = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final proposalsRes = await _appointmentService.getAppointments(
        status:
            'pending', // Ensure backend uses 'pending'. If not, we might need to fetch all and filter.
      );
      final completedRes = await _appointmentService.getAppointments(
        status: 'completed',
      );
      final consultRes = await _messageService.getConversations();

      if (proposalsRes.success && completedRes.success && consultRes.success) {
        if (mounted) {
          setState(() {
            _proposals = proposalsRes.data ?? [];
            _completedJobs = completedRes.data ?? [];

            // Filter consultations: exclude those who have ANY active/pending proposal
            final allConsultations = consultRes.data ?? [];
            final proposalClientIds = _proposals
                .map((p) => p['client_id'].toString())
                .toSet();

            // Debugging help: ensure we compare Strings
            _consultations = allConsultations.where((c) {
              final otherId = c['other_user_id'].toString();
              return !proposalClientIds.contains(otherId);
            }).toList();

            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _errorMessage =
                proposalsRes.message ??
                completedRes.message ??
                consultRes.message;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al cargar datos del dashboard';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
            ? Center(child: Text(_errorMessage!))
            : RefreshIndicator(
                onRefresh: _loadData,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: Column(
                    children: [
                      // Header
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Image.asset(
                              AppAssets.logo,
                              height: 40,
                              fit: BoxFit.contain,
                            ),
                            GestureDetector(
                              onTap: () => context.push('/provider-profile'),
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: const Color(0xFF3B28FF),
                                    width: 2,
                                  ),
                                ),
                                child: const Icon(
                                  Icons.person_outline,
                                  size: 40,
                                  color: Color(0xFF3B28FF),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 10),

                      const Text(
                        'Consultas de Clientes:',
                        style: TextStyle(
                          color: Color(0xFF3B28FF),
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 10),
                      _buildSection(
                        _consultations,
                        'No hay consultas nuevas',
                        isConsultation: true,
                      ),

                      const SizedBox(height: 20),

                      const Text(
                        'Propuestas de Chamba:',
                        style: TextStyle(
                          color: Color(0xFF3B28FF),
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),

                      const SizedBox(height: 10),

                      _buildSection(_proposals, 'No hay propuestas pendientes'),

                      const SizedBox(height: 30),

                      const Text(
                        'Trabajos Completados',
                        style: TextStyle(
                          color: Color(0xFF3B28FF),
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),

                      const SizedBox(height: 10),

                      _buildSection(
                        _completedJobs,
                        'No hay trabajos completados',
                      ),

                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildSection(
    List<dynamic> items,
    String emptyMessage, {
    bool isConsultation = false,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFE0E0E0),
        borderRadius: BorderRadius.circular(20),
      ),
      child: items.isEmpty
          ? Padding(
              padding: const EdgeInsets.all(20.0),
              child: Text(
                emptyMessage,
                style: const TextStyle(color: Colors.grey),
              ),
            )
          : Column(
              children: [
                ...items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _buildUserItem(
                      isConsultation
                          ? '${item['names'] ?? ''} ${item['surnames'] ?? ''}'
                                    .trim()
                                    .isEmpty
                                ? (item['email'] ?? 'Usuario')
                                : '${item['names'] ?? ''} ${item['surnames'] ?? ''}'
                                      .trim()
                          : (item['client_username'] ??
                                    '${item['client_names'] ?? ''} ${item['client_surnames'] ?? ''}'
                                        .trim())
                                .isEmpty
                          ? 'Cliente'
                          : (item['client_username'] ??
                                '${item['client_names'] ?? ''} ${item['client_surnames'] ?? ''}'
                                    .trim()),
                      item['rating']?.toInt() ?? 5,
                      unreadCount: isConsultation
                          ? (item['unread_count'] ?? 0)
                          : 0,
                      onTap: () async {
                        final otherId = isConsultation
                            ? item['other_user_id']
                            : item['client_id'];

                        if (otherId != null) {
                          await context.push('/chat', extra: otherId);
                          _loadData(); // Refresh after return
                        }
                      },
                    ),
                  ),
                ),
                if (items.length > 5)
                  SizedBox(
                    width: 200,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFC4C4C4),
                        foregroundColor: const Color(0xFF3B28FF),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () {},
                      child: const Text(
                        'Mostrar Más',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _buildUserItem(
    String name,
    int rating, {
    int unreadCount = 0,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
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
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      color: Color(0xFF3B28FF),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Row(
                    children: List.generate(5, (index) {
                      return Icon(
                        index < rating ? Icons.star : Icons.star_outline,
                        color: const Color(0xFFFFD700),
                        size: 20,
                      );
                    }),
                  ),
                ],
              ),
            ),
            if (unreadCount > 0)
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '$unreadCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            if (onTap != null)
              const Icon(Icons.chevron_right, color: Color(0xFF3B28FF)),
          ],
        ),
      ),
    );
  }
}
