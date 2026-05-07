import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:animate_do/animate_do.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/store.dart';
import '../../../../core/models/store_product.dart';
import '../../../../core/services/store_service.dart';
import '../../../../core/constants/api_constants.dart';

class StoreProfileScreen extends StatefulWidget {
  final int storeId;
  const StoreProfileScreen({super.key, required this.storeId});

  @override
  State<StoreProfileScreen> createState() => _StoreProfileScreenState();
}

class _StoreProfileScreenState extends State<StoreProfileScreen> {
  final StoreService _storeService = StoreService();
  Store? _store;
  List<StoreProduct> _products = [];
  bool _isLoading = true;
  LatLng? _selectedOrderLocation; // Nueva ubicación de entrega seleccionada
  String _selectedAddress = '';
  DateTime? _lastOrderTapTime; // Para detectar doble clic en el mapa de pedidos

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final res = await _storeService.getStoreById(widget.storeId);
      final resProd = await _storeService.getStoreProducts(widget.storeId);
      if (mounted) {
        setState(() {
          _store = res.data;
          // Filtrar productos inactivos para el cliente
          _products = (resProd.data ?? []).where((p) => p.isAvailable).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showOrderDialog(StoreProduct product) {
    int quantity = 1;
    final addressController = TextEditingController(
      text: _selectedAddress.isNotEmpty
          ? _selectedAddress
          : 'Cargando ubicación...',
    );

    // Si ya tenemos una ubicación guardada en el estado, la usamos para rellenar el texto
    if (_selectedAddress.isNotEmpty) {
      addressController.text = _selectedAddress;
    }

    // Si no hay ubicación aún, intentamos obtenerla de forma asíncrona
    if (_selectedOrderLocation == null) {
      Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high)
          .then((pos) {
            if (mounted) {
              final latLng = LatLng(pos.latitude, pos.longitude);
              setState(() => _selectedOrderLocation = latLng);
              // Actualizar dirección automáticamente
              _updateAddressFromCoords(latLng, addressController);
            }
          })
          .catchError((e) {
            debugPrint("Error obteniendo GPS para pedido: $e");
          });
    }

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Row(
            children: [
              const Icon(Icons.shopping_cart, color: AppColors.primary),
              const SizedBox(width: 10),
              Expanded(child: Text('Pedir ${product.name}')),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Precio unitario: S/ ${product.price.toStringAsFixed(2)}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      icon: const Icon(
                        Icons.remove_circle_outline,
                        color: Colors.red,
                      ),
                      onPressed: quantity > 1
                          ? () => setDialogState(() => quantity--)
                          : null,
                    ),
                    Text(
                      '$quantity',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.add_circle_outline,
                        color: Colors.green,
                      ),
                      onPressed: () => setDialogState(() => quantity++),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: addressController,
                  onChanged: (val) => _selectedAddress = val,
                  decoration: const InputDecoration(
                    labelText: 'Dirección de entrega',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.map_outlined),
                  ),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () =>
                      _openLocationPicker((LatLng loc, String addr) {
                        setDialogState(() {
                          _selectedOrderLocation = loc;
                          _selectedAddress = addr;
                          addressController.text = addr;
                        });
                      }),
                  icon: const Icon(Icons.location_on),
                  label: const Text('Confirmar en el Mapa'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                  ),
                ),
                if (_selectedOrderLocation != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      '📌 Ubicación confirmada',
                      style: TextStyle(
                        color: Colors.green[700],
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total:',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'S/ ${(product.price * quantity).toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (_selectedOrderLocation == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Por favor confirma tu ubicación en el mapa',
                      ),
                    ),
                  );
                  return;
                }

                final res = await _storeService.createOrder(
                  productId: product.id,
                  quantity: quantity,
                  address: addressController.text,
                  lat: _selectedOrderLocation?.latitude,
                  lng: _selectedOrderLocation?.longitude,
                );
                if (mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        res.success
                            ? '¡Pedido realizado con éxito!'
                            : 'Error: ${res.message}',
                      ),
                      backgroundColor: res.success ? Colors.green : Colors.red,
                    ),
                  );
                  if (res.success && _store != null && res.data != null) {
                    final int orderId = res.data['orderId'] ?? 0;
                    if (orderId > 0) {
                      _showPaymentDialog(orderId, product.price * quantity);
                    } else {
                      _goToChat();
                    }
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
              child: const Text('Confirmar Pedido'),
            ),
          ],
        ),
      ),
    );
  }

  void _goToChat() {
    if (_store == null || !mounted) return;
    context.push(
      '/chat',
      extra: {
        'receiverId': _store!.userId,
        'receiverName': _store!.name,
        'receiverRole': 'store',
      },
    );
  }

  void _showPaymentDialog(int orderId, double price) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle, color: Colors.green, size: 40),
              const SizedBox(height: 8),
              const Text(
                'Paso 2: Realizar Pago',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Total a pagar: S/ ${price.toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              _paymentOption(Icons.qr_code, 'Yape', 'yape', orderId),
              _paymentOption(Icons.qr_code_scanner, 'Plin', 'plin', orderId),
              _paymentOption(Icons.account_balance, 'Transferencia', 'transfer', orderId),
              _paymentOption(Icons.payments, 'Efectivo', 'cash', orderId),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.credit_card, color: Colors.blueAccent),
                title: const Text('Culqi (Modo Prueba)', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueAccent)),
                onTap: () {
                  Navigator.pop(context); // Cierra diálogo
                  context.push('/culqi-payment', extra: {
                    'entityId': orderId,
                    'paymentType': 'order',
                    'amount': price,
                    'description': 'Pago de Pedido #$orderId',
                  }).then((_) {
                    // Después del pago Culqi, vamos al chat
                    _goToChat();
                  });
                },
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  _goToChat();
                },
                child: const Text('Pagar después en el Chat'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _paymentOption(IconData icon, String label, String value, int id) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
      onTap: () async {
        Navigator.pop(context);
        final response = await _storeService.payOrder(id, value);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.success 
                  ? 'Pago registrado. Espera confirmación.' 
                  : 'Error al registrar pago.'),
              backgroundColor: response.success ? Colors.green : Colors.red,
            ),
          );
          _goToChat();
        }
      },
    );
  }

  void _openLocationPicker(Function(LatLng, String) onPicked) {
    // Si aún no tenemos ubicación, usamos la de la tienda o la de Lima como último recurso
    LatLng pickingLoc =
        _selectedOrderLocation ??
        (_store?.latitude != null && _store?.longitude != null
            ? LatLng(_store!.latitude!, _store!.longitude!)
            : const LatLng(-12.0453, -77.0428));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setPickerState) => Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text(
                  'Mueve el marcador a tu ubicación de entrega',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
              Expanded(
                child: FlutterMap(
                  options: MapOptions(
                    initialCenter: pickingLoc,
                    initialZoom: 15,
                    onTap: (tapPos, p) {
                      final now = DateTime.now();
                      if (_lastOrderTapTime != null &&
                          now.difference(_lastOrderTapTime!) <
                              const Duration(milliseconds: 400)) {
                        setPickerState(() => pickingLoc = p);
                        // Update main state immediately
                        setState(() {
                          _selectedOrderLocation = p;
                          _selectedAddress = 'Cargando dirección...';
                        });
                      }
                      _lastOrderTapTime = now;
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: pickingLoc,
                          width: 80,
                          height: 80,
                          child: const Icon(
                            Icons.location_on,
                            color: Colors.red,
                            size: 45,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      // Mostrar indicador de carga breve
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Obteniendo dirección...'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                      final newAddr = await _updateAddressFromCoords(
                        pickingLoc,
                        null,
                      );
                      onPicked(pickingLoc, newAddr);
                      if (context.mounted) Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.all(16),
                    ),
                    child: const Text('CONFIRMAR ESTA UBICACIÓN'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_store == null)
      return const Scaffold(body: Center(child: Text('Tienda no encontrada')));

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                _store!.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryLight],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: (_store?.imageUrl != null)
                    ? Image.network(
                        ApiConstants.getStorageUrl(_store!.imageUrl),
                        fit: BoxFit.cover,
                        errorBuilder: (c, e, s) => const Icon(
                          Icons.store,
                          size: 80,
                          color: Colors.white54,
                        ),
                      )
                    : const Center(
                        child: Icon(
                          Icons.store,
                          size: 80,
                          color: Colors.white54,
                        ),
                      ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_store!.description != null &&
                      _store!.description!.isNotEmpty) ...[
                    Text(
                      _store!.description!,
                      style: TextStyle(color: Colors.grey[700], fontSize: 15),
                    ),
                    const SizedBox(height: 20),
                  ],
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _store!.address,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(
                        Icons.phone,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(_store!.phone, style: const TextStyle(fontSize: 14)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(
                        Icons.access_time,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Horario: ${_store!.openingTime ?? "No def."} - ${_store!.closingTime ?? "No def."}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 40),
                  const Text(
                    'Catálogo de Productos',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: _products.isEmpty
                ? const SliverToBoxAdapter(
                    child: Center(child: Text('No hay productos disponibles')),
                  )
                : SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.75,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                    delegate: SliverChildBuilderDelegate((context, index) {
                      final p = _products[index];
                      return FadeInUp(
                        delay: Duration(milliseconds: 100 * index),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: AppColors.softShadow,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.grey[100],
                                    borderRadius: const BorderRadius.vertical(
                                      top: Radius.circular(16),
                                    ),
                                    image:
                                        (p.imageUrl != null &&
                                            p.imageUrl!.isNotEmpty)
                                        ? DecorationImage(
                                            image: NetworkImage(
                                              ApiConstants.getStorageUrl(
                                                p.imageUrl,
                                              ),
                                            ),
                                            fit: BoxFit.cover,
                                          )
                                        : null,
                                  ),
                                  child:
                                      (p.imageUrl == null ||
                                          p.imageUrl!.isEmpty)
                                      ? const Center(
                                          child: Icon(
                                            Icons.shopping_bag,
                                            color: Colors.grey,
                                            size: 40,
                                          ),
                                        )
                                      : null,
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      p.name,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    if (p.description != null)
                                      Text(
                                        p.description!,
                                        style: TextStyle(
                                          color: Colors.grey[600],
                                          fontSize: 11,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'S/ ${p.price.toStringAsFixed(2)}',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.primary,
                                            fontSize: 14,
                                          ),
                                        ),
                                        ElevatedButton(
                                          onPressed: () => _showOrderDialog(p),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppColors.primary,
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 12,
                                            ),
                                            minimumSize: const Size(0, 32),
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                          ),
                                          child: const Text(
                                            'Pedir',
                                            style: TextStyle(fontSize: 12),
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
                    }, childCount: _products.length),
                  ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 30),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  if (_store != null) {
                    context.push(
                      '/chat',
                      extra: {
                        'receiverId': _store!.userId,
                        'receiverName': _store!.name,
                        'receiverRole': 'store',
                      },
                    );
                  }
                },
                icon: const Icon(Icons.message),
                label: const Text('Consultar'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  context.push(
                    '/appointment-scheduling',
                    extra: {
                      'id': _store!.userId,
                      'storeId': _store!.id,
                      'name': _store!.name,
                      'isStore': true,
                    },
                  );
                },
                icon: const Icon(Icons.calendar_today),
                label: const Text('Cita Local'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<String> _updateAddressFromCoords(
    LatLng loc,
    TextEditingController? controller,
  ) async {
    String addr =
        'Lat: ${loc.latitude.toStringAsFixed(4)}, Lng: ${loc.longitude.toStringAsFixed(4)}';
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.latitude}&lon=${loc.longitude}&zoom=18&addressdetails=1',
      );
      final response = await http
          .get(
            uri,
            headers: {
              'User-Agent': 'com.jp.serviciotecnico.servicio_tecnico_app',
            },
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['display_name'] != null) {
          addr = data['display_name'];
          if (mounted) {
            setState(() {
              _selectedAddress = addr;
            });
            controller?.text = addr;
          }
        }
      }
    } catch (e) {
      debugPrint('Reverse geocoding error: $e');
    }
    return addr;
  }
}
