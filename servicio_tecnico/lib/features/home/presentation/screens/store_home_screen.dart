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
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: IndexedStack(
          index: _selectedIndex,
          children: [
            _buildDashboard(),
            _buildCatalog(),
            _buildOrdersTab(), // Nueva pestaña de pedidos
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
                  const Text(
                    '¡Hola!',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    _myStore?.name ?? 'Rol: Administrador de Tienda',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => setState(() => _selectedIndex = 3),
                child: CircleAvatar(
                  radius: 25,
                  backgroundColor: AppColors.primary.withOpacity(0.1),
                  backgroundImage: (_myStore?.imageUrl != null)
                      ? NetworkImage('${ApiConstants.baseUrl}/${_myStore!.imageUrl}')
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
          const SizedBox(height: 30),
          Row(
            children: [
              _buildStatCard('Productos', '${_products.length}', Icons.shopping_bag, Colors.blue),
              const SizedBox(width: 15),
              _buildStatCard('Citas Hoy', '0', Icons.calendar_today, Colors.orange),
            ],
          ),
          const SizedBox(height: 30),
          const Text('Actividad Reciente', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 15),
          if (_loadingRecent)
            const Center(child: LinearProgressIndicator())
          else if (_recentChats.isEmpty)
            _buildEmptyState(Icons.chat_bubble_outline, 'No hay actividad de clientes aún')
          else
            ..._recentChats.take(3).map((chat) => _buildRecentChatCard(chat)),
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
          Expanded(child: Center(child: _buildEmptyState(Icons.shopping_cart_outlined, 'No hay pedidos registrados')))
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
    final total = double.tryParse(order['total_price']?.toString() ?? '0') ?? 0.0;
    
    Color statusColor = Colors.orange;
    String statusText = 'Pendiente';
    
    switch(status) {
      case 'confirmed': statusColor = Colors.blue; statusText = 'Confirmado'; break;
      case 'shipped': statusColor = Colors.purple; statusText = 'En camino'; break;
      case 'delivered': statusColor = Colors.teal; statusText = 'Entregado'; break;
      case 'completed': statusColor = Colors.green; statusText = 'Completado'; break;
      case 'cancelled': statusColor = Colors.red; statusText = 'Cancelado'; break;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Column(
        children: [
          ListTile(
            title: Text(product, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('Cliente: $client • Cantidad: ${order['quantity']}'),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
              child: Text(statusText, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total: S/ ${total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                Row(
                  children: [
                    if (status == 'pending')
                      TextButton(
                        onPressed: () => _updateStatus(order['id'], 'confirmed'),
                        child: const Text('CONFIRMAR'),
                      ),
                    if (status == 'confirmed')
                      TextButton(
                        onPressed: () => _updateStatus(order['id'], 'shipped'),
                        child: const Text('ENVIAR'),
                      ),
                    IconButton(
                      icon: const Icon(Icons.chat_outlined, color: Colors.blue),
                      onPressed: () => context.push('/chat', extra: order['client_id']),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Cambiar estado de un pedido
  Future<void> _updateStatus(int orderId, String newStatus) async {
    final res = await _storeService.updateOrderStatus(orderId, newStatus);
    if (res.success) {
      _loadOrders();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Pedido actualizado a $newStatus')));
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
          backgroundColor: AppColors.primary.withOpacity(0.1),
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Gestionar Productos', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              if (_myStore != null) 
                Text('Sucursal: ${_myStore!.name}', style: TextStyle(color: Colors.grey[600])),
            ],
          ),
        ),
        Expanded(
          child: _products.isEmpty
              ? Center(child: _buildEmptyState(Icons.inventory_2_outlined, 'Aún no tienes productos'))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _products.length,
                  itemBuilder: (context, index) {
                    final p = _products[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppColors.primaryLight,
                          child: const Icon(Icons.shopping_bag, color: AppColors.primary),
                        ),
                        title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('S/ ${p.price.toStringAsFixed(2)} | Stock: ${p.stock ?? 0}'),
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

  void _showAddProductDialog() {
    if (_myStore == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No puede agregar productos sin una sucursal vinculada.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final nameController = TextEditingController();
    final descriptionController = TextEditingController();
    final priceController = TextEditingController();
    final stockController = TextEditingController();
    final categoryController = TextEditingController();
    final brandController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Añadir Producto'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Nombre *')),
              TextField(controller: descriptionController, decoration: const InputDecoration(labelText: 'Descripción'), maxLines: 2),
              Row(
                children: [
                  Expanded(child: TextField(controller: priceController, decoration: const InputDecoration(labelText: 'Precio *'), keyboardType: TextInputType.number)),
                  const SizedBox(width: 10),
                  Expanded(child: TextField(controller: stockController, decoration: const InputDecoration(labelText: 'Stock'), keyboardType: TextInputType.number)),
                ],
              ),
              TextField(controller: categoryController, decoration: const InputDecoration(labelText: 'Categoría')),
              TextField(controller: brandController, decoration: const InputDecoration(labelText: 'Marca')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.isEmpty || priceController.text.isEmpty) return;
              final res = await _storeService.addStoreProduct({
                'sucursal_id': _myStore!.id,
                'name': nameController.text,
                'description': descriptionController.text,
                'price': double.tryParse(priceController.text) ?? 0.0,
                'stock': int.tryParse(stockController.text),
                'category': categoryController.text,
                'brand': brandController.text,
                'is_available': true,
              });
              if (res.success && mounted) {
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

  Widget _buildProfile() {
    final user = context.watch<AuthProvider>().user;
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 20),
          CircleAvatar(
            radius: 50,
            backgroundColor: AppColors.primary.withOpacity(0.1),
            child: const Icon(Icons.person, size: 50, color: AppColors.primary),
          ),
          const SizedBox(height: 15),
          Text(user?.username ?? 'Cargando...', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          Text(user?.email ?? '', style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 5),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
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
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 5)],
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
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
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
