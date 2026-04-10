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

  @override
  void initState() {
    super.initState();
    _loadRecentChats();
  }

  Future<void> _loadRecentChats() async {
    if (mounted) setState(() => _isLoadingRecent = true);
    try {
      final res = await _messageService.getConversations();
      if (res.success && mounted) {
        setState(() {
          _recentChats = res.data ?? [];
          _isLoadingRecent = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingRecent = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
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
    final hasUnread = _recentChats.any((c) => (c['unread_count'] ?? 0) > 0);
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: AppColors.softShadow,
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
          if (index == 2) _loadRecentChats();
        },
        backgroundColor: Colors.transparent,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textLight,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: GoogleFonts.outfit(
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
        unselectedLabelStyle: GoogleFonts.outfit(
          fontWeight: FontWeight.w500,
          fontSize: 12,
        ),
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.explore_outlined),
            activeIcon: Icon(Icons.explore),
            label: 'Explorar',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.storefront_outlined),
            activeIcon: Icon(Icons.storefront),
            label: 'Tiendas',
          ),
          BottomNavigationBarItem(
            icon: _buildBadgeIcon(Icons.chat_bubble_outline, hasUnread),
            activeIcon: _buildBadgeIcon(Icons.chat_bubble, hasUnread),
            label: 'Mensajes',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person_outline_rounded),
            activeIcon: Icon(Icons.person_rounded),
            label: 'Perfil',
          ),
        ],
      ),
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
            _buildAvatar(chat['profile_image_url'], true),
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

  Widget _buildAvatar(String? url, bool isOverPrimary) {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: isOverPrimary ? Colors.white24 : AppColors.divider,
          width: 2,
        ),
      ),
      child: CircleAvatar(
        radius: 24,
        backgroundColor: isOverPrimary ? Colors.white12 : AppColors.primaryLight,
        backgroundImage: (url != null && url.isNotEmpty)
            ? NetworkImage(ApiConstants.getStorageUrl(url))
            : null,
        child: (url == null || url.isEmpty)
            ? Icon(Icons.person, color: isOverPrimary ? Colors.white : AppColors.primary)
            : null,
      ),
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
    final name = chat['username'] ?? 'Técnico';
    final lastMsg = chat['last_message'] ?? 'Ver perfil';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppColors.softShadow,
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Stack(
          children: [
            _buildAvatar(chat['profile_image_url'], false),
            if (unread > 0)
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: AppColors.error, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                  child: Text('$unread', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ),
          ],
        ),
        title: Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16)),
        subtitle: Text(lastMsg, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.outfit(fontSize: 13, color: AppColors.textSecondary)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textLight),
        onTap: () => context.push('/chat', extra: {
          'receiverId': chat['other_user_id'],
          'receiverName': name,
          'receiverRole': chat['other_user_role'] ?? 'tech',
        }),
      ),
    );
  }

  Widget _buildProfileTab() {
    return const ProfileScreen();
  }
}
