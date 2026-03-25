import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/message_service.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import '../../../../core/theme/app_colors.dart';
import '../widgets/service_location_map.dart';
import '../widgets/store_map_widget.dart'; // Nuevo

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
            _buildMapTab(), // 0 - Técnicos
            _buildStoresTab(), // 1 - Tiendas
            _buildRecentTechsTab(), // 2 - Mensajes
            _buildProfileTab(), // 3 - Perfil
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNavBar(),
    );
  }

  Widget _buildBottomNavBar() {
    final hasUnread = _recentChats.any((c) => (c['unread_count'] ?? 0) > 0);
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 20,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
          if (index == 2) _loadRecentChats(); // Mensajes ahora es index 2
        },
        backgroundColor: Colors.transparent,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: Colors.grey.shade400,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.map_outlined),
            activeIcon: Icon(Icons.map),
            label: 'Técnicos',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.store_outlined),
            activeIcon: Icon(Icons.store),
            label: 'Tiendas',
          ),
          BottomNavigationBarItem(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.chat_bubble_outline),
                if (hasUnread)
                  Positioned(
                    right: -4,
                    top: -4,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
            activeIcon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.chat_bubble),
                if (hasUnread)
                  Positioned(
                    right: -4,
                    top: -4,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
            label: 'Mensajes',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.account_circle_outlined),
            activeIcon: Icon(Icons.account_circle),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }

  // ─── TAB 1: MAPA DE TÉCNICOS ────────────────────────────────────────────
  Widget _buildMapTab() {
    return Stack(
      children: [
        Column(
          children: [
            // Header
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Explorar Técnicos',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      Text(
                        'Toca el mapa para elegir el punto de servicio',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                  CircleAvatar(
                    backgroundColor: AppColors.primaryLight,
                    radius: 20,
                    child: Icon(
                      Icons.search,
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),

            // Técnico Reciente (sección separada, encima del mapa)
            if (_recentChats.isNotEmpty) _buildRecentBanner(),

            // Mapa
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: ClipRRect(
                  borderRadius: const BorderRadius.all(Radius.circular(24)),
                  child: ServiceLocationMap(
                    isActive: _currentIndex == 0,
                    onLoadingChanged: (loading) {
                      setState(() => _isLoadingSearch = loading);
                    },
                  ),
                ),
              ),
            ),
          ],
        ),

        // Overlay de carga global
        if (_isLoadingSearch)
          Container(
            color: Colors.black26,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical: 20,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: AppColors.intenseShadow,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppColors.primary,
                      ),
                      strokeWidth: 4,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Buscando los mejores técnicos...',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  // ─── TAB 2: MAPA DE TIENDAS ─────────────────────────────────────────────
  Widget _buildStoresTab() {
    return Stack(
      children: [
        Column(
          children: [
            // Header unificado (Estilo SerTec Azul)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tiendas Cercanas',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      Text(
                        'Puntos de servicio autorizados J&P',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                  CircleAvatar(
                    backgroundColor: AppColors.primaryLight,
                    radius: 20,
                    child: Icon(
                      Icons.store,
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),

            // Mapa de Tiendas con mismo estilo que Técnicos
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: ClipRRect(
                  borderRadius: const BorderRadius.all(Radius.circular(24)),
                  child: StoreMapWidget(
                    isActive: _currentIndex == 1,
                    onLoadingChanged: (loading) {
                      setState(() => _isLoadingSearch = loading);
                    },
                  ),
                ),
              ),
            ),
          ],
        ),

        // Overlay de carga global (compartido)
        if (_isLoadingSearch)
          Container(
            color: Colors.black26,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical: 20,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: AppColors.intenseShadow,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppColors.primary,
                      ),
                      strokeWidth: 4,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Buscando tiendas cercanas...',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildRecentBanner() {
    if (_isLoadingRecent) {
      return const SizedBox(
        height: 48,
        child: Center(child: LinearProgressIndicator()),
      );
    }
    final recent = _recentChats.first;
    final unread = (recent['unread_count'] ?? 0) as int;
    final rawUrl = recent['profile_image_url']?.toString();
    final name = recent['username'] ?? 'Técnico';
    final lastMsg = recent['last_message'] ?? 'Sin mensajes recientes';

    return GestureDetector(
      onTap: () =>
          context.push('/technician-profile', extra: recent['other_user_id']),
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppColors.softShadow,
          border: unread > 0
              ? Border.all(
                  color: AppColors.primary.withOpacity(0.3),
                  width: 1.5,
                )
              : null,
        ),
        child: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: AppColors.primaryLight,
                  backgroundImage: (rawUrl != null && rawUrl.isNotEmpty)
                      ? NetworkImage(
                          rawUrl.startsWith('http')
                              ? rawUrl
                              : '${ApiConstants.baseUrl}/$rawUrl',
                        )
                      : null,
                  child: (rawUrl == null || rawUrl.isEmpty)
                      ? const Icon(
                          Icons.person,
                          color: AppColors.primary,
                          size: 22,
                        )
                      : null,
                ),
                if (unread > 0)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '$unread',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Reciente',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    lastMsg,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.primary, size: 18),
          ],
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
            backgroundColor: Colors.white,
            elevation: 0,
            floating: true,
            pinned: false,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Mensajes',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 22,
                  ),
                ),
                Text(
                  'Técnicos con los que hablaste',
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 12,
                    fontWeight: FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
          if (_isLoadingRecent)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_recentChats.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.chat_bubble_outline,
                      size: 72,
                      color: Colors.grey.shade300,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Aún no tienes conversaciones',
                      style: TextStyle(color: Colors.grey, fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Busca técnicos en el Mapa para comenzar',
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _buildRecentTechCard(_recentChats[index]),
                  childCount: _recentChats.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildRecentTechCard(dynamic chat) {
    final unreadCount = chat['unread_count'] ?? 0;
    final rawUrl = chat['profile_image_url']?.toString();
    final name = chat['username'] ?? 'Técnico';
    final lastMsg = chat['last_message'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: AppColors.softShadow,
        border: unreadCount > 0
            ? Border.all(color: AppColors.primary.withOpacity(0.25), width: 1.5)
            : null,
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Stack(
          children: [
            CircleAvatar(
              radius: 26,
              backgroundColor: AppColors.primaryLight,
              backgroundImage: (rawUrl != null && rawUrl.isNotEmpty)
                  ? NetworkImage(
                      rawUrl.startsWith('http')
                          ? rawUrl
                          : '${ApiConstants.baseUrl}/$rawUrl',
                    )
                  : null,
              child: (rawUrl == null || rawUrl.isEmpty)
                  ? const Icon(Icons.person, color: AppColors.primary)
                  : null,
            ),
            if (unreadCount > 0)
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.all(5),
                  decoration: const BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '$unreadCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
        title: Row(
          children: [
            Text(
              name,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            if (unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.green,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Nuevo',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        subtitle: lastMsg.isNotEmpty
            ? Text(
                lastMsg,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
              )
            : const Text(
                'Ver perfil del técnico',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
        trailing: const Icon(Icons.chevron_right, color: AppColors.primary),
        onTap: () =>
            context.push('/technician-profile', extra: chat['other_user_id']),
      ),
    );
  }

  // ─── TAB 3: PERFIL ─────────────────────────────────────────────────────
  Widget _buildProfileTab() {
    return const ProfileScreen();
  }
}
