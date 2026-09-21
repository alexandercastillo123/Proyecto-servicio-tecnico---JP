import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart' as anim;
import '../../../../core/services/message_service.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import '../../../../core/theme/app_colors.dart';
import '../widgets/service_location_map.dart';
import '../widgets/store_map_widget.dart';
import '../../../../core/widgets/custom_avatar.dart';
import '../../../../core/utils/date_formatter.dart';
import 'dart:async';

class ClientHomeScreen extends StatefulWidget {
  const ClientHomeScreen({super.key});

  @override
  State<ClientHomeScreen> createState() => _ClientHomeScreenState();
}

class _ClientHomeScreenState extends State<ClientHomeScreen> {
  int _currentIndex = 0;
  bool _isLoadingSearch = false;
  final MessageService _messageService = MessageService();
  List<dynamic> _recentChats = [];
  bool _isLoadingRecent = false;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _loadRecentChats();
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (_currentIndex == 2) {
        _loadRecentChats(silent: true);
      }
    });
  }

  Future<void> _loadRecentChats({bool silent = false}) async {
    if (mounted && !silent) setState(() => _isLoadingRecent = true);
    try {
      final res = await _messageService.getConversations();
      if (res.success && mounted) {
        setState(() {
          _recentChats = res.data ?? [];
          if (!silent) _isLoadingRecent = false;
        });
      }
    } catch (_) {
      if (mounted && !silent) setState(() => _isLoadingRecent = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex,
          children: [
            _buildMapTab(), 
            _buildStoresTab(),
            _buildRecentTechsTab(),
            _buildProfileTab(),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNavBar(),
    );
  }

  Widget _buildBottomNavBar() {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.05),
            blurRadius: 15,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) => setState(() => _currentIndex = index),
            backgroundColor: Colors.transparent,
            elevation: 0,
            type: BottomNavigationBarType.fixed,
            selectedItemColor: AppColors.primary,
            unselectedItemColor: isDark ? Colors.white54 : AppColors.textSecondary,
            selectedLabelStyle: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
            unselectedLabelStyle: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w400,
            ),
            items: [
              _buildNavBarItem(Icons.explore_rounded, Icons.explore_outlined, 'Explorar'),
              _buildNavBarItem(Icons.storefront_rounded, Icons.storefront_outlined, 'Tiendas'),
              _buildNavBarItem(Icons.chat_bubble_rounded, Icons.chat_bubble_outline_rounded, 'Mensajes'),
              _buildNavBarItem(Icons.person_rounded, Icons.person_outline_rounded, 'Perfil'),
            ],
          ),
        ),
      ),
    );
  }

  BottomNavigationBarItem _buildNavBarItem(IconData activeIcon, IconData icon, String label) {
    return BottomNavigationBarItem(
      icon: Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Icon(icon, size: 24),
      ),
      activeIcon: Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(activeIcon, size: 24),
        ),
      ),
      label: label,
    );
  }

  Widget _buildBadgeIcon(IconData icon, bool showBadge) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(icon),
        if (showBadge)
          Positioned(
            right: -2,
            top: -2,
            child: Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
            ),
          ),
      ],
    );
  }

  // ─── TAB 1: MAPA DE TÉCNICOS ────────────────────────────────────────────
  Widget _buildMapTab() {
    return Stack(
      children: [
        Column(
          children: [
            _buildPremiumHeader(
              'Explorar Técnicos',
              'Selecciona un punto para ver técnicos cerca',
              Icons.search_rounded,
            ),

            if (_recentChats.where((c) => c['other_user_role'] == 'tech' || c['other_user_role'] == 'technician').isNotEmpty) 
              anim.FadeInDown(child: _buildRecentTechBanner()),

            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(32),
                    boxShadow: AppColors.premiumShadow,
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(32),
                    child: ServiceLocationMap(
                      isActive: _currentIndex == 0,
                      onLoadingChanged: (loading) {
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (mounted) setState(() => _isLoadingSearch = loading);
                        });
                      },
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        if (_isLoadingSearch) _buildLoadingOverlay('Buscando técnicos expertos...'),
      ],
    );
  }

  // ─── TAB 2: MAPA DE TIENDAS ─────────────────────────────────────────────
  Widget _buildStoresTab() {
    return Stack(
      children: [
        Column(
          children: [
            _buildPremiumHeader(
              'Tiendas Cercanas',
              'Encuentra centros de servicio autorizados',
              Icons.storefront_rounded,
            ),

            if (_recentChats.where((c) => c['other_user_role'] == 'store' || c['other_user_role'] == 'provider').isNotEmpty) 
              anim.FadeInDown(child: _buildRecentStoreBanner()),

            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(32),
                    boxShadow: AppColors.premiumShadow,
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(32),
                    child: StoreMapWidget(
                      isActive: _currentIndex == 1,
                      onLoadingChanged: (loading) {
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (mounted) setState(() => _isLoadingSearch = loading);
                        });
                      },
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        if (_isLoadingSearch) _buildLoadingOverlay('Localizando tiendas J&P...'),
      ],
    );
  }

  Widget _buildPremiumHeader(String title, String subtitle, IconData icon) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
                Text(
                  subtitle,
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => context.push('/notifications'),
            icon: const Icon(Icons.notifications_none_rounded, color: AppColors.primary, size: 28),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: AppColors.primary, size: 24),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentTechBanner() {
    if (_isLoadingRecent) return const SizedBox.shrink();
    
    // Filter to get only techs
    final techs = _recentChats.where((c) => c['other_user_role'] == 'tech' || c['other_user_role'] == 'technician').toList();
    if (techs.isEmpty) return const SizedBox.shrink();
    
    final recent = techs.first;
    final unread = (recent['unread_count'] ?? 0) as int;
    final name = recent['username'] ?? 'Técnico';
    final lastMsg = recent['last_message'] ?? '';

    return _buildBannerWidget(recent, name, lastMsg, unread);
  }

  Widget _buildRecentStoreBanner() {
    if (_isLoadingRecent) return const SizedBox.shrink();
    
    // Filter to get only stores
    final stores = _recentChats.where((c) => c['other_user_role'] == 'store' || c['other_user_role'] == 'provider').toList();
    if (stores.isEmpty) return const SizedBox.shrink();
    
    final recent = stores.first;
    final unread = (recent['unread_count'] ?? 0) as int;
    final name = recent['username'] ?? 'Sucursal J&P';
    final lastMsg = recent['last_message'] ?? '';

    return _buildBannerWidget(recent, name, lastMsg, unread, color: AppColors.textPrimary);
  }

  Widget _buildBannerWidget(dynamic chat, String name, String lastMsg, int unread, {Color? color}) {
    return GestureDetector(
      onTap: () => context.push(
        '/chat',
        extra: {
          'receiverId': chat['other_user_id'],
          'receiverName': name,
          'receiverRole': chat['other_user_role'] ?? 'tech',
        },
      ),
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color ?? AppColors.primary,
          borderRadius: BorderRadius.circular(24),
          boxShadow: AppColors.premiumShadow,
        ),
        child: Row(
          children: [
            _buildAvatar(chat['profile_image_url'], true, name),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    lastMsg,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(
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
                  style: GoogleFonts.outfit(
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

  Widget _buildAvatar(String? url, bool isOverPrimary, String name) {
    return CustomAvatar(
      imageUrl: url != null && url.isNotEmpty ? ApiConstants.getStorageUrl(url) : null,
      name: name,
      size: 48,
      fontSize: 18,
    );
  }

  Widget _buildLoadingOverlay(String message) {
    return anim.FadeIn(
      child: Container(
        color: Colors.white.withOpacity(0.8),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(color: AppColors.primary),
              const SizedBox(height: 16),
              Text(
                message,
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── TAB 2: MENSAJES RECIENTES ─────────────────────────────────────────
  Widget _buildRecentTechsTab() {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadRecentChats,
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: AppColors.background,
            elevation: 0,
            floating: true,
            title: Text(
              'Mensajes',
              style: GoogleFonts.outfit(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w800,
                fontSize: 28,
              ),
            ),
            centerTitle: false,
          ),
          if (_isLoadingRecent)
            const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
          else if (_recentChats.isEmpty)
            _buildEmptyState()
          else
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => anim.FadeInUp(
                    delay: Duration(milliseconds: 100 * index),
                    child: _buildRecentTechCard(_recentChats[index]),
                  ),
                  childCount: _recentChats.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return SliverFillRemaining(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_bubble_outline_rounded, size: 80, color: AppColors.divider),
          const SizedBox(height: 24),
          Text(
            'Sin conversaciones aún',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            'Busca técnicos cerca de ti para empezar',
            style: GoogleFonts.outfit(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentTechCard(dynamic chat) {
    final unread = chat['unread_count'] ?? 0;
    final name = chat['username'] ?? chat['names'] ?? 'Técnico';
    final lastMsg = chat['last_message_text'] ?? chat['last_message'] ?? 'Toca para chatear';
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
            'receiverRole': chat['other_user_role'] ?? 'tech',
          });
          _loadRecentChats();
        },
      ),
    );
  }

  Widget _buildProfileTab() {
    return const ProfileScreen();
  }
}
