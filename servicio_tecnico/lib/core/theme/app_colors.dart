import 'package:flutter/material.dart';

class AppColors {
  // Primary Brand Color (Vibrant Corporate Blue)
  static const Color primary = Color(0xFF3B28FF);
  static const Color primaryDark = Color(0xFF1E0ED6);
  static const Color primaryLight = Color(0xFFEBE9FF);

  // Secondary Color (Pure White)
  static const Color secondary = Colors.white;

  // Backgrounds & Surfaces
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceOverlay = Color(0xFFF1F5F9); // Light slate for overlays
  static const Color border = Color(0xFFCBD5E1);
  static const Color divider = Color(0xFFE2E8F0);

  // Chat Colors
  static const Color chatBubbleMe = primary;
  static const Color chatBubbleOther = Color(0xFFFFFFFF);
  static const Color chatCheckRead = Color(0xFF34D399); // Green for read checks
  static const Color chatCheckSent = Color(0xFF94A3B8); // Slate for sent checks

  // Text Hierarchy
  static const Color textPrimary = Color(0xFF0F172A); // Slate 900
  static const Color textSecondary = Color(0xFF475569); // Slate 600
  static const Color textLight = Color(0xFF94A3B8); // Slate 400

  // Status & Semantic Colors
  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color error = Color(0xFFEF4444); // Red 500
  static const Color warning = Color(0xFFF59E0B); // Amber 500
  static const Color info = Color(0xFF3B82F6); // Blue 500

  // Adaptive Colors (Methods)
  static Color getBackgroundColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? const Color(0xFF020617)
        : const Color(0xFFFFFFFF);
  }

  static Color getSurfaceColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? const Color(0xFF0F172A)
        : const Color(0xFFF8FAFC);
  }

  static Color getTextPrimary(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? Colors.white
        : const Color(0xFF0F172A);
  }

  static Color getTextSecondary(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? Colors.white70
        : const Color(0xFF475569);
  }

  static Color getDividerColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? Colors.white.withOpacity(0.05)
        : const Color(0xFFF1F5F9);
  }

  // Premium Gradients
  static const Gradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF3B28FF), Color(0xFF6E5FFF)],
  );

  static const Gradient glassGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xCCFFFFFF),
      Color(0x66FFFFFF),
    ],
  );

  // Premium Shadows (Soft & Modern)
  static List<BoxShadow> softShadow = [
    BoxShadow(
      color: const Color(0xFF0F172A).withOpacity(0.04),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> premiumShadow = [
    BoxShadow(
      color: primary.withOpacity(0.12),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];
}

