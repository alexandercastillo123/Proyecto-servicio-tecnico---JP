import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';

class LegalContentScreen extends StatelessWidget {
  final String title;
  final String content;

  const LegalContentScreen({
    super.key,
    required this.title,
    required this.content,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          title,
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: GoogleFonts.outfit(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Última actualización: Mayo 2026',
              style: GoogleFonts.outfit(
                fontSize: 14,
                color: AppColors.textSecondary,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              content,
              style: GoogleFonts.outfit(
                fontSize: 16,
                color: AppColors.textPrimary,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 40),
            Center(
              child: Text(
                'J&P Service Platform © 2026',
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  color: AppColors.textLight,
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
