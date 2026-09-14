import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';

class OrderDetailsScreen extends StatelessWidget {
  final int orderId;
  final double amount;
  final String description;

  const OrderDetailsScreen({
    Key? key,
    required this.orderId,
    required this.amount,
    required this.description,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Detalle del Pedido', style: GoogleFonts.outfit()),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Pedido #$orderId', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text('Monto: S/ ${amount.toStringAsFixed(2)}', style: GoogleFonts.outfit(fontSize: 18)),
            const SizedBox(height: 12),
            Text('Descripción:', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(description, style: GoogleFonts.outfit(fontSize: 14)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
              icon: const Icon(Icons.check),
              label: const Text('Volver al inicio'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
