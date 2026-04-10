import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:animate_do/animate_do.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/store.dart';
import '../../../../core/services/store_service.dart';

class StoreMapWidget extends StatefulWidget {
  final bool isActive;
  final Function(bool)? onLoadingChanged;

  const StoreMapWidget({super.key, this.isActive = true, this.onLoadingChanged});

  @override
  State<StoreMapWidget> createState() => _StoreMapWidgetState();
}

class _StoreMapWidgetState extends State<StoreMapWidget> {
  final MapController _mapController = MapController();
  final StoreService _storeService = StoreService();

  LatLng? _clientLocation;
  LatLng? _searchPoint;
  List<Store> _nearbyStores = [];
  Store? _selectedStore;
  bool _loadingLocation = true;
  bool _loadingStores = false;
  double _radius = 10.0; // km
  Timer? _searchTimer;
  int _searchSeconds = 0;
  bool _isSearchActive = false;
  static const int _expansionThreshold = 15;

  static const LatLng _defaultLocation = LatLng(
    -12.0453,
    -77.0428,
  ); // Plaza Dos de Mayo
  String? _locationError;

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    try {
      // Demora mínima para efecto premium
      await Future.delayed(const Duration(milliseconds: 800));
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _locationError = 'El servicio de ubicación está desactivado.';
          _clientLocation = _defaultLocation;
          _loadingLocation = false;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _locationError = 'Permiso de ubicación denegado.';
            _clientLocation = _defaultLocation;
            _loadingLocation = false;
          });
          return;
        }
      }

      LocationPermission permissionFinal = await Geolocator.checkPermission();
      if (permissionFinal == LocationPermission.deniedForever) {
        setState(() {
          _locationError = 'Permiso denegado permanentemente.';
          _clientLocation = _defaultLocation;
          _loadingLocation = false;
        });
        return;
      }

      final pos = await Geolocator.getCurrentPosition();
      if (mounted) {
        setState(() {
          _clientLocation = LatLng(pos.latitude, pos.longitude);
        });

        _mapController.move(_clientLocation!, 15.0);

        // NO apagar _loadingLocation todavía, esperar a la búsqueda de tiendas
        _searchStores(isManual: false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _locationError = 'Error: $e';
          _clientLocation = _defaultLocation;
          _loadingLocation = false;
        });
      }
    }
  }

  Future<void> _searchStores({bool isManual = true}) async {
    if (isManual) {
      _stopSearchTimer();
      _radius = 5.0; // Empezar pequeño para ver el efecto
      _isSearchActive = true;
    } else {
      // Si es automático, también queremos que busque y expanda si es necesario
      _radius = 5.0;
      _isSearchActive = true;
    }

    final point = _searchPoint ?? _mapController.camera.center;
    if (isManual && _searchPoint == null) {
      setState(() => _searchPoint = point);
    }

    setState(() {
      _loadingStores = true;
      if (isManual) _nearbyStores = [];
      _selectedStore = null;
    });
    if (mounted && widget.onLoadingChanged != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onLoadingChanged!(true);
      });
    }

    if (_isSearchActive) {
      _startSearchTimer();
    }

    try {
      // Demora artificial para efecto premium
      await Future.delayed(const Duration(milliseconds: 1200));

      final res = await _storeService.getNearbyStores(
        lat: point.latitude,
        lng: point.longitude,
        radius: _radius,
      );

      if (mounted) {
        setState(() {
          _nearbyStores = res.data ?? [];
          _loadingStores = false;
          // Si es la primera carga y _loadingLocation era true, la apagamos ahora
          if (_loadingLocation) _loadingLocation = false;
        });
        if (mounted && widget.onLoadingChanged != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            widget.onLoadingChanged!(false);
          });
        }

        if (_nearbyStores.isEmpty && _isSearchActive) {
          if (_radius >= 25.0) {
            _stopSearchTimer();
            _isSearchActive = false;
            _showNoStoresSnack();
          }
          // Seguir esperando expansión
        } else {
          _stopSearchTimer();
          _isSearchActive = false;
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingStores = false;
          if (_loadingLocation) _loadingLocation = false;
        });
        if (mounted && widget.onLoadingChanged != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            widget.onLoadingChanged!(false);
          });
        }
        _stopSearchTimer();
        _isSearchActive = false;
        _showErrorSnack('Error al buscar tiendas: $e');
      }
    }
  }

  void _startSearchTimer() {
    _searchTimer?.cancel();
    _searchTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() => _searchSeconds++);

      if (_searchSeconds >= _expansionThreshold &&
          _nearbyStores.isEmpty &&
          !_loadingStores) {
        _expandSearch();
      }
    });
  }

  void _stopSearchTimer() {
    _searchTimer?.cancel();
    _searchTimer = null;
    if (mounted) setState(() => _searchSeconds = 0);
  }

  void _expandSearch() {
    if (!_isSearchActive) return;
    setState(() {
      _radius += 5.0;
      _searchSeconds = 0;
    });
    _searchStores(isManual: false);
  }

  void _cancelSearch() {
    _stopSearchTimer();
    _isSearchActive = false;
    setState(() => _loadingStores = false);
    if (mounted && widget.onLoadingChanged != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onLoadingChanged!(false);
      });
    }
  }

  void _showNoStoresSnack() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('No se encontraron tiendas J&P en tu zona'),
        backgroundColor: Colors.orange[800],
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'REINTENTAR',
          textColor: Colors.white,
          onPressed: () => _searchStores(isManual: true),
        ),
      ),
    );
  }

  void _showErrorSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.red[800],
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  void didUpdateWidget(covariant StoreMapWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isActive && !widget.isActive) {
      _cancelSearch();
    }
  }

  @override
  void dispose() {
    _searchTimer?.cancel();
    _mapController.dispose();
    if (widget.onLoadingChanged != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onLoadingChanged!(false);
      });
    }
    super.dispose();
  }

  void _showStoresList() {
    if (_nearbyStores.isEmpty) return;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => _StoresBottomSheet(
        stores: _nearbyStores,
        onSelect: (s) {
          Navigator.pop(context);
          setState(() => _selectedStore = s);
          _mapController.move(LatLng(s.latitude!, s.longitude!), 15.0);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingLocation) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 12),
            Text('Obteniendo ubicación de tiendas...'),
          ],
        ),
      );
    }

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _clientLocation ?? _defaultLocation,
            initialZoom: 14.0,
            onTap: (_, point) => setState(() {
              _searchPoint = point;
              _selectedStore = null;
            }),
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.jp.serviciotecnico.app',
            ),
            if (_searchPoint != null)
              CircleLayer(
                circles: [
                  CircleMarker(
                    point: _searchPoint!,
                    radius: _radius * 1000,
                    useRadiusInMeter: true,
                    color: AppColors.primary.withOpacity(0.1),
                    borderColor: AppColors.primary,
                    borderStrokeWidth: 1,
                  ),
                ],
              ),
            MarkerLayer(
              markers: [
                if (_clientLocation != null)
                  Marker(
                    point: _clientLocation!,
                    width: 40,
                    height: 40,
                    child: _LocationMarker(
                      color: Colors.blue,
                      icon: Icons.my_location,
                    ),
                  ),
                if (_searchPoint != null)
                  Marker(
                    point: _searchPoint!,
                    width: 40,
                    height: 40,
                    child: _LocationMarker(
                      color: Colors.red,
                      icon: Icons.location_on,
                    ),
                  ),
                ..._nearbyStores.map((store) {
                  if (store.latitude == null || store.longitude == null)
                    return const Marker(point: LatLng(0, 0), child: SizedBox());
                  final isSelected = _selectedStore?.id == store.id;
                  return Marker(
                    point: LatLng(store.latitude!, store.longitude!),
                    width: 60,
                    height: 60,
                    child: GestureDetector(
                      onTap: () {
                        setState(
                          () => _selectedStore = isSelected ? null : store,
                        );
                        _mapController.move(
                          LatLng(store.latitude!, store.longitude!),
                          _mapController.camera.zoom,
                        );
                      },
                      child: AnimatedScale(
                        scale: isSelected ? 1.2 : 1.0,
                        duration: const Duration(milliseconds: 200),
                        child: _StoreMarker(isSelected: isSelected),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ],
        ),

        // Legend
        Positioned(
          top: 12,
          left: 12,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _LegendChip(
                color: Colors.blue,
                icon: Icons.my_location,
                label: 'Tu posición',
              ),
              const SizedBox(height: 6),
              _LegendChip(
                color: Colors.red,
                icon: Icons.location_on,
                label: 'Punto de búsqueda',
              ),
              const SizedBox(height: 6),
              _LegendChip(
                color: AppColors.primary,
                icon: Icons.store,
                label: 'Tienda J&P',
              ),
            ],
          ),
        ),

        // List Button
        if (_nearbyStores.isNotEmpty)
          Positioned(
            top: 12,
            right: 12,
            child: FloatingActionButton.small(
              heroTag: 'list_stores',
              backgroundColor: Colors.white,
              onPressed: _showStoresList,
              child: const Icon(Icons.list, color: AppColors.primary),
            ),
          ),

        // Store Preview
        if (_selectedStore != null)
          Positioned(
            bottom: 100,
            left: 20,
            right: 20,
            child: FadeInUp(
              duration: const Duration(milliseconds: 300),
              child: _StorePreviewCard(store: _selectedStore!),
            ),
          ),

        // Search Button / Loading
        Positioned(
          bottom: 24,
          left: 0,
          right: 0,
          child: Center(
            child: _isSearchActive && _loadingStores
                ? _SearchLoadingIndicator(
                    radius: _radius,
                    onCancel: _cancelSearch,
                  )
                : Hero(
                    tag: 'search_stores_btn',
                    child: ElevatedButton.icon(
                      onPressed: () => _searchStores(isManual: true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 15,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        elevation: 8,
                      ),
                      icon: const Icon(Icons.search),
                      label: Text(
                        _nearbyStores.isEmpty
                            ? 'Buscar Tiendas'
                            : '${_nearbyStores.length} encontradas · Volver a buscar',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
          ),
        ),
        // ── Error de ubicación (Naranja) ───────────────────────────────────
        if (_locationError != null)
          Positioned(
            top: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.orange.shade100,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.warning_amber,
                    size: 14,
                    color: Colors.orange,
                  ),
                  const SizedBox(width: 6),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 160),
                    child: Text(
                      _locationError!,
                      style: const TextStyle(fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _LocationMarker extends StatelessWidget {
  final Color color;
  final IconData icon;
  const _LocationMarker({required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        shape: BoxShape.circle,
        border: Border.all(color: color, width: 2),
      ),
      child: Icon(icon, color: color, size: 20),
    );
  }
}

class _StoreMarker extends StatelessWidget {
  final bool isSelected;
  const _StoreMarker({required this.isSelected});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: isSelected ? Colors.orange : AppColors.primary,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: AppColors.softShadow,
      ),
      child: const Icon(Icons.store, color: Colors.white, size: 24),
    );
  }
}

class _LegendChip extends StatelessWidget {
  final Color color;
  final IconData icon;
  final String label;
  const _LegendChip({
    required this.color,
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _SearchLoadingIndicator extends StatelessWidget {
  final double radius;
  final VoidCallback onCancel;
  const _SearchLoadingIndicator({required this.radius, required this.onCancel});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(30),
            boxShadow: AppColors.softShadow,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'Buscando en ${radius.toInt()} km...',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: onCancel,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: const BoxDecoration(
              color: Colors.red,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.stop, color: Colors.white, size: 18),
          ),
        ),
      ],
    );
  }
}

class _StorePreviewCard extends StatelessWidget {
  final Store store;
  const _StorePreviewCard({required this.store});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 25,
            backgroundColor: AppColors.primary.withOpacity(0.1),
            child: const Icon(Icons.store, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  store.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  store.address,
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (store.distanceKm != null)
                  Text(
                    'A ${store.distanceKm!.toStringAsFixed(1)} km',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => context.push('/store-profile/${store.id}'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('Ver Perfil'),
          ),
        ],
      ),
    );
  }
}

class _StoresBottomSheet extends StatelessWidget {
  final List<Store> stores;
  final Function(Store) onSelect;
  const _StoresBottomSheet({required this.stores, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(bottom: 12),
            child: Text(
              'Tiendas J&P Cercanas',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: AppColors.primary,
              ),
            ),
          ),
          Flexible(
            child: ListView.separated(
              shrinkWrap: true,
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              itemCount: stores.length,
              separatorBuilder: (_, __) => const Divider(),
              itemBuilder: (context, i) {
                final s = stores[i];
                return ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.store)),
                  title: Text(
                    s.name,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    'A ${s.distanceKm?.toStringAsFixed(1) ?? "?"} km',
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => onSelect(s),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
