import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/services/store_service.dart';
import '../../../../core/services/message_service.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/models/store.dart';
import '../../../../core/models/store_product.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/constants/api_constants.dart';

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
  bool _loadingProducts = true;
  bool _loadingRecent = false;
  Store? _myStore;

  @override
  void initState() {
    super.initState();
    _loadStoreData();
    _loadRecentChats();
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
    setState(() => _loadingProducts = true);
    try {
      // Get the real store for the authenticated user
      final resStore = await _storeService.getMyStore();
      if (resStore.success && mounted) {
        setState(() {
          _myStore = resStore.data;
        });
        if (_myStore != null) {
          _loadProducts();
        } else {
          setState(() => _loadingProducts = false);
          // Show message or navigate to create store
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
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: IndexedStack(
          index: _selectedIndex,
          children: [
            _buildDashboard(),
            _buildCatalog(),
            _buildMessagesTab(),
            _buildProfile(),
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
          if (i == 2) _loadRecentChats();
        },
        selectedItemColor: AppColors.primary,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Panel'),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2),
            label: 'Catálogo',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble),
            label: 'Mensajes',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
    );
  }

  Widget _buildDashboard() {
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
                  Text(
                    'Panel de Tienda',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    _myStore?.name ?? 'Sin sucursal registrada',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
              CircleAvatar(
                backgroundColor: AppColors.primary.withOpacity(0.1),
                child: const Icon(Icons.store, color: AppColors.primary),
              ),
            ],
          ),
          if (_myStore == null && !_loadingProducts) ...[
            const SizedBox(height: 30),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.blue[200]!),
              ),
              child: Column(
                children: [
                  const Text(
                    '¡Aún no tienes una sucursal registrada!',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Crea tu sucursal para poder gestionar tus productos y recibir consultas de clientes.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: () async {
                      final created = await context.push<bool>('/create-store');
                      if (created == true) _loadStoreData();
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('REGISTRAR MI TIENDA'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 30),
          Row(
            children: [
              _buildStatCard(
                'Productos',
                '${_products.length}',
                Icons.shopping_bag,
                Colors.blue,
              ),
              const SizedBox(width: 15),
              _buildStatCard(
                'Citas Hoy',
                '0',
                Icons.calendar_today,
                Colors.orange,
              ),
            ],
          ),
          const SizedBox(height: 30),
          const Text(
            'Actividad de Clientes',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 15),
          if (_loadingRecent)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(child: LinearProgressIndicator()),
            )
          else if (_recentChats.isEmpty)
            Container(
              padding: const EdgeInsets.all(30),
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: AppColors.softShadow,
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.chat_bubble_outline,
                    size: 40,
                    color: Colors.grey[300],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'No hay consultas de clientes aún',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            )
          else
            ..._recentChats.take(3).map((chat) => _buildRecentChatCard(chat)),
        ],
      ),
    );
  }

  Widget _buildMessagesTab() {
    return _recentChats.isEmpty
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.chat_bubble_outline,
                  size: 64,
                  color: Colors.grey[300],
                ),
                const SizedBox(height: 16),
                const Text('No tienes mensajes aún'),
              ],
            ),
          )
        : ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: _recentChats.length,
            itemBuilder: (context, index) =>
                _buildRecentChatCard(_recentChats[index]),
          );
  }

  Widget _buildRecentChatCard(dynamic chat) {
    final rawUrl = chat['profile_image_url']?.toString();
    final name = chat['username'] ?? 'Cliente';
    final lastMsg = chat['last_message'] ?? 'Consulta de producto';
    final unread = (chat['unread_count'] ?? 0) > 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: AppColors.softShadow,
        border: unread
            ? Border.all(color: AppColors.primary.withOpacity(0.3), width: 1.5)
            : null,
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.primaryLight,
          backgroundImage: (rawUrl != null && rawUrl.isNotEmpty)
              ? NetworkImage('${ApiConstants.baseUrl}/$rawUrl')
              : null,
          child: (rawUrl == null || rawUrl.isEmpty)
              ? const Icon(Icons.person, color: AppColors.primary)
              : null,
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(lastMsg, maxLines: 1, overflow: TextOverflow.ellipsis),
        trailing: const Icon(Icons.chevron_right, size: 18),
        onTap: () => context.push('/chat', extra: chat['other_user_id']),
      ),
    );
  }

  Widget _buildCatalog() {
    if (_loadingProducts)
      return const Center(child: CircularProgressIndicator());

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(20),
          child: Text(
            'Gestionar Productos',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
        ),
        Expanded(
          child: _products.isEmpty
              ? const Center(
                  child: Text('Aún no tienes productos en tu catálogo'),
                )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: _products.length,
                    itemBuilder: (context, index) {
                      final p = _products[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppColors.primaryLight,
                            child: const Icon(Icons.shopping_bag, color: AppColors.primary),
                          ),
                          title: Text(
                            p.name,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text('S/ ${p.price.toStringAsFixed(2)}'),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red),
                            onPressed: () => _confirmDeleteProduct(p),
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
        content: Text('¿Estás seguro de que deseas eliminar ${product.name}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Eliminar', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final res = await _storeService.deleteStoreProduct(product.id);
      if (res.success) {
        _loadProducts();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Producto eliminado con éxito')),
        );
      }
    }
  }

  void _showAddProductDialog() {
    final nameController = TextEditingController();
    final priceController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Añadir Producto'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Nombre'),
            ),
            TextField(
              controller: priceController,
              decoration: const InputDecoration(labelText: 'Precio'),
              keyboardType: TextInputType.number,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.isEmpty || priceController.text.isEmpty) return;
              if (_myStore == null) return;
              
              final res = await _storeService.addStoreProduct({
                'sucursal_id': _myStore!.id,
                'name': nameController.text,
                'price': double.tryParse(priceController.text) ?? 0.0,
                'description': '',
                'image_url': '',
              });
              
              if (res.success) {
                Navigator.pop(context);
                _loadProducts();
              }
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: AppColors.softShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            Text(
              title,
              style: TextStyle(color: Colors.grey[600], fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfile() {
    return Center(
      child: ElevatedButton(
        onPressed: () async {
          await context.read<AuthProvider>().logout();
          if (mounted) context.go('/login');
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.red,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        ),
        child: const Text('Cerrar Sesión', style: TextStyle(fontSize: 16)),
      ),
    );
  }
}
