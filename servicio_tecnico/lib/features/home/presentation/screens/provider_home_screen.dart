import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/services/appointment_service.dart';
import '../../../../core/services/message_service.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/constants/assets.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/widgets/custom_avatar.dart';
import '../../../../core/utils/date_formatter.dart';

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
  List<dynamic> _recentChats = [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _togglingAvailability = false;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final authProvider = context.read<AuthProvider>();
      final proposalsRes = await _appointmentService.getAppointments(status: 'pending');
      final completedRes = await _appointmentService.getAppointments(status: 'completed');
      final consultRes = await _messageService.getConversations();
      
      // Load global profile
      await authProvider.loadProfile();

      if (proposalsRes.success && completedRes.success && consultRes.success) {
        if (mounted) {
          setState(() {
            _profile = authProvider.user != null ? {
              'profile_image_url': authProvider.user!.profileImageUrl,
              'username': authProvider.user!.username,
            } : null;
            
            _proposals = proposalsRes.data ?? [];
            _completedJobs = completedRes.data ?? [];

            final allConsultations = consultRes.data ?? [];
            final proposalClientIds = _proposals.map((p) => p['client_id'].toString()).toSet();

            _consultations = allConsultations.where((c) {
              final otherId = c['other_user_id'].toString();
              return !proposalClientIds.contains(otherId);
            }).toList();
            _recentChats = allConsultations;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _errorMessage = proposalsRes.message ?? completedRes.message ?? consultRes.message;
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

  Future<void> _toggleAvailability() async {
    if (_togglingAvailability) return;
    setState(() => _togglingAvailability = true);
    
    final authProvider = context.read<AuthProvider>();
    final newStatus = !(authProvider.user?.isAvailable ?? true);
    
    try {
      final response = await authProvider.toggleAvailability(newStatus);
      if (mounted) {
        setState(() => _togglingAvailability = false);
        if (response.success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(newStatus ? '✅ Ahora estás Disponible' : '🔴 Ahora estás Inactivo'),
              backgroundColor: newStatus ? Colors.green : Colors.grey[700],
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              duration: const Duration(seconds: 2),
            ),
          );
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

  Widget _buildRecentClientBanner() {
    if (_recentChats.isEmpty) return const SizedBox.shrink();
    
    // Filter to get only clients
    final clients = _recentChats.where((c) => c['other_user_role'] == 'client').toList();
    if (clients.isEmpty) return const SizedBox.shrink();
    
    final recent = clients.first;
    final unread = (recent['unread_count'] ?? 0) as int;
    final name = recent['username'] ?? recent['email'] ?? 'Cliente';
    final lastMsg = recent['last_message'] ?? '';

    return GestureDetector(
      onTap: () async {
        await context.push(
          '/chat',
          extra: {
            'receiverId': recent['other_user_id'],
            'receiverName': name,
            'receiverRole': 'client',
          },
        );
        _loadData();
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(24),
          boxShadow: AppColors.softShadow,
        ),
        child: Row(
          children: [
            Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white24, width: 2),
              ),
              child: CircleAvatar(
                radius: 20,
                backgroundColor: Colors.white12,
                backgroundImage: (recent['profile_image_url'] != null)
                    ? NetworkImage(ApiConstants.getStorageUrl(recent['profile_image_url']))
                    : null,
                child: (recent['profile_image_url'] == null)
                    ? const Icon(Icons.person, color: Colors.white)
                    : null,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    lastMsg,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            if (unread > 0)
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '$unread',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              )
            else
              const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 16),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    
    return Scaffold(
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex,
          children: [
            _buildDashboard(),
            _buildChatTab(),
            _buildProfileTab(),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNavBar(),
    );
  }

  Widget _buildDashboard() {
    final auth = context.watch<AuthProvider>();
    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          children: [
                      // ── Header con Toggle de Disponibilidad ────────────
                      Container(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
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
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                child: Consumer<AuthProvider>(
                                  builder: (context, auth, child) {
                                    final isAvailable = auth.user?.isAvailable ?? true;
                                    return Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isAvailable ? Colors.green.withOpacity(0.05) : Colors.red.withOpacity(0.05),
                                        borderRadius: BorderRadius.circular(15),
                                        border: Border.all(color: isAvailable ? Colors.green.withOpacity(0.3) : Colors.red.withOpacity(0.3)),
                                      ),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Text(
                                                  isAvailable ? 'DISPONIBLE' : 'INACTIVO',
                                                  style: TextStyle(
                                                    color: isAvailable ? Colors.green[700] : Colors.red[700],
                                                    fontWeight: FontWeight.w900,
                                                    fontSize: 10,
                                                    letterSpacing: 0.5,
                                                  ),
                                                ),
                                                Text(
                                                  isAvailable ? 'Visible en mapa' : 'Oculto del radar',
                                                  style: TextStyle(color: Colors.grey[600], fontSize: 9),
                                                ),
                                              ],
                                            ),
                                          ),
                                          _togglingAvailability
                                              ? const SizedBox(
                                                  width: 20,
                                                  height: 20,
                                                  child: CircularProgressIndicator(strokeWidth: 2),
                                                )
                                              : Switch(
                                                  value: isAvailable,
                                                  onChanged: (_) => _toggleAvailability(),
                                                  activeColor: Colors.green,
                                                  activeTrackColor: Colors.green.withOpacity(0.2),
                                                  inactiveThumbColor: Colors.red,
                                                  inactiveTrackColor: Colors.red.withOpacity(0.2),
                                                ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),
                             Row(
                                children: [
                                   IconButton(
                                    onPressed: () => context.push('/notifications'),
                                    icon: const Icon(Icons.notifications_none_rounded, color: AppColors.primary),
                                  ),
                                  GestureDetector(
                                    onTap: () => context.push('/provider-profile'),
                                    child: CustomAvatar(
                                      imageUrl: auth.user?.profileImageUrl != null
                                          ? ApiConstants.getStorageUrl(auth.user!.profileImageUrl!)
                                          : null,
                                      name: auth.user?.username ?? '?',
                                      size: 46,
                                      fontSize: 18,
                                    ),
                                  ),
                                ],
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
                              color: AppColors.getTextPrimary(context),
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
                                  color: AppColors.getTextPrimary(context),
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

                      _buildRecentClientBanner(),

                      const SizedBox(height: 25),
                    ],
                  ),
                ),
    );
  }

  Widget _buildChatTab() {
    return Column(
      children: [
        AppBar(
          title: Text('Mis Mensajes', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          automaticallyImplyLeading: false,
        ),
        Expanded(
          child: _recentChats.isEmpty 
            ? _buildEmptyState(Icons.chat_bubble_outline, 'No hay chats recientes')
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _recentChats.length,
                itemBuilder: (context, index) => _buildRecentChatCard(_recentChats[index]),
              ),
        ),
      ],
    );
  }

  Widget _buildProfileTab() {
    final user = context.watch<AuthProvider>().user;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          CustomAvatar(
            imageUrl: user?.profileImageUrl != null ? ApiConstants.getStorageUrl(user!.profileImageUrl) : null,
            name: user?.username ?? 'Técnico',
            size: 120,
          ),
          const SizedBox(height: 16),
          Text(
            user?.username ?? 'Cargando...',
            style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          Text(
            user?.email ?? '',
            style: GoogleFonts.outfit(color: Colors.grey),
          ),
          const SizedBox(height: 30),
          _buildProfileOption(
            icon: Icons.settings_outlined,
            title: 'Configuración General',
            onTap: () => context.push('/settings'),
          ),
          _buildProfileOption(
            icon: Icons.logout,
            title: 'Cerrar Sesión',
            textColor: Colors.redAccent,
            onTap: () async {
              await context.read<AuthProvider>().logout();
              if (mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }

  Widget _buildProfileOption({required IconData icon, required String title, required VoidCallback onTap, Color? textColor}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.getSurfaceColor(context),
        borderRadius: BorderRadius.circular(16),
      ),
      child: ListTile(
        leading: Icon(icon, color: textColor ?? AppColors.primary),
        title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: textColor)),
        trailing: const Icon(Icons.chevron_right, size: 20),
        onTap: onTap,
      ),
    );
  }

  Widget _buildBottomNavBar() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.getSurfaceColor(context),
        boxShadow: Theme.of(context).brightness == Brightness.dark ? [] : AppColors.softShadow,
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: AppColors.primary,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Panel'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), activeIcon: Icon(Icons.chat_bubble), label: 'Chat'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Perfil'),
        ],
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
    final url = ApiConstants.getStorageUrl(rawUrl);
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
                          await context.push(
                            '/chat',
                            extra: {
                              'receiverId': otherId,
                              'receiverName': _getDisplayName(item, isConsultation),
                              'receiverRole': 'client',
                            },
                          );
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
            CustomAvatar(
              name: name,
              size: 35,
              fontSize: 14,
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
  Widget _buildRecentChatCard(dynamic chat) {
    final unread = chat['unread_count'] ?? 0;
    final name = chat['username'] ?? chat['names'] ?? 'Cliente';
    final lastMsg = chat['last_message_text'] ?? 'Toca para chatear';
    final timeStr = DateFormatter.formatRelative(chat['last_message_time']);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.getSurfaceColor(context),
        borderRadius: BorderRadius.circular(20),
        boxShadow: Theme.of(context).brightness == Brightness.dark ? [] : AppColors.softShadow,
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CustomAvatar(
          name: name,
          imageUrl: chat['profile_image_url'] != null ? ApiConstants.getStorageUrl(chat['profile_image_url']) : null,
          size: 55,
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                name,
                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Text(
              timeStr,
              style: TextStyle(
                fontSize: 11,
                color: unread > 0 ? AppColors.primary : Colors.grey,
                fontWeight: unread > 0 ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
        subtitle: Row(
          children: [
            Expanded(
              child: Text(
                lastMsg,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: unread > 0 ? AppColors.textPrimary : Colors.grey,
                  fontWeight: unread > 0 ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
            if (unread > 0)
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                child: Text(
                  '$unread',
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
          ],
        ),
        onTap: () async {
          await context.push('/chat', extra: {
            'receiverId': chat['other_user_id'],
            'receiverName': name,
            'receiverRole': 'client',
          });
          _loadData();
        },
      ),
    );
  }

  Widget _buildEmptyState(IconData icon, String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            message,
            style: GoogleFonts.outfit(color: Colors.grey, fontSize: 16),
          ),
        ],
      ),
    );
  }
}
