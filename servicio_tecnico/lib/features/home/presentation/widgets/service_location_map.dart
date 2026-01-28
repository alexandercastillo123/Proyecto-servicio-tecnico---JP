import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class ServiceLocationMap extends StatelessWidget {
  final String? initialImage;

  const ServiceLocationMap({super.key, this.initialImage});

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
              child: Icon(Icons.location_on, color: Colors.red, size: 45),
            ),

            // Mock Technical Support Marker 1
            Marker(
              point: const LatLng(-12.0730, -77.0510),
              width: 50,
              height: 50,
              child: _buildSimpleMarker(Icons.handyman, Colors.blue),
            ),

            // Mock Technical Support Marker 2
            Marker(
              point: const LatLng(-12.0690, -77.0470),
              width: 50,
              height: 50,
              child: _buildSimpleMarker(Icons.computer, Colors.green),
            ),
          ],
        ),

        // Rich aesthetics: Subtle overlay for map preview branding (optional)
        Center(
          child: IgnorePointer(
            child: Opacity(
              opacity: 0.1,
              child: Transform.rotate(
                angle: -0.5,
                child: const Text(
                  'INTERACTIVE MAP',
                  style: TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
              ),
            ),
          ),
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
            color: Colors.black.withOpacity(0.2),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Icon(icon, color: Colors.white, size: 20),
    );
  }
}
