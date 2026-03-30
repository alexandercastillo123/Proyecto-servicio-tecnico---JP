import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../technicians/domain/models/technician.dart';
import '../../../../core/theme/app_colors.dart';

class ServiceLocationMap extends StatelessWidget {
  final String? userAddress;
  final List<Technician> technicians;

  const ServiceLocationMap({
    super.key,
    this.userAddress,
    this.technicians = const [],
  });

  @override
  Widget build(BuildContext context) {
    const center = LatLng(-12.0711, -77.0494);

    return FlutterMap(
      options: const MapOptions(initialCenter: center, initialZoom: 15.0),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.servicio_tecnico.app',
        ),
        MarkerLayer(
          markers: [
            const Marker(
              point: center,
              width: 80,
              height: 80,
              child: _UserMarker(),
            ),
            ...technicians.map((tech) {
              final index = technicians.indexOf(tech);
              final point = LatLng(
                center.latitude + (index + 1) * 0.002 * (index % 2 == 0 ? 1 : -1),
                center.longitude + (index + 1) * 0.002 * (index % 3 == 0 ? 1 : -1),
              );
              return Marker(
                point: point,
                width: 48,
                height: 48,
                child: _TechnicianMarker(name: tech.name),
              );
            }),
            if (technicians.isEmpty) ...[
              Marker(
                point: const LatLng(-12.0730, -77.0510),
                width: 48,
                height: 48,
                child: _TechnicianMarker(name: 'Técnico 1'),
              ),
              Marker(
                point: const LatLng(-12.0690, -77.0470),
                width: 48,
                height: 48,
                child: _TechnicianMarker(name: 'Técnico 2'),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

class _UserMarker extends StatelessWidget {
  const _UserMarker();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Text(
            'Tú',
            style: TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const SizedBox(height: 2),
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.4),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: const Icon(Icons.my_location_rounded, color: Colors.white, size: 18),
        ),
      ],
    );
  }
}

class _TechnicianMarker extends StatelessWidget {
  final String name;
  const _TechnicianMarker({required this.name});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(6),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Text(
            name.length > 10 ? '${name.substring(0, 10)}...' : name,
            style: const TextStyle(
              color: AppColors.primary,
              fontSize: 9,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const SizedBox(height: 2),
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2.5),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(Icons.handyman_rounded, color: Colors.white, size: 16),
        ),
      ],
    );
  }
}
