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
    });

    try {
      final uri = Uri.parse(
        '${ApiConstants.baseUrl}/api/technicians/nearby'
        '?lat=${point.latitude}&lng=${point.longitude}&radius=$_radius',
      );
      final response = await http.get(uri).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final techs = body['resultado'] as List<dynamic>? ?? [];
        if (mounted) {
          setState(() {
            _nearbyTechs = techs.where((t) {
              final lat = t['latitude'];
              final lng = t['longitude'];
              return lat != null && lng != null;
            }).toList();
            _loadingTechs = false;
          });
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
              // Tap en el mapa → mueve el punto de servicio
              setState(() => _servicePoint = point);
            },
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName:
                  'com.jp.serviciotecnico.servicio_tecnico_app',
            ),

            // Radio de búsqueda (círculo visual)
            if (_servicePoint != null)
              CircleLayer(
                circles: [
                  CircleMarker(
                    point: _servicePoint!,
                    radius: _radius * 1000, // en metros
                    useRadiusInMeter: true,
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderColor: AppColors.primary,
                    borderStrokeWidth: 1.5,
                  ),
                ],
              ),

            MarkerLayer(
              markers: [
                // Marcador azul → ubicación real del cliente
                if (_clientLocation != null)
                  Marker(
                    point: _clientLocation!,
                    width: 50,
                    height: 50,
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade700,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.25),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.my_location,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Marcador rojo → punto de servicio seleccionado
                if (_servicePoint != null && _servicePoint != _clientLocation)
                  Marker(
                    point: _servicePoint!,
                    width: 50,
                    height: 70,
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.red.shade600,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.25),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.location_on,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Marcadores de técnicos cercanos
                ..._nearbyTechs.map((tech) {
                  final lat = double.tryParse(tech['latitude'].toString());
                  final lng = double.tryParse(tech['longitude'].toString());
                  if (lat == null || lng == null)
                    return const Marker(point: LatLng(0, 0), child: SizedBox());
                  return Marker(
                    point: LatLng(lat, lng),
                    width: 60,
                    height: 60,
                    child: GestureDetector(
                      onTap: () => context.push(
                        '/technician-profile',
                        extra: tech['id'],
                      ),
                      child: Column(
                        children: [
                          Tooltip(
                            message: _techName(tech),
                            child: Container(
                              padding: const EdgeInsets.all(7),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    blurRadius: 5,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.handyman,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ],
        ),

        // ── Leyenda ────────────────────────────────────────────────────────
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
                'Punto de servicio (toca el mapa)',
              ),
              const SizedBox(height: 6),
              _legendChip(
                AppColors.primary,
                Icons.handyman,
                'Técnico disponible',
              ),
            ],
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

        // ── Botón Buscar Técnicos ──────────────────────────────────────────
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
                      boxShadow: [
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
                : ElevatedButton.icon(
                    onPressed: _searchNearbyTechnicians,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 28,
                        vertical: 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                      elevation: 4,
                    ),
                    icon: const Icon(Icons.search),
                    label: Text(
                      _nearbyTechs.isEmpty
                          ? 'Buscar técnicos (${_radius.toInt()} km)'
                          : '${_nearbyTechs.length} técnico(s) encontrado(s)',
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
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4)],
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
