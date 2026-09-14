import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final double? width;
  final bool isLoading;
  final bool isSecondary;

  const CustomButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.width,
    this.isLoading = false,
    this.isSecondary = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width ?? double.infinity,
      child: isSecondary? _buildSecondaryButton() : _buildPrimaryButton(),
    );
  }

  Widget _buildPrimaryButton() {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(vertical: 18),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      onPressed: isLoading ? null : onPressed,
      child: isLoading ? _buildLoader(Colors.white) : _buildText(FontWeight.w700),
    );
  }

  Widget _buildSecondaryButton() {
    return OutlinedButton(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        side: const BorderSide(color: AppColors.primary, width: 1.5),
        padding: const EdgeInsets.symmetric(vertical: 18),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      onPressed: isLoading ? null : onPressed,
      child: isLoading ? _buildLoader(AppColors.primary) : _buildText(FontWeight.w600),
    );
  }

  Widget _buildLoader(Color color) {
    return SizedBox(
      height: 20,
      width: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        valueColor: AlwaysStoppedAnimation<Color>(color),
      ),
    );
  }

  Widget _buildText(FontWeight weight) {
    return Text(
      text,
      style: GoogleFonts.outfit(
        fontWeight: weight,
        fontSize: 16,
        letterSpacing: 0.5,
      ),
    );
  }
}

