import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/appointment_service.dart';
import '../../../../core/services/message_service.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/constants/assets.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/theme/app_colors.dart';

class ProviderHomeScreen extends StatefulWidget {
  const ProviderHomeScreen({super.key});

  @override
  State<ProviderHomeScreen> createState() => _ProviderHomeScreenState();
}

class _ProviderHomeScreenState extends State<ProviderHomeScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  final MessageService _messageService = MessageService();
  final UserService _userService = UserService();
  Map<String, dynamic>? _profile;
  List<dynamic> _proposals = [];
  List<dynamic> _completedJobs = [];
  List<dynamic> _consultations = [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _isAvailable = true; // Estado activo/inactivo del técnico
  bool _togglingAvailability = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final proposalsRes = await _appointmentService.getAppointments(
        status: 'pending',
      );
      final completedRes = await _appointmentService.getAppointments(
        status: 'completed',
      );
      final consultRes = await _messageService.getConversations();
      final profileRes = await _userService.getProfile();

      if (proposalsRes.success && completedRes.success && consultRes.success) {
        if (mounted) {
          setState(() {
            if (profileRes.success) {
              _profile = profileRes.data;
              _isAvailable = _profile?['is_available'] != false;
            }
            _proposals = proposalsRes.data ?? [];
            _completedJobs = completedRes.data ?? [];

            // Excluir de consultas a quienes ya tienen propuesta activa
            final allConsultations = consultRes.data ?? [];
            final proposalClientIds = _proposals
                .map((p) => p['client_id'].toString())
                .toSet();

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

  /// Cambia el estado activo/inactivo del técnico
  Future<void> _toggleAvailability() async {
    if (_togglingAvailability) return;
    setState(() => _togglingAvailability = true);
    final newStatus = !_isAvailable;
    try {
      final response = await ApiService().patch(
        '${ApiConstants.baseUrl}/users/availability',
        {'is_available': newStatus},
        requiresAuth: true,
      );
      if (mounted) {
        if (response.success) {
          setState(() {
            _isAvailable = newStatus;
            _togglingAvailability = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                newStatus
                    ? '✅ Ahora estás Disponible'
                    : '🔴 Ahora estás Inactivo',
              ),
              backgroundColor: newStatus ? Colors.green : Colors.grey[700],
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              duration: const Duration(seconds: 2),
            ),
          );
        } else {
          setState(() => _togglingAvailability = false);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _togglingAvailability = false);
    }
  }

  /// Extrae el nombre a mostrar según el tipo de item
  /// [isConsultation]: true = getConversations (usa 'username')
  ///                   false = getAppointments (usa 'client_username')
  String _getDisplayName(dynamic item, bool isConsultation) {
    if (isConsultation) {
      final username = item['username']?.toString().trim();
      if (username != null && username.isNotEmpty) return username;
      final email = item['email']?.toString().trim();
      return (email != null && email.isNotEmpty) ? email : 'Usuario';
    } else {
      final clientUsername = item['client_username']?.toString().trim();
      if (clientUsername != null && clientUsername.isNotEmpty) {
        return clientUsername;
      }
      final names =
          '${item['client_names'] ?? ''} ${item['client_surnames'] ?? ''}'
              .trim();
      return names.isNotEmpty ? names : 'Cliente';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
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
                      // ── Header con Toggle de Disponibilidad ────────────
                      Container(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                        color: Colors.white,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Image.asset(
                              AppAssets.logo,
                              height: 40,
                              fit: BoxFit.contain,
                            ),
                            // Toggle Activo/Inactivo (Diseño más Premium e Intuitivo)
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                ),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _isAvailable
                                        ? Colors.green.withOpacity(0.05)
                                        : Colors.red.withOpacity(0.05),
                                    borderRadius: BorderRadius.circular(15),
                                    border: Border.all(
                                      color: _isAvailable
                                          ? Colors.green.withOpacity(0.3)
                                          : Colors.red.withOpacity(0.3),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              _isAvailable
                                                  ? 'DISPONIBLE'
                                                  : 'INACTIVO',
                                              style: TextStyle(
                                                color: _isAvailable
                                                    ? Colors.green[700]
                                                    : Colors.red[700],
                                                fontWeight: FontWeight.w900,
                                                fontSize: 10,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                            Text(
                                              _isAvailable
                                                  ? 'Visible en mapa'
                                                  : 'Oculto del radar',
                                              style: TextStyle(
                                                color: Colors.grey[600],
                                                fontSize: 9,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      _togglingAvailability
                                          ? const SizedBox(
                                              width: 20,
                                              height: 20,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                              ),
                                            )
                                          : Switch(
                                              value: _isAvailable,
                                              onChanged: (_) =>
                                                  _toggleAvailability(),
                                              activeColor: Colors.green,
                                              activeTrackColor: Colors.green
                                                  .withOpacity(0.2),
                                              inactiveThumbColor: Colors.red,
                                              inactiveTrackColor: Colors.red
                                                  .withOpacity(0.2),
                                            ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            // Avatar
                            GestureDetector(
                              onTap: () => context.push('/provider-profile'),
                              child: Container(
                                width: 46,
                                height: 46,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: AppColors.primaryGradient,
                                  boxShadow: AppColors.softShadow,
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(2.0),
                                  child: Container(
                                    decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                    ),
                                    child: ClipOval(
                                      child: _buildProfileImage(),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 10),

                      // ── Consultas de Clientes ────────────────────────────
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Consultas de Clientes',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      _buildSection(
                        _consultations,
                        'No hay consultas nuevas',
                        isConsultation: true,
                      ),

                      const SizedBox(height: 16),

                      // ── Propuestas de Chamba (con badge) ─────────────────
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(
                          children: [
                            Text(
                              'Propuestas de Chamba',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (_proposals.isNotEmpty) ...[
                              const SizedBox(width: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.red,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '${_proposals.length} nueva${_proposals.length > 1 ? 's' : ''}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      _buildSection(
                        _proposals,
                        'No hay propuestas pendientes',
                        isConsultation: false,
                      ),

                      const SizedBox(height: 30),

                      // ── Trabajos Completados ─────────────────────────────
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 20),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Trabajos Completados',
                            style: TextStyle(
                              color: Color(0xFF3B28FF),
                              fontSize: 18,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      _buildSection(
                        _completedJobs,
                        'No hay trabajos completados',
                        isConsultation: false,
                      ),

                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  /// Construye la imagen de perfil del técnico con fallback al ícono
  Widget _buildProfileImage() {
    final rawUrl = _profile?['profile_image_url']?.toString().trim();
    if (rawUrl == null || rawUrl.isEmpty) {
      return const Icon(
        Icons.person_outline,
        size: 35,
        color: Color(0xFF3B28FF),
      );
    }
    final url = rawUrl.startsWith('http')
        ? rawUrl
        : '${ApiConstants.baseUrl}${rawUrl.startsWith('/') ? '' : '/'}$rawUrl';
    return Image.network(
      url,
      width: 50,
      height: 50,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) =>
          const Icon(Icons.person_outline, size: 35, color: Color(0xFF3B28FF)),
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: AppColors.softShadow,
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
                      _getDisplayName(item, isConsultation),
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
                gradient: unreadCount > 0 ? AppColors.primaryGradient : null,
                border: unreadCount == 0
                    ? Border.all(color: AppColors.primaryLight, width: 2)
                    : null,
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
