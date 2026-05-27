import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import '../../../../core/services/appointment_service.dart';
import '../../../../core/services/message_service.dart';
import '../../../../core/services/user_service.dart';
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

class _ProviderHomeScreenState extends State<ProviderHomeScreen>
    with SingleTickerProviderStateMixin {
  final AppointmentService _appointmentService = AppointmentService();
  final MessageService _messageService = MessageService();
  final UserService _userService = UserService();
  List<dynamic> _proposals = [];
  List<dynamic> _completedJobs = [];
  List<dynamic> _consultations = [];
  List<dynamic> _recentChats = [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _togglingAvailability = false;
  int _currentIndex = 0;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _loadData();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final authProvider = context.read<AuthProvider>();
      final proposalsRes = await _appointmentService.getAppointments(status: 'pending');
      final completedRes = await _appointmentService.getAppointments(status: 'completed');
      final consultRes = await _messageService.getConversations();
      await authProvider.loadProfile();

      if (proposalsRes.success && completedRes.success && consultRes.success) {
        if (mounted) {
          setState(() {
            _proposals = proposalsRes.data ?? [];
            _completedJobs = completedRes.data ?? [];
            final allConsultations = consultRes.data ?? [];
            final proposalClientIds = _proposals.map((p) => p['client_id'].toString()).toSet();
            _consultations = allConsultations.where((c) {
              return !proposalClientIds.contains(c['other_user_id'].toString());
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
              content: Text(
                newStatus ? '✅ Ahora estás Disponible' : '🔴 Ahora estás Inactivo',
                style: GoogleFonts.outfit(),
              ),
              backgroundColor: newStatus ? AppColors.success : Colors.grey[700],
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              margin: const EdgeInsets.all(16),
              duration: const Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) setState(() => _togglingAvailability = false);
    }
  }

  String _getDisplayName(dynamic item, bool isConsultation) {
    if (isConsultation) {
      final username = item['username']?.toString().trim();
      if (username != null && username.isNotEmpty) return username;
      final email = item['email']?.toString().trim();
      return (email != null && email.isNotEmpty) ? email : 'Usuario';
    } else {
      final clientUsername = item['client_username']?.toString().trim();
      if (clientUsername != null && clientUsername.isNotEmpty) return clientUsername;
      final names = '${item['client_names'] ?? ''} ${item['client_surnames'] ?? ''}'.trim();
      return names.isNotEmpty ? names : 'Cliente';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(color: AppColors.primary),
              const SizedBox(height: 16),
              Text(
                'Cargando dashboard...',
                style: GoogleFonts.outfit(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

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

  Widget _buildBottomNavBar() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? Colors.white.withOpacity(0.06) : AppColors.border,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (i) => setState(() => _currentIndex = i),
            backgroundColor: Colors.transparent,
            elevation: 0,
            type: BottomNavigationBarType.fixed,
            selectedItemColor: AppColors.primary,
            unselectedItemColor: isDark ? Colors.white38 : AppColors.textSecondary,
            selectedLabelStyle: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700),
            unselectedLabelStyle: GoogleFonts.outfit(fontSize: 11),
            items: [
              _navItem(Icons.dashboard_rounded, Icons.dashboard_outlined, 'Panel'),
              _navItem(Icons.chat_bubble_rounded, Icons.chat_bubble_outline_rounded, 'Chat'),
              _navItem(Icons.person_rounded, Icons.person_outline_rounded, 'Perfil'),
            ],
          ),
        ),
      ),
    );
  }

  BottomNavigationBarItem _navItem(IconData active, IconData inactive, String label) {
    return BottomNavigationBarItem(
      icon: Padding(
        padding: const EdgeInsets.only(bottom: 2),
        child: Icon(inactive, size: 24),
      ),
      activeIcon: Padding(
        padding: const EdgeInsets.only(bottom: 2),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(active, size: 24),
        ),
      ),
      label: label,
    );
  }

  Widget _buildDashboard() {
    final auth = context.watch<AuthProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ──────────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              decoration: BoxDecoration(
                gradient: isDark
                    ? const LinearGradient(
                        colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                      )
                    : const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                      ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Image.asset(AppAssets.logo, height: 36, fit: BoxFit.contain),
                      const Spacer(),
                      IconButton(
                        onPressed: () => context.push('/notifications'),
                        icon: Icon(
                          Icons.notifications_none_rounded,
                          color: isDark ? AppColors.primary : Colors.white,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => context.push('/provider-profile'),
                        child: Consumer<AuthProvider>(
                          builder: (context, auth, _) => CustomAvatar(
                            imageUrl: auth.user?.profileImageUrl != null
                                ? ApiConstants.getStorageUrl(auth.user!.profileImageUrl!)
                                : null,
                            name: auth.user?.username ?? '?',
                            size: 42,
                            fontSize: 16,
                            showBorder: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Availability toggle
                  Consumer<AuthProvider>(
                    builder: (context, auth, _) {
                      final isAvailable = auth.user?.isAvailable ?? true;
                      return GestureDetector(
                        onTap: _toggleAvailability,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(isDark ? 0.06 : 0.15),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.15),
                            ),
                          ),
                          child: Row(
                            children: [
                              AnimatedBuilder(
                                animation: _pulseAnimation,
                                builder: (context, _) => Transform.scale(
                                  scale: isAvailable ? _pulseAnimation.value : 1.0,
                                  child: Container(
                                    width: 10,
                                    height: 10,
                                    decoration: BoxDecoration(
                                      color: isAvailable
                                          ? const Color(0xFF34D399)
                                          : Colors.grey[400],
                                      shape: BoxShape.circle,
                                      boxShadow: isAvailable
                                          ? [
                                              BoxShadow(
                                                color: const Color(0xFF34D399).withOpacity(0.5),
                                                blurRadius: 8,
                                                spreadRadius: 2,
                                              ),
                                            ]
                                          : [],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      isAvailable ? 'DISPONIBLE' : 'INACTIVO',
                                      style: GoogleFonts.outfit(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 12,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                    Text(
                                      isAvailable ? 'Visible en el mapa' : 'Oculto del radar',
                                      style: GoogleFonts.outfit(
                                        color: Colors.white.withOpacity(0.65),
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              _togglingAvailability
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : Switch(
                                      value: isAvailable,
                                      onChanged: (_) => _toggleAvailability(),
                                      activeColor: const Color(0xFF34D399),
                                      activeTrackColor: const Color(0xFF34D399).withOpacity(0.3),
                                      inactiveThumbColor: Colors.grey[400],
                                      inactiveTrackColor: Colors.grey.withOpacity(0.2),
                                    ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            // ── Stats row ───────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Row(
                children: [
                  Expanded(
                    child: FadeInLeft(
                      duration: const Duration(milliseconds: 500),
                      child: _buildStatCard(
                        icon: Icons.pending_actions_rounded,
                        label: 'Propuestas',
                        value: '${_proposals.length}',
                        color: AppColors.warning,
                        isDark: isDark,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FadeInRight(
                      duration: const Duration(milliseconds: 500),
                      child: _buildStatCard(
                        icon: Icons.check_circle_rounded,
                        label: 'Completados',
                        value: '${_completedJobs.length}',
                        color: AppColors.success,
                        isDark: isDark,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FadeInRight(
                      duration: const Duration(milliseconds: 500),
                      delay: const Duration(milliseconds: 100),
                      child: _buildStatCard(
                        icon: Icons.chat_bubble_rounded,
                        label: 'Consultas',
                        value: '${_consultations.length}',
                        color: AppColors.primary,
                        isDark: isDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Consultations ────────────────────────────────────────────
            _buildSectionHeader(context, 'Consultas de Clientes', isDark),
            const SizedBox(height: 12),
            _buildSection(_consultations, 'No hay consultas nuevas', isConsultation: true, isDark: isDark),

            const SizedBox(height: 20),

            // ── Proposals ────────────────────────────────────────────────
            _buildSectionHeader(
              context,
              'Propuestas de Chamba',
              isDark,
              badge: _proposals.isNotEmpty ? '${_proposals.length}' : null,
            ),
            const SizedBox(height: 12),
            _buildSection(_proposals, 'No hay propuestas pendientes', isConsultation: false, isDark: isDark),

            const SizedBox(height: 20),

            // ── Completed ────────────────────────────────────────────────
            _buildSectionHeader(context, 'Trabajos Completados', isDark),
            const SizedBox(height: 12),
            _buildSection(_completedJobs, 'No hay trabajos completados', isConsultation: false, isDark: isDark),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : AppColors.border,
        ),
        boxShadow: isDark ? [] : AppColors.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: AppColors.getTextPrimary(context),
              letterSpacing: -0.5,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 11,
              color: AppColors.getTextSecondary(context),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(
    BuildContext context,
    String title,
    bool isDark, {
    String? badge,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Text(
            title,
            style: GoogleFonts.outfit(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: AppColors.getTextPrimary(context),
              letterSpacing: -0.3,
            ),
          ),
          if (badge != null) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                badge,
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSection(
    List<dynamic> items,
    String emptyMessage, {
    bool isConsultation = false,
    required bool isDark,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : AppColors.border,
        ),
        boxShadow: isDark ? [] : AppColors.softShadow,
      ),
      child: items.isEmpty
          ? Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  Icon(
                    Icons.inbox_rounded,
                    color: AppColors.textLight,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    emptyMessage,
                    style: GoogleFonts.outfit(
                      color: AppColors.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            )
          : Column(
              children: items.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                return Column(
                  children: [
                    _buildUserItem(
                      _getDisplayName(item, isConsultation),
                      item['rating']?.toInt() ?? 5,
                      unreadCount: isConsultation ? (item['unread_count'] ?? 0) : 0,
                      imageUrl: item['profile_image_url'],
                      isDark: isDark,
                      onTap: () async {
                        final otherId = isConsultation
                            ? item['other_user_id']
                            : item['client_id'];
                        if (otherId != null) {
                          await context.push('/chat', extra: {
                            'receiverId': otherId,
                            'receiverName': _getDisplayName(item, isConsultation),
                            'receiverRole': 'client',
                          });
                          _loadData();
                        }
                      },
                    ),
                    if (index < items.length - 1)
                      Divider(
                        height: 1,
                        color: isDark
                            ? Colors.white.withOpacity(0.06)
                            : AppColors.divider,
                        indent: 72,
                      ),
                  ],
                );
              }).toList(),
            ),
    );
  }

  Widget _buildUserItem(
    String name,
    int rating, {
    int unreadCount = 0,
    String? imageUrl,
    required bool isDark,
    VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              CustomAvatar(
                name: name,
                imageUrl: imageUrl != null && imageUrl.isNotEmpty
                    ? ApiConstants.getStorageUrl(imageUrl)
                    : null,
                size: 44,
                fontSize: 16,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.outfit(
                        color: AppColors.primary,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Row(
                      children: List.generate(
                        5,
                        (index) => Icon(
                          index < rating
                              ? Icons.star_rounded
                              : Icons.star_outline_rounded,
                          color: const Color(0xFFFBBF24),
                          size: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (unreadCount > 0)
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '$unreadCount',
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                )
              else
                Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.textLight,
                  size: 20,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChatTab() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
          color: isDark ? const Color(0xFF0F172A) : Colors.white,
          child: Row(
            children: [
              Text(
                'Mensajes',
                style: GoogleFonts.outfit(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: AppColors.getTextPrimary(context),
                  letterSpacing: -0.5,
                ),
              ),
              if (_recentChats.isNotEmpty) ...[
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${_recentChats.length}',
                    style: GoogleFonts.outfit(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        Expanded(
          child: _recentChats.isEmpty
              ? _buildEmptyState(Icons.chat_bubble_outline_rounded, 'No hay chats recientes')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _recentChats.length,
                  itemBuilder: (context, index) => FadeInUp(
                    delay: Duration(milliseconds: 60 * index),
                    child: _buildRecentChatCard(_recentChats[index]),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildProfileTab() {
    final user = context.watch<AuthProvider>().user;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      child: Column(
        children: [
          // Profile hero
          Container(
            padding: const EdgeInsets.fromLTRB(20, 40, 20, 32),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF4F46E5), Color(0xFF7C3AED), Color(0xFF0F172A)],
                stops: [0.0, 0.55, 1.0],
              ),
            ),
            child: Column(
              children: [
                CustomAvatar(
                  imageUrl: user?.profileImageUrl != null
                      ? ApiConstants.getStorageUrl(user!.profileImageUrl!)
                      : null,
                  name: user?.username ?? 'Técnico',
                  size: 90,
                  fontSize: 32,
                  showBorder: true,
                ),
                const SizedBox(height: 14),
                Text(
                  user?.username ?? 'Cargando...',
                  style: GoogleFonts.outfit(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? '',
                  style: GoogleFonts.outfit(
                    color: Colors.white.withOpacity(0.65),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                const SizedBox(height: 8),
                _buildProfileOption(
                  context,
                  icon: Icons.settings_outlined,
                  title: 'Configuración General',
                  subtitle: 'Privacidad, notificaciones y más',
                  onTap: () => context.push('/settings'),
                  isDark: isDark,
                ),
                const SizedBox(height: 10),
                _buildProfileOption(
                  context,
                  icon: Icons.logout_rounded,
                  title: 'Cerrar Sesión',
                  subtitle: 'Salir de tu cuenta',
                  isDestructive: true,
                  isDark: isDark,
                  onTap: () async {
                    await context.read<AuthProvider>().logout();
                    if (mounted) context.go('/login');
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool isDestructive = false,
    required bool isDark,
  }) {
    final color = isDestructive ? AppColors.error : AppColors.primary;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDestructive
              ? AppColors.error.withOpacity(0.2)
              : (isDark ? Colors.white.withOpacity(0.06) : AppColors.border),
        ),
        boxShadow: isDark ? [] : AppColors.softShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: isDestructive
                              ? AppColors.error
                              : AppColors.getTextPrimary(context),
                        ),
                      ),
                      Text(
                        subtitle,
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          color: AppColors.getTextSecondary(context),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded, color: AppColors.textLight, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRecentChatCard(dynamic chat) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final unread = chat['unread_count'] ?? 0;
    final name = chat['username'] ?? chat['names'] ?? 'Cliente';
    final lastMsg = chat['last_message_text'] ?? 'Toca para chatear';
    final timeStr = DateFormatter.formatRelative(chat['last_message_time']);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : AppColors.border,
        ),
        boxShadow: isDark ? [] : AppColors.softShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () async {
            await context.push('/chat', extra: {
              'receiverId': chat['other_user_id'],
              'receiverName': name,
              'receiverRole': 'client',
            });
            _loadData();
          },
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                CustomAvatar(
                  name: name,
                  imageUrl: chat['profile_image_url'] != null
                      ? ApiConstants.getStorageUrl(chat['profile_image_url'])
                      : null,
                  size: 50,
                  fontSize: 18,
                  showOnlineIndicator: true,
                  isOnline: false,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                                color: AppColors.getTextPrimary(context),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            timeStr,
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              color: unread > 0 ? AppColors.primary : AppColors.textLight,
                              fontWeight: unread > 0 ? FontWeight.w700 : FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              lastMsg,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.outfit(
                                color: unread > 0
                                    ? AppColors.getTextPrimary(context)
                                    : AppColors.textSecondary,
                                fontWeight: unread > 0 ? FontWeight.w600 : FontWeight.w400,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          if (unread > 0)
                            Container(
                              margin: const EdgeInsets.only(left: 8),
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '$unread',
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
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
      ),
    );
  }

  Widget _buildEmptyState(IconData icon, String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 48, color: AppColors.primary.withOpacity(0.4)),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: GoogleFonts.outfit(
              color: AppColors.textSecondary,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
