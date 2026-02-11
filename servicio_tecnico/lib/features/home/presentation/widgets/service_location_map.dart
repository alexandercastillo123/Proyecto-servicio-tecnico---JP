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
    // Initial position in Lima (Jesús María)
    const center = LatLng(-12.0711, -77.0494);

    return FlutterMap(
      options: const MapOptions(initialCenter: center, initialZoom: 15.0),
      children: [
        // Layer derived from OpenStreetMap - 100% Free
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.servicio_tecnico.app',
        ),

        // Markers Layer
        MarkerLayer(
          markers: [
            // User Location Marker
            const Marker(
              point: center,
              width: 80,
              height: 80,
              child: Icon(
                Icons.location_on,
                color: AppColors.primary,
                size: 45,
              ),
            ),

            // Dynamically generate Technician Markers if we had coords in the model
            // For now, we'll keep some mock markers around the user or use the tech list
            ...technicians.map((tech) {
              // Note: Since we don't have lat/lng in the DB yet, we generate random ones near center
              // In a real app, we would use the tech's address or stored coords
              final index = technicians.indexOf(tech);
              final point = LatLng(
                center.latitude +
                    (index + 1) * 0.002 * (index % 2 == 0 ? 1 : -1),
                center.longitude +
                    (index + 1) * 0.002 * (index % 3 == 0 ? 1 : -1),
              );

              return Marker(
                point: point,
                width: 50,
                height: 50,
                child: GestureDetector(
                  onTap: () {
                    // Show a tooltip or navigate
                  },
                  child: _buildSimpleMarker(Icons.handyman, AppColors.primary),
                ),
              );
            }),

            // If tech list is empty, show original mocks
            if (technicians.isEmpty) ...[
              Marker(
                point: const LatLng(-12.0730, -77.0510),
                width: 50,
                height: 50,
                child: _buildSimpleMarker(Icons.handyman, AppColors.primary),
              ),
              Marker(
                point: const LatLng(-12.0690, -77.0470),
                width: 50,
                height: 50,
                child: _buildSimpleMarker(Icons.handyman, AppColors.primary),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildSimpleMarker(IconData icon, Color color) {
    return Container(
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Icon(icon, color: Colors.white, size: 20),
    );
  }
}
