import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
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

class OrderFlowWizard extends StatefulWidget {
  final int storeId;
  final Store store;
  final List<StoreProduct> products;

  const OrderFlowWizard({
    super.key,
    required this.storeId,
    required this.store,
    required this.products,
  });

  @override
  State<OrderFlowWizard> createState() => _OrderFlowWizardState();
}

class _OrderFlowWizardState extends State<OrderFlowWizard> {
  final StoreService _storeService = StoreService();
  int _currentStep = 0; // 0: Location, 1: Products, 2: Review, 3: Payment
  
  // Location details
  LatLng? _selectedLocation;
  String _address = 'Obteniendo ubicación...';
  bool _isLoadingAddress = false;
  final TextEditingController _addressController = TextEditingController();
  DateTime? _lastTapTime;

  // Cart/Selection details
  final Map<int, int> _cart = {}; // Map of productId -> quantity

  @override
  void initState() {
    super.initState();
    _addressController.text = _address;
    _initLocation();
  }

  Future<void> _initLocation() async {
    setState(() => _isLoadingAddress = true);
    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      final loc = LatLng(position.latitude, position.longitude);
      _selectedLocation = loc;
      await _updateAddressFromCoords(loc);
    } catch (e) {
      debugPrint("Error obteniendo ubicación GPS: $e");
      // Fallback location: Lima, Peru
      final fallback = LatLng(-12.0453, -77.0428);
      _selectedLocation = fallback;
      await _updateAddressFromCoords(fallback);
    }
  }

  Future<void> _updateAddressFromCoords(LatLng loc) async {
    if (!mounted) return;
    setState(() {
      _isLoadingAddress = true;
      _selectedLocation = loc;
    });

    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.latitude}&lon=${loc.longitude}&zoom=18&addressdetails=1',
      );
      final response = await http.get(
        uri,
        headers: {
          'User-Agent': 'com.jp.serviciotecnico.servicio_tecnico_app',
        },
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['display_name'] != null) {
          _address = data['display_name'];
        }
      }
    } catch (e) {
      _address = 'Lat: ${loc.latitude.toStringAsFixed(4)}, Lng: ${loc.longitude.toStringAsFixed(4)}';
    } finally {
      if (mounted) {
        setState(() {
          _addressController.text = _address;
          _isLoadingAddress = false;
        });
      }
    }
  }

  double _calculateTotal() {
    double total = 0.0;
    _cart.forEach((productId, qty) {
      final prod = widget.products.firstWhere((p) => p.id == productId);
      total += prod.price * qty;
    });
    return total;
  }

  void _nextStep() {
    if (_currentStep == 0 && _selectedLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor confirma tu ubicación en el mapa antes de continuar.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    if (_currentStep == 1 && _cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Debes seleccionar al menos un producto para proceder.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    setState(() {
      _currentStep++;
    });
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
    } else {
      context.pop();
    }
  }

  void _cancelOrder() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.getCardBackground(context),
        title: Text(
          '¿Cancelar Pedido?',
          style: TextStyle(color: AppColors.getTextPrimary(context), fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Se descartará toda tu selección actual y regresarás a la página de la tienda.',
          style: TextStyle(color: AppColors.getTextSecondary(context)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No, continuar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.pop();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
            child: const Text('Sí, cancelar'),
          ),
        ],
      ),
    );
  }

  void _showSummaryConfirmation() {
    final double total = _calculateTotal();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.getCardBackground(context),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.assignment_outlined, color: AppColors.primary),
            const SizedBox(width: 10),
            Text(
              'Resumen del Pedido',
              style: TextStyle(
                color: AppColors.getTextPrimary(context),
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView(
            shrinkWrap: true,
            children: [
              Text(
                'Dirección de entrega:',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppColors.getTextPrimary(context),
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _address,
                style: TextStyle(color: AppColors.getTextSecondary(context), fontSize: 13),
              ),
              const Divider(height: 24),
              Text(
                'Productos:',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppColors.getTextPrimary(context),
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 8),
              ..._cart.entries.map((entry) {
                final prod = widget.products.firstWhere((p) => p.id == entry.key);
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '${prod.name} (x${entry.value})',
                          style: TextStyle(color: AppColors.getTextSecondary(context), fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        'S/ ${(prod.price * entry.value).toStringAsFixed(2)}',
                        style: TextStyle(
                          color: AppColors.getTextPrimary(context),
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                );
              }),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Monto Total:',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.getTextPrimary(context),
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    'S/ ${total.toStringAsFixed(2)}',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Modificar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _submitOrder();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Confirmar y Continuar'),
          ),
        ],
      ),
    );
  }

  Future<void> _submitOrder() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    // Format products payload
    final List<Map<String, dynamic>> productsList = [];
    _cart.forEach((productId, qty) {
      productsList.add({
        'product_id': productId,
        'quantity': qty,
      });
    });

    final res = await _storeService.createMultiProductOrder(
      products: productsList,
      address: _addressController.text,
      lat: _selectedLocation?.latitude,
      lng: _selectedLocation?.longitude,
    );

    if (mounted) {
      Navigator.pop(context); // Close loading indicator
      
      if (res.success && res.data != null) {
        final int orderId = res.data['orderId'] ?? 0;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('¡Pedido creado con éxito! Por favor elige tu método de pago.'),
            backgroundColor: Colors.green,
          ),
        );
        
        // Advance to step 3 (Payment)
        setState(() {
          _currentStep = 3;
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al crear pedido: ${res.message}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Widget _buildStepIndicator() {
    final List<String> steps = ['Ubicación', 'Catálogo', 'Revisión', 'Pago'];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      color: AppColors.getSurfaceColor(context),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(steps.length, (index) {
          final isCompleted = index < _currentStep;
          final isActive = index == _currentStep;
          return Column(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCompleted
                      ? Colors.green
                      : isActive
                          ? AppColors.primary
                          : AppColors.getDividerColor(context),
                  border: isActive ? Border.all(color: Colors.white, width: 2) : null,
                  boxShadow: isActive ? AppColors.softShadow : null,
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, size: 16, color: Colors.white)
                      : Text(
                          '${index + 1}',
                          style: TextStyle(
                            color: isActive ? Colors.white : AppColors.getTextSecondary(context),
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                steps[index],
                style: TextStyle(
                  color: isActive
                      ? AppColors.primary
                      : AppColors.getTextSecondary(context),
                  fontSize: 11,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildLocationStep() {
    LatLng initialLoc = _selectedLocation ?? const LatLng(-12.0453, -77.0428);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: TextField(
            controller: _addressController,
            onChanged: (val) => _address = val,
            style: TextStyle(color: AppColors.getTextPrimary(context)),
            decoration: InputDecoration(
              labelText: 'Dirección de Entrega',
              labelStyle: TextStyle(color: AppColors.getTextSecondary(context)),
              filled: true,
              fillColor: AppColors.getCardBackground(context),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: AppColors.getDividerColor(context)),
              ),
              prefixIcon: const Icon(Icons.location_pin, color: AppColors.primary),
              suffixIcon: _isLoadingAddress 
                ? const Padding(
                    padding: EdgeInsets.all(12.0),
                    child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                  )
                : null,
            ),
          ),
        ),
        Expanded(
          child: Stack(
            children: [
              FlutterMap(
                options: MapOptions(
                  initialCenter: initialLoc,
                  initialZoom: 15,
                  onTap: (tapPos, p) {
                    final now = DateTime.now();
                    if (_lastTapTime != null &&
                        now.difference(_lastTapTime!) < const Duration(milliseconds: 400)) {
                      _updateAddressFromCoords(p);
                    }
                    _lastTapTime = now;
                  },
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  ),
                  if (_selectedLocation != null)
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: _selectedLocation!,
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
              Positioned(
                bottom: 16,
                right: 16,
                child: FloatingActionButton(
                  backgroundColor: AppColors.primary,
                  onPressed: _initLocation,
                  child: const Icon(Icons.my_location, color: Colors.white),
                ),
              ),
              Positioned(
                top: 10,
                left: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.touch_app, color: Colors.white, size: 16),
                      SizedBox(width: 8),
                      Text(
                        'Doble toque en el mapa para ubicar marcador',
                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildProductsStep() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          color: AppColors.getSurfaceColor(context),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Selecciona Productos:',
                style: TextStyle(
                  color: AppColors.getTextPrimary(context),
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Text(
                '${_cart.length} seleccionados',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: widget.products.isEmpty
              ? const Center(child: Text('No hay productos disponibles.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: widget.products.length,
                  itemBuilder: (context, index) {
                    final prod = widget.products[index];
                    final currentQty = _cart[prod.id] ?? 0;
                    final cardColor = currentQty > 0
                        ? AppColors.primary.withOpacity(0.04)
                        : AppColors.getCardBackground(context);

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      color: cardColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: currentQty > 0 ? AppColors.primary : AppColors.getDividerColor(context),
                          width: currentQty > 0 ? 1.5 : 1,
                        ),
                      ),
                      elevation: 0,
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                color: AppColors.getSurfaceColor(context),
                                borderRadius: BorderRadius.circular(12),
                                image: (prod.imageUrl != null && prod.imageUrl!.isNotEmpty)
                                    ? DecorationImage(
                                        image: NetworkImage(ApiConstants.getStorageUrl(prod.imageUrl)),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: (prod.imageUrl == null || prod.imageUrl!.isEmpty)
                                  ? const Icon(Icons.shopping_bag, color: Colors.grey, size: 28)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    prod.name,
                                    style: TextStyle(
                                      color: AppColors.getTextPrimary(context),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'S/ ${prod.price.toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              decoration: BoxDecoration(
                                color: AppColors.getSurfaceColor(context),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove, size: 16),
                                    onPressed: currentQty > 0
                                        ? () {
                                            setState(() {
                                              if (currentQty == 1) {
                                                _cart.remove(prod.id);
                                              } else {
                                                _cart[prod.id] = currentQty - 1;
                                              }
                                            });
                                          }
                                        : null,
                                  ),
                                  Text(
                                    '$currentQty',
                                    style: TextStyle(
                                      color: AppColors.getTextPrimary(context),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add, size: 16, color: AppColors.primary),
                                    onPressed: () {
                                      setState(() {
                                        _cart[prod.id] = currentQty + 1;
                                      });
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildReviewStep() {
    final double total = _calculateTotal();
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          color: AppColors.getSurfaceColor(context),
          width: double.infinity,
          child: Text(
            'Revisión de Pedido',
            style: TextStyle(
              color: AppColors.getTextPrimary(context),
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ),
        Expanded(
          child: _cart.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.shopping_cart_outlined, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      Text(
                        'El carrito está vacío',
                        style: TextStyle(color: AppColors.getTextSecondary(context), fontSize: 15),
                      ),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      color: AppColors.getCardBackground(context),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: AppColors.getDividerColor(context)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(14.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '📍 Entrega en:',
                              style: TextStyle(
                                color: AppColors.getTextPrimary(context),
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _address,
                              style: TextStyle(color: AppColors.getTextSecondary(context), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    ..._cart.entries.map((entry) {
                      final prod = widget.products.firstWhere((p) => p.id == entry.key);
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        color: AppColors.getCardBackground(context),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                          side: BorderSide(color: AppColors.getDividerColor(context)),
                        ),
                        child: ListTile(
                          title: Text(
                            prod.name,
                            style: TextStyle(color: AppColors.getTextPrimary(context), fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          subtitle: Text(
                            'S/ ${prod.price.toStringAsFixed(2)} x ${entry.value}',
                            style: TextStyle(color: AppColors.getTextSecondary(context), fontSize: 12),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'S/ ${(prod.price * entry.value).toStringAsFixed(2)}',
                                style: TextStyle(
                                  color: AppColors.getTextPrimary(context),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: AppColors.error),
                                tooltip: 'Quitar producto',
                                onPressed: () {
                                  setState(() {
                                    _cart.remove(prod.id);
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.04),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Subtotal:',
                            style: TextStyle(
                              color: AppColors.getTextPrimary(context),
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            'S/ ${total.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    OutlinedButton.icon(
                      onPressed: _cancelOrder,
                      icon: const Icon(Icons.cancel, color: AppColors.error),
                      label: const Text('CANCELAR PEDIDO'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
        ),
      ],
    );
  }

  Widget _buildPaymentStep() {
    final double total = _calculateTotal();
    return Center(
      child: ListView(
        padding: const EdgeInsets.all(24),
        shrinkWrap: true,
        children: [
          const Icon(Icons.check_circle_outline, color: Colors.green, size: 64),
          const SizedBox(height: 12),
          Text(
            '¡Pedido Registrado con Éxito!',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.getTextPrimary(context),
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Por favor selecciona tu método de pago para completar la transacción.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.getTextSecondary(context), fontSize: 13),
          ),
          const SizedBox(height: 24),
          Text(
            'Total a pagar: S/ ${total.toStringAsFixed(2)}',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.getTextPrimary(context),
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 24),
          _paymentOption(Icons.qr_code, 'Pagar con Yape', 'yape'),
          const SizedBox(height: 10),
          _paymentOption(Icons.qr_code_scanner, 'Pagar con Plin', 'plin'),
          const SizedBox(height: 10),
          _paymentOption(Icons.account_balance, 'Transferencia Bancaria', 'transfer'),
          const SizedBox(height: 10),
          _paymentOption(Icons.payments, 'Efectivo', 'cash'),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 8),
          ListTile(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Colors.blueAccent),
            ),
            leading: const Icon(Icons.credit_card, color: Colors.blueAccent),
            title: const Text(
              'Tarjeta de Crédito / Débito (Culqi)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueAccent, fontSize: 13),
            ),
            onTap: () {
              // Extract order ID dynamically, we can pull it or pass from State
              // For safety in this test flow we'll use a mocked order id or go chat
              _goToChat();
            },
          ),
          const SizedBox(height: 20),
          TextButton(
            onPressed: _goToChat,
            child: const Text('Coordinar pago después en el Chat'),
          ),
        ],
      ),
    );
  }

  Widget _paymentOption(IconData icon, String label, String value) {
    return Card(
      elevation: 0,
      color: AppColors.getCardBackground(context),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.getDividerColor(context)),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(
          label,
          style: TextStyle(color: AppColors.getTextPrimary(context), fontWeight: FontWeight.bold, fontSize: 13),
        ),
        trailing: const Icon(Icons.chevron_right, size: 18),
        onTap: () async {
          // Normal chat flow integration
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Registrando pago...'),
            ),
          );
          _goToChat();
        },
      ),
    );
  }

  void _goToChat() {
    if (!mounted) return;
    context.push(
      '/chat',
      extra: {
        'receiverId': widget.store.userId,
        'receiverName': widget.store.name,
        'receiverRole': 'store',
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.getBackgroundColor(context),
      appBar: AppBar(
        title: Text(
          'Nuevo Pedido - ${widget.store.name}',
          style: TextStyle(
            color: AppColors.getTextPrimary(context),
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _prevStep,
        ),
        backgroundColor: AppColors.getBackgroundColor(context),
        elevation: 0,
        iconTheme: IconThemeData(color: AppColors.getTextPrimary(context)),
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildStepIndicator(),
            const Divider(height: 1),
            Expanded(
              child: IndexedStack(
                index: _currentStep,
                children: [
                  _buildLocationStep(),
                  _buildProductsStep(),
                  _buildReviewStep(),
                  _buildPaymentStep(),
                ],
              ),
            ),
            if (_currentStep < 3) ...[
              const Divider(height: 1),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                color: AppColors.getBackgroundColor(context),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Total Estimado:',
                      style: TextStyle(
                        color: AppColors.getTextSecondary(context),
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      'S/ ${_calculateTotal().toStringAsFixed(2)}',
                      style: TextStyle(
                        color: AppColors.getTextPrimary(context),
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    ElevatedButton(
                      onPressed: _currentStep == 2 ? _showSummaryConfirmation : _nextStep,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: Text(
                        _currentStep == 2 ? 'CONFIRMAR PEDIDO' : 'CONTINUAR',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
