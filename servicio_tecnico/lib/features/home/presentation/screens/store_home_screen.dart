import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/services/store_service.dart';
import '../../../../core/services/message_service.dart';
import '../../../../core/models/store.dart';
import '../../../../core/models/store_product.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/services/api_service.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class StoreHomeScreen extends StatefulWidget {
  const StoreHomeScreen({super.key});

  @override
  State<StoreHomeScreen> createState() => _StoreHomeScreenState();
}

class _StoreHomeScreenState extends State<StoreHomeScreen> {
  int _selectedIndex = 0;
  final StoreService _storeService = StoreService();
  final MessageService _messageService = MessageService();
  List<StoreProduct> _products = [];
  List<dynamic> _recentChats = [];
  List<dynamic> _orders = []; // Nueva lista para pedidos
  bool _loadingProducts = true;
  bool _loadingRecent = false;
  bool _loadingOrders = false; // Estado de carga de pedidos
  Store? _myStore;

  @override
  void initState() {
    super.initState();
    _loadStoreData();
    _loadRecentChats();
    _loadOrders(); // Cargar pedidos al iniciar
  }

  /// Cargar pedidos de la sucursal
  Future<void> _loadOrders() async {
    if (_myStore == null) return;
    if (mounted) setState(() => _loadingOrders = true);
    try {
      final res = await _storeService.getStoreOrders(_myStore!.id);
      if (res.success && mounted) {
        setState(() {
          _orders = res.data ?? [];
          _loadingOrders = false;
        });
      } else {
        if (mounted) setState(() => _loadingOrders = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loadingOrders = false);
    }
  }

  Future<void> _loadRecentChats() async {
    if (mounted) setState(() => _loadingRecent = true);
    try {
      final res = await _messageService.getConversations();
      if (res.success && mounted) {
        setState(() {
          _recentChats = res.data ?? [];
          _loadingRecent = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingRecent = false);
    }
  }

  Future<void> _loadStoreData() async {
    if (mounted) setState(() => _loadingProducts = true);
    try {
      final resStore = await _storeService.getMyStore();
      if (resStore.success && mounted) {
        setState(() {
          _myStore = resStore.data;
        });
        if (_myStore != null) {
          _loadProducts();
          _loadOrders(); // Cargar pedidos una vez obtenida la sucursal
        } else {
          setState(() => _loadingProducts = false);
        }
      } else {
        if (mounted) setState(() => _loadingProducts = false);
      }
    } catch (e) {
      if (mounted) setState(() => _loadingProducts = false);
    }
  }

  Future<void> _loadProducts() async {
    if (_myStore == null) return;
    try {
      final res = await _storeService.getStoreProducts(_myStore!.id);
      if (mounted) {
        setState(() {
          _products = res.data ?? [];
          _loadingProducts = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loadingProducts = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: IndexedStack(
          index: _selectedIndex,
          children: [
            _buildDashboard(user),
            _buildCatalog(),
            _buildOrdersTab(), // Nueva pestaña de pedidos
            _buildMessagesTab(),
            _buildProfile(user),
          ],
        ),
      ),
      floatingActionButton: _selectedIndex == 1
          ? FloatingActionButton(
              onPressed: _showAddProductDialog,
              backgroundColor: AppColors.primary,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (i) {
          setState(() => _selectedIndex = i);
          if (i == 2) _loadOrders();
          if (i == 3) _loadRecentChats();
        },
        selectedItemColor: AppColors.primary,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Panel'),
          BottomNavigationBarItem(icon: Icon(Icons.inventory_2), label: 'Catálogo'),
          BottomNavigationBarItem(icon: Icon(Icons.shopping_cart), label: 'Pedidos'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble), label: 'Mensajes'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
    );
  }

  Widget _buildRecentClientBanner() {
    if (_recentChats.isEmpty) return const SizedBox.shrink();
    
    // Filtrar para obtener solo clientes
    final clients = _recentChats.where((c) => c['other_user_role'] == 'client').toList();
    if (clients.isEmpty) return const SizedBox.shrink();
    
    final recent = clients.first;
    final unread = (recent['unread_count'] ?? 0) as int;
    final name = recent['username'] ?? recent['email'] ?? 'Cliente';
    final lastMsg = recent['last_message'] ?? '';

    return GestureDetector(
      onTap: () async {
        await context.push('/chat', extra: recent['other_user_id']);
        _loadRecentChats();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 25),
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

  Widget _buildDashboard(user) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '¡Hola!',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    _myStore?.name ?? (user?.role == 'sucursal' ? 'Sucursal J&P' : 'Rol: Administrador'),
                    style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => setState(() => _selectedIndex = 3),
                child: CircleAvatar(
                  radius: 25,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  backgroundImage: (_myStore?.imageUrl != null)
                      ? NetworkImage(ApiConstants.getStorageUrl(_myStore!.imageUrl))
                      : null,
                  child: (_myStore?.imageUrl == null)
                      ? const Icon(Icons.store, color: AppColors.primary, size: 30)
                      : null,
                ),
              ),
            ],
          ),
          if (_myStore == null && !_loadingProducts) ...[
            const SizedBox(height: 30),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.orange[50],
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.orange[200]!),
              ),
              child: Column(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 40),
                  const SizedBox(height: 12),
                  const Text(
                    'Sucursal no vinculada',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Su cuenta no tiene una sucursal asignada en el sistema. Las sucursales son gestionadas directamente por el administrador principal.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: _loadStoreData,
                    icon: const Icon(Icons.refresh),
                    label: const Text('REINTENTAR CARGA'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          const SizedBox(height: 25),
          _buildRecentClientBanner(),
          const SizedBox(height: 30),
          Row(
            children: [
              _buildStatCard('Productos', '${_products.length}', Icons.inventory_2_outlined, Colors.blue),
              const SizedBox(width: 15),
              _buildStatCard('Citas Hoy', '0', Icons.event_note_outlined, Colors.orange),
            ],
          ),
          const SizedBox(height: 30),
          const Text('Actividad Reciente', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 15),
          if (_loadingRecent)
            const Center(child: LinearProgressIndicator())
          else if (_recentChats.where((c) => c['other_user_role'] == 'client').isEmpty)
            _buildEmptyState(Icons.chat_bubble_outline, 'No hay actividad de clientes aún')
          else
            ..._recentChats.where((c) => c['other_user_role'] == 'client').take(3).map((chat) => _buildRecentChatCard(chat)),
        ],
      ),
    );
  }

  Widget _buildEmptyState(IconData icon, String message) {
    return Container(
      padding: const EdgeInsets.all(30),
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppColors.softShadow,
      ),
      child: Column(
        children: [
          Icon(icon, size: 40, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text(message, style: TextStyle(color: Colors.grey[600]), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  /// Construir la pestaña de Gestión de Pedidos
  Widget _buildOrdersTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Gestión de Pedidos', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              IconButton(onPressed: _loadOrders, icon: const Icon(Icons.refresh, color: AppColors.primary)),
            ],
          ),
        ),
        if (_loadingOrders)
          const Expanded(child: Center(child: CircularProgressIndicator()))
        else if (_orders.isEmpty)
          Expanded(child: Center(child: _buildEmptyState(Icons.inbox_outlined, 'No hay pedidos registrados')))
        else
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: _orders.length,
              itemBuilder: (context, index) => _buildOrderCard(_orders[index]),
            ),
          ),
      ],
    );
  }

  /// Tarjeta de pedido individual
  Widget _buildOrderCard(dynamic order) {
    final status = order['status'] ?? 'pending';
    final product = order['product_name'] ?? 'Producto';
    final client = order['client_name'] ?? 'Cliente';
    final date = order['created_at'] != null 
        ? DateTime.parse(order['created_at']) 
        : DateTime.now();
    final total = double.tryParse(order['total_price']?.toString() ?? '0') ?? 0.0;
    
    Color statusColor = Colors.orange;
    String statusText = 'Pendiente';
    IconData statusIcon = Icons.access_time_rounded;
    
    switch(status) {
      case 'confirmed': 
        statusColor = AppColors.primary; 
        statusText = 'Confirmado'; 
        statusIcon = Icons.check_circle_outline_rounded;
        break;
      case 'shipped': 
        statusColor = Colors.purple; 
        statusText = 'En camino'; 
        statusIcon = Icons.local_shipping_outlined;
        break;
      case 'delivered': 
        statusColor = Colors.teal; 
        statusText = 'Entregado'; 
        statusIcon = Icons.home_work_outlined;
        break;
      case 'completed': 
        statusColor = Colors.green; 
        statusText = 'Completado'; 
        statusIcon = Icons.verified_user_outlined;
        break;
      case 'cancelled': 
        statusColor = AppColors.error; 
        statusText = 'Cancelado'; 
        statusIcon = Icons.cancel_outlined;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.white, Colors.grey[50]!],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: statusColor.withValues(alpha: 0.1)),
                    ),
                    child: Icon(statusIcon, color: statusColor, size: 26),
                  ),
                  const SizedBox(width: 18),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product,
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.person_outline, size: 14, color: Colors.grey[500]),
                            const SizedBox(width: 4),
                            Text(
                              client,
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'S/ ${total.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '#ORD-${order['id']}',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[600],
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Colors.grey[100]!)),
              ),
              child: Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                runSpacing: 8,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.calendar_today, size: 12, color: Colors.grey[400]),
                      const SizedBox(width: 6),
                      Text(
                        '${date.day}/${date.month}/${date.year}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      statusText.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (status == 'pending')
                        _buildActionButton(
                          label: 'CONFIRMAR',
                          icon: Icons.check,
                          color: AppColors.success,
                          onPressed: () => _updateStatus(order['id'], 'confirmed'),
                        ),
                      if (status == 'confirmed')
                        _buildActionButton(
                          label: 'ENVIAR',
                          icon: Icons.local_shipping,
                          color: Colors.indigo,
                          onPressed: () => _updateStatus(order['id'], 'shipped'),
                        ),
                      const SizedBox(width: 6),
                      if (order['delivery_address'] != null)
                        GestureDetector(
                          onTap: () {
                            if (order['delivery_address'] != null) {
                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  title: const Row(
                                    children: [
                                      Icon(Icons.location_on_rounded, color: Colors.green),
                                      SizedBox(width: 8),
                                      Text('Dirección de Entrega', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                                    ],
                                  ),
                                  content: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(order['delivery_address'] ?? 'Dirección no disponible', style: const TextStyle(fontSize: 16)),
                                      if (order['latitude'] != null && order['longitude'] != null) ...[
                                        const SizedBox(height: 16),
                                        Container(
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(12)),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.explore_outlined, color: Colors.grey),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  'Lat: ${order['latitude']}\nLng: ${order['longitude']}',
                                                  style: TextStyle(color: Colors.grey[800], fontSize: 13, fontFamily: 'monospace'),
                                                ),
                                              ),
                                            ],
                                          ),
                                        )
                                      ]
                                    ],
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: const Text('CERRAR', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                                    )
                                  ],
                                ),
                              );
                            }
                          },
                          child: Container(
                            margin: const EdgeInsets.only(right: 6),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.green[50],
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: Colors.green[100]!),
                            ),
                            child: const Icon(Icons.location_on_rounded, color: Colors.green, size: 20),
                          ),
                        ),
                      GestureDetector(
                        onTap: () => context.push('/chat', extra: order['client_id']),
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.blue[50],
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Colors.blue[100]!),
                          ),
                          child: const Icon(Icons.chat_bubble_outline_rounded, color: Colors.blue, size: 20),
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
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 14),
      label: Text(
        label,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withValues(alpha: 0.1),
        foregroundColor: color,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ).copyWith(
        side: WidgetStateProperty.all(BorderSide(color: color.withValues(alpha: 0.2))),
      ),
    );
  }

  /// Cambiar estado de un pedido profesionalmente
  Future<void> _updateStatus(int orderId, String newStatus) async {
    // Mostrar cargando
    showDialog(context: context, barrierDismissible: false, builder: (c) => const Center(child: CircularProgressIndicator()));
    
    final res = await _storeService.updateOrderStatus(orderId, newStatus);
    
    if (mounted) Navigator.pop(context); // Quitar cargando

    if (res.success) {
      _loadOrders();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ El pedido ha sido marcado como: ${newStatus.toUpperCase()}'),
            backgroundColor: Colors.green[800],
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          )
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Error: ${res.message}'), backgroundColor: Colors.red)
        );
      }
    }
  }

  Widget _buildMessagesTab() {
    return _recentChats.isEmpty
        ? Center(child: _buildEmptyState(Icons.chat_bubble_outline, 'No tienes mensajes aún'))
        : Column(
            children: [
              const Padding(
                padding: EdgeInsets.all(20),
                child: Text('Mensajes de Clientes', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _recentChats.length,
                  itemBuilder: (context, index) => _buildRecentChatCard(_recentChats[index]),
                ),
              ),
            ],
          );
  }

  Widget _buildRecentChatCard(dynamic chat) {
    final name = chat['username'] ?? 'Cliente';
    final lastMsg = chat['last_message'] ?? 'Consulta';
    final unread = (chat['unread_count'] ?? 0) > 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
          child: const Icon(Icons.person, color: AppColors.primary),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(lastMsg, maxLines: 1, overflow: TextOverflow.ellipsis),
        trailing: unread ? const CircleAvatar(radius: 5, backgroundColor: Colors.red) : const Icon(Icons.chevron_right),
        onTap: () => context.push('/chat', extra: chat['other_user_id']),
      ),
    );
  }

  Widget _buildCatalog() {
    if (_loadingProducts) return const Center(child: CircularProgressIndicator());

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Gestionar Catálogo', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: -1)),
                  if (_myStore != null) 
                    Text('Sucursal: ${_myStore!.name}', style: TextStyle(color: Colors.grey[600])),
                ],
              ),
              ElevatedButton.icon(
                onPressed: _showAddProductDialog,
                icon: const Icon(Icons.add_rounded, size: 20),
                label: const Text('NUEVO'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: _products.isEmpty
              ? Center(child: _buildEmptyState(Icons.inventory_2_outlined, 'Aún no tienes productos\nAgrega uno para comenzar'))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _products.length,
                  itemBuilder: (context, index) {
                    final p = _products[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.05)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 15,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: IntrinsicHeight(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Imagen del producto
                              Container(
                                width: 100,
                                decoration: BoxDecoration(
                                  color: Colors.grey[100],
                                  image: (p.imageUrl != null && p.imageUrl!.isNotEmpty)
                                      ? DecorationImage(
                                          image: NetworkImage(ApiConstants.getStorageUrl(p.imageUrl)),
                                          fit: BoxFit.cover,
                                        )
                                      : null,
                                ),
                                child: (p.imageUrl == null || p.imageUrl!.isEmpty)
                                    ? const Icon(Icons.shopping_bag_outlined, color: Colors.grey, size: 30)
                                    : null,
                              ),
                              // Información
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              p.name,
                                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: (p.isAvailable) ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              (p.isAvailable) ? 'ACTIVO' : 'INACTIVO',
                                              style: TextStyle(
                                                color: (p.isAvailable) ? Colors.green : Colors.red,
                                                fontSize: 9,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        p.description ?? 'Sin descripción',
                                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const Spacer(),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            'S/ ${p.price.toStringAsFixed(2)}',
                                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 17),
                                          ),
                                          Row(
                                            children: [
                                              IconButton(
                                                onPressed: () => _showEditProductDialog(p),
                                                icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.primary),
                                                padding: EdgeInsets.zero,
                                                constraints: const BoxConstraints(),
                                              ),
                                              const SizedBox(width: 8),
                                              IconButton(
                                                onPressed: () => _confirmDeleteProduct(p),
                                                icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                                padding: EdgeInsets.zero,
                                                constraints: const BoxConstraints(),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Future<void> _confirmDeleteProduct(StoreProduct product) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Eliminar Producto'),
        content: Text('¿Deseas eliminar ${product.name}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Eliminar', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm == true) {
      final res = await _storeService.deleteStoreProduct(product.id);
      if (res.success) {
        _loadProducts();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Producto eliminado')));
      }
    }
  }

  void _showAddProductDialog() => _showProductFormDialog();

  void _showEditProductDialog(StoreProduct product) => _showProductFormDialog(product: product);

  void _showProductFormDialog({StoreProduct? product}) {
    if (_myStore == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No sucursal vinculada.'), backgroundColor: Colors.red));
      return;
    }

    final isEditing = product != null;
    final nameController = TextEditingController(text: product?.name);
    final descriptionController = TextEditingController(text: product?.description);
    final priceController = TextEditingController(text: product?.price.toString());
    final categoryController = TextEditingController(text: product?.category);
    final brandController = TextEditingController(text: product?.brand);
    bool isAvailable = product?.isAvailable ?? true;
    File? imageFile;
    String? currentImageUrl = product?.imageUrl;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          title: Text(isEditing ? 'Editar Producto' : 'Nuevo Producto', style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Selector de Imagen
                GestureDetector(
                  onTap: () async {
                    final picker = ImagePicker();
                    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
                    if (pickedFile != null) {
                      setDialogState(() => imageFile = File(pickedFile.path));
                    }
                  },
                  child: Container(
                    height: 140,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
                      image: imageFile != null 
                        ? DecorationImage(image: FileImage(imageFile!), fit: BoxFit.cover)
                        : (currentImageUrl != null && currentImageUrl.isNotEmpty
                            ? DecorationImage(image: NetworkImage(ApiConstants.getStorageUrl(currentImageUrl)), fit: BoxFit.cover)
                            : null),
                    ),
                    child: (imageFile == null && (currentImageUrl == null || currentImageUrl.isEmpty))
                        ? Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_a_photo_outlined, color: AppColors.primary.withValues(alpha: 0.5), size: 40),
                              const SizedBox(height: 8),
                              Text('Subir Imagen', style: TextStyle(color: AppColors.primary.withValues(alpha: 0.5), fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          )
                        : Align(
                            alignment: Alignment.bottomRight,
                            child: Container(
                              margin: const EdgeInsets.all(8),
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                              child: const Icon(Icons.edit, color: Colors.white, size: 16),
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(
                    labelText: 'Nombre del Producto',
                    prefixIcon: const Icon(Icons.shopping_bag_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descriptionController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    labelText: 'Descripción corta',
                    prefixIcon: const Icon(Icons.description_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: priceController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Precio (S/)',
                          prefixIcon: const Icon(Icons.payments_outlined),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: categoryController,
                  decoration: InputDecoration(
                    labelText: 'Categoría',
                    prefixIcon: const Icon(Icons.category_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                  ),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  title: const Text('Disponible para la venta', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  value: isAvailable,
                  activeThumbColor: AppColors.primary,
                  onChanged: (val) => setDialogState(() => isAvailable = val),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('CANCELAR', style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () async {
                if (nameController.text.isEmpty || priceController.text.isEmpty) return;
                
                // Mostrar cargando
                showDialog(context: context, barrierDismissible: false, builder: (c) => const Center(child: CircularProgressIndicator()));

                try {
                  String? uploadedUrl = currentImageUrl;
                  
                  // 1. Subir imagen si se seleccionó una nueva
                  if (imageFile != null) {
                    final uploadRes = await _storeService.uploadProductImage(imageFile!.path);
                    if (uploadRes.success) {
                      uploadedUrl = uploadRes.data;
                    }
                  }

                  final productData = {
                    'sucursal_id': _myStore!.id,
                    'name': nameController.text,
                    'description': descriptionController.text,
                    'price': double.tryParse(priceController.text) ?? 0.0,
                    'image_url': uploadedUrl,
                    'category': categoryController.text,
                    'brand': brandController.text,
                    'is_available': isAvailable,
                  };

                  ApiResponse res;
                  if (isEditing) {
                    res = await _storeService.updateStoreProduct(product.id, productData);
                  } else {
                    res = await _storeService.addStoreProduct(productData);
                  }

                  if (mounted) {
                    Navigator.pop(context); // Quitar cargando
                    if (res.success) {
                      Navigator.pop(context); // Cerrar form
                      _loadProducts();
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(isEditing ? 'Producto actualizado' : 'Producto añadido')));
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${res.message}')));
                    }
                  }
                } catch (e) {
                  if (mounted) {
                    Navigator.pop(context); // Quitar cargando
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error de sistema: $e')));
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(isEditing ? 'GUARDAR' : 'CREAR'),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditProfileDialog() {
    if (_myStore == null) return;
    final descController = TextEditingController(text: _myStore!.description);
    final phoneController = TextEditingController(text: _myStore!.phone);
    final whatsappController = TextEditingController(text: _myStore!.whatsapp);
    final specialtiesController = TextEditingController(text: _myStore!.specialties);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Editar Perfil de Sucursal'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: descController, decoration: const InputDecoration(labelText: 'Descripción'), maxLines: 3),
              TextField(controller: phoneController, decoration: const InputDecoration(labelText: 'Teléfono de Contacto')),
              TextField(controller: whatsappController, decoration: const InputDecoration(labelText: 'WhatsApp')),
              TextField(controller: specialtiesController, decoration: const InputDecoration(labelText: 'Especialidades')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () async {
              final res = await _storeService.updateStore(_myStore!.id, {
                'description': descController.text,
                'phone': phoneController.text,
                'whatsapp': whatsappController.text,
                'specialties': specialtiesController.text,
              });
              if (res.success && mounted) {
                Navigator.pop(context);
                _loadStoreData();
              }
            },
            child: const Text('Actualizar Sucursal'),
          ),
        ],
      ),
    );
  }

  Widget _buildProfile(user) {
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 20),
          CircleAvatar(
            radius: 50,
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: const Icon(Icons.person, size: 50, color: AppColors.primary),
          ),
          const SizedBox(height: 15),
          Text(
            _myStore?.name ?? (user?.username ?? 'Cargando sucursal...'),
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -0.5),
            textAlign: TextAlign.center,
          ),
          Text(user?.email ?? '', style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 5),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text('ROL: TIENDA / SUCURSAL', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 30),
          
          if (_myStore != null) ...[
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('Datos de la Sucursal', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 15),
            _buildProfileItem(Icons.store, 'Nombre Comercial', _myStore!.name),
            _buildProfileItem(Icons.location_on, 'Ubicación', _myStore!.address),
            _buildProfileItem(Icons.description, 'Descripción', _myStore!.description ?? 'Sin descripción'),
            _buildProfileItem(Icons.phone, 'Teléfono', _myStore!.phone),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _showEditProfileDialog, 
              icon: const Icon(Icons.edit), 
              label: const Text('MODIFICAR SUCURSAL'),
              style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
            ),
          ] else ...[
            _buildEmptyState(Icons.info_outline, 'Sin sucursal vinculada'),
            const SizedBox(height: 10),
            const Text(
              'La información de sucursal aparecerá aquí una vez que el administrador la vincule a su cuenta.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ],
          
          const SizedBox(height: 30),
          const Divider(),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              if (mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout),
            label: const Text('CERRAR SESIÓN'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red,
              side: const BorderSide(color: Colors.red),
              minimumSize: const Size(double.infinity, 50),
            ),
          ),
          const SizedBox(height: 50),
        ],
      ),
    );
  }

  Widget _buildProfileItem(IconData icon, String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 5)],
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 22),
          const SizedBox(width: 15),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
            const SizedBox(height: 2),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          ])),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: AppColors.softShadow),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 15),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          Text(title, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
        ]),
      ),
    );
  }
}
