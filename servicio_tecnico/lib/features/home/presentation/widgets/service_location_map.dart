import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/theme/app_colors.dart';

/// Widget del mapa interactivo para clientes.
///
/// - Solicita permiso de GPS al iniciarse.
/// - Muestra la ubicación actual del cliente (marcador azul).
/// - Permite tocar el mapa para marcar el punto de servicio (marcador rojo).
/// - El botón "Buscar Técnicos" consulta /api/technicians/nearby (radio 5 km)
///   y muestra los técnicos con coords reales.
class ServiceLocationMap extends StatefulWidget {
  const ServiceLocationMap({super.key});

  @override
  State<ServiceLocationMap> createState() => _ServiceLocationMapState();
}

class _ServiceLocationMapState extends State<ServiceLocationMap> {
  final MapController _mapController = MapController();

  LatLng? _clientLocation; // GPS real del cliente
  LatLng? _servicePoint; // Punto de servicio marcado por el cliente
  List<dynamic> _nearbyTechs = [];
  dynamic _selectedTech; // Técnico seleccionado para vista previa
  bool _loadingLocation = true;
  bool _loadingTechs = false;
  String? _locationError;
  double _radius = 5.0; // km

  // Lima - coordenada de fallback si no hay GPS
  static const LatLng _defaultLocation = LatLng(-12.0464, -77.0428);

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  // ─── Ubicación GPS ────────────────────────────────────────────────────────

