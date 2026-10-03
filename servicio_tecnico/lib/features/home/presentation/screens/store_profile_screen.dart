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
  String? _selectedAddress;
  bool _isLoading = true;

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
            actions: [
              IconButton(
                onPressed: () =>
                    _showRatingDialog(context, _store?.name ?? 'la sucursal'),
                icon: const Icon(
                  Icons.star_outline_rounded,
                  color: Colors.white,
                ),
              ),
            ],
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
                                          onPressed: () {
                                            context.push(
                                              '/order-flow-wizard',
                                              extra: {
                                                'storeId': widget.storeId,
                                                'store': _store,
                                                'products': _products,
                                              },
                                            );
                                          },
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

  void _showRatingDialog(BuildContext context, String storeName) {
    int selectedStars = 5;
    final commentController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.star_rounded,
                        color: AppColors.primary,
                        size: 40,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Valorar a $storeName',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '¿Qué te pareció la atención y los productos?',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        return GestureDetector(
                          onTap: () =>
                              setDialogState(() => selectedStars = index + 1),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Icon(
                              Icons.star_rounded,
                              color: index < selectedStars
                                  ? Colors.amber
                                  : Colors.grey[300],
                              size: 44,
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: commentController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: 'Escribe tu opinión (opcional)...',
                        hintStyle: GoogleFonts.outfit(fontSize: 14),
                        filled: true,
                        fillColor: AppColors.getSurfaceColor(context),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      style: TextStyle(
                        color: AppColors.getTextPrimary(context),
                      ),
                    ),
                    const SizedBox(height: 32),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: Text(
                              'Cancelar',
                              style: GoogleFonts.outfit(
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () async {
                              final res = await _storeService.addStoreReview(
                                widget.storeId,
                                selectedStars,
                                commentController.text,
                              );

                              if (context.mounted) {
                                Navigator.pop(context);
                                if (res.success) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        '✅ ¡Gracias por tu valoración!',
                                      ),
                                      backgroundColor: Colors.green,
                                    ),
                                  );
                                  _loadData(); // Refresh to see updated rating
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        '❌ ${res.message ?? "Error al enviar reseña"}',
                                      ),
                                    ),
                                  );
                                }
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: Text(
                              'Enviar',
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