  Future<void> _initLocation() async {
    try {
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

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _locationError =
              'Permiso denegado permanentemente. Habilítalo en ajustes.';
          _clientLocation = _defaultLocation;
          _loadingLocation = false;
        });
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      if (mounted) {
        setState(() {
          _clientLocation = LatLng(pos.latitude, pos.longitude);
          _servicePoint =
              _clientLocation; // punto inicial = ubicación del cliente
          _loadingLocation = false;
        });
        _mapController.move(_clientLocation!, 15.0);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _locationError = 'No se pudo obtener la ubicación: $e';
          _clientLocation = _defaultLocation;
          _loadingLocation = false;
        });
      }
    }
  }

  // ─── Buscar Técnicos ──────────────────────────────────────────────────────

  Future<void> _searchNearbyTechnicians() async {
    final point = _servicePoint ?? _clientLocation;
    if (point == null) return;

    setState(() {
      _loadingTechs = true;
      _nearbyTechs = [];
      _selectedTech = null;
    });

    try {
      final uri = Uri.parse(
        '${ApiConstants.baseUrl}/technicians/nearby'
        '?lat=${point.latitude}&lng=${point.longitude}&radius=$_radius',
      );
      final response = await http.get(uri).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final techs = body['resultado'] as List<dynamic>? ?? [];

        // Ordenar por distancia (menor a mayor)
        techs.sort((a, b) {
          final distA =
              double.tryParse(a['distance_km']?.toString() ?? '999') ?? 999.0;
          final distB =
              double.tryParse(b['distance_km']?.toString() ?? '999') ?? 999.0;
          return distA.compareTo(distB);
        });

        if (mounted) {
          setState(() {
            _nearbyTechs = techs.where((t) {
              final lat = t['latitude'];
              final lng = t['longitude'];
              return lat != null && lng != null;
            }).toList();
            _loadingTechs = false;
          });

          if (_nearbyTechs.isEmpty) {
            _showError('No se encontraron técnicos en este radio.');
          }
        }
      } else {
        if (mounted) {
          setState(() => _loadingTechs = false);
          _showError('Error al buscar técnicos (${response.statusCode})');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingTechs = false);
        _showError('Sin conexión al servidor');
      }
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  // ─── Nombre del técnico ───────────────────────────────────────────────────

  String _techName(dynamic tech) {
    final username = tech['username']?.toString().trim();
    if (username != null && username.isNotEmpty) return username;
    final company = tech['company_name']?.toString().trim();
    if (company != null && company.isNotEmpty) return company;
    final names = '${tech['names'] ?? ''} ${tech['surnames'] ?? ''}'.trim();
    return names.isNotEmpty ? names : 'Técnico';
  }

  String _formatDist(dynamic tech) {
    final dist = double.tryParse(tech['distance_km']?.toString() ?? '');
    if (dist == null) return '';
    if (dist < 1.0) return '${(dist * 1000).toInt()} m';
    return '${dist.toStringAsFixed(1)} km';
  }

  // ─── Mostrar Lista de Técnicos ──────────────────────────────────────────

  void _showTechsList() {
    if (_nearbyTechs.isEmpty) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
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
                padding: EdgeInsets.only(bottom: 8),
                child: Text(
                  'Técnicos cercanos',
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
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: _nearbyTechs.length,
                  separatorBuilder: (c, i) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final tech = _nearbyTechs[index];
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primary.withOpacity(0.1),
                        child: const Icon(
                          Icons.person,
                          color: AppColors.primary,
                        ),
                      ),
                      title: Text(
                        _techName(tech),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text('A ${_formatDist(tech)} de distancia'),
                      trailing: const Icon(
                        Icons.chevron_right,
                        color: AppColors.primary,
                      ),
                      onTap: () {
                        Navigator.pop(context);
                        context.push('/technician-profile', extra: tech['id']);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_loadingLocation) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 12),
            Text('Obteniendo tu ubicación...'),
          ],
        ),
      );
    }

    final center = _clientLocation ?? _defaultLocation;

    return Stack(
      children: [
        // ── Mapa ──────────────────────────────────────────────────────────
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: center,
            initialZoom: 14.0,
            onTap: (tapPos, point) {
              setState(() {
                _servicePoint = point;
                _selectedTech = null;
              });
            },
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName:
                  'com.jp.serviciotecnico.servicio_tecnico_app',
            ),

            if (_servicePoint != null)
              CircleLayer(
                circles: [
                  CircleMarker(
                    point: _servicePoint!,
                    radius: _radius * 1000,
                    useRadiusInMeter: true,
                    color: AppColors.primary.withOpacity(0.1),
                    borderColor: AppColors.primary,
                    borderStrokeWidth: 1.5,
                  ),
                ],
              ),

            MarkerLayer(
              markers: [
                if (_clientLocation != null)
                  Marker(
                    point: _clientLocation!,
                    width: 50,
                    height: 50,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade600,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                          boxShadow: const [
                            BoxShadow(color: Colors.black26, blurRadius: 4),
                          ],
                        ),
                        child: const Icon(
                          Icons.my_location,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                  ),

                if (_servicePoint != null && _servicePoint != _clientLocation)
                  Marker(
                    point: _servicePoint!,
                    width: 50,
                    height: 50,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.red.shade600,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                          boxShadow: const [
                            BoxShadow(color: Colors.black26, blurRadius: 4),
                          ],
                        ),
                        child: const Icon(
                          Icons.location_on,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                    ),
                  ),

                ..._nearbyTechs.map((tech) {
                  final lat = double.tryParse(tech['latitude'].toString());
                  final lng = double.tryParse(tech['longitude'].toString());
                  if (lat == null || lng == null)
                    return const Marker(point: LatLng(0, 0), child: SizedBox());

                  final isSelected =
                      _selectedTech != null &&
                      _selectedTech['id'] == tech['id'];

                  return Marker(
                    point: LatLng(lat, lng),
                    width: 60,
                    height: 60,
                    child: GestureDetector(
                      onTap: () {
                        setState(
                          () => _selectedTech = isSelected ? null : tech,
                        );
                        _mapController.move(
                          LatLng(lat, lng),
                          _mapController.camera.zoom,
                        );
                      },
                      child: Center(
                        child: AnimatedScale(
                          scale: isSelected ? 1.3 : 1.0,
                          duration: const Duration(milliseconds: 200),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? Colors.orange
                                  : AppColors.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              boxShadow: const [
                                BoxShadow(color: Colors.black26, blurRadius: 6),
                              ],
                            ),
                            child: const Icon(
                              Icons.handyman,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ],
        ),

        // ── Vista Previa Técnico (Callout) ──────────────────────────────
        if (_selectedTech != null)
          Positioned(
            bottom: 100,
            left: 20,
            right: 20,
            child: FadeInUp(
              duration: const Duration(milliseconds: 300),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: AppColors.primary.withOpacity(0.1),
                      child: const Icon(
                        Icons.person,
                        size: 35,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _techName(_selectedTech),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: AppColors.primary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            'A ${_formatDist(_selectedTech)} de distancia',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(
                                Icons.star,
                                color: Colors.amber[700],
                                size: 16,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${_selectedTech['rating'] ?? '5.0'} (${_selectedTech['reviews_count'] ?? '0'})',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () => context.push(
                        '/technician-profile',
                        extra: _selectedTech['id'],
                      ),
                      child: const Text('Ver Perfil'),
                    ),
                  ],
                ),
              ),
            ),
          ),

        // ── Error de ubicación ─────────────────────────────────────────────
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

        // ── Leyenda y Botones ──────────────────────────────────────────
        Positioned(
          top: 12,
          left: 12,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _legendChip(
                Colors.blue.shade700,
                Icons.my_location,
                'Tu posición',
              ),
              const SizedBox(height: 6),
              _legendChip(
                Colors.red.shade600,
                Icons.location_on,
                'Punto de servicio (toca)',
              ),
              const SizedBox(height: 6),
              _legendChip(AppColors.primary, Icons.handyman, 'Técnico'),
            ],
          ),
        ),

        // ── Botón Lista ────────────────────────────────────────────────
        if (_nearbyTechs.isNotEmpty)
          Positioned(
            top: 12,
            right: 12,
            child: FloatingActionButton.small(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.primary,
              onPressed: _showTechsList,
              child: const Icon(Icons.list),
            ),
          ),

        // ── Botón Buscar ────────────────────────────────────────────────
        Positioned(
          bottom: 24,
          left: 0,
          right: 0,
          child: Center(
            child: _loadingTechs
                ? Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: const [
                        BoxShadow(color: Colors.black26, blurRadius: 8),
                      ],
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 10),
                        Text('Buscando técnicos...'),
                      ],
                    ),
                  )
                : Hero(
                    tag: 'search_button',
                    child: ElevatedButton.icon(
                      onPressed: _searchNearbyTechnicians,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 28,
                          vertical: 16,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        elevation: 6,
                      ),
                      icon: const Icon(Icons.search),
                      label: Text(
                        _nearbyTechs.isEmpty
                            ? 'Buscar técnicos cercanos'
                            : '${_nearbyTechs.length} encontrados (Radio ${_radius.toInt()}km)',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _legendChip(Color color, IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 5),
          Text(label, style: const TextStyle(fontSize: 11)),
        ],
      ),
    );
  }
}

// Widget auxiliar para animación simple (si no estuviera animate_do instalado)
class FadeInUp extends StatelessWidget {
  final Widget child;
  final Duration duration;
  const FadeInUp({super.key, required this.child, required this.duration});
  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: duration,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 20 * (1 - value)),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}
