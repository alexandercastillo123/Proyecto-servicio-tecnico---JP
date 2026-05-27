import 'package:flutter/material.dart';

class AppColors {
  // ── Brand Blue ─────────────────────────────────────────────────────────────
  static const Color primary      = Color(0xFF1A56DB); // Azul corporativo
  static const Color primaryDark  = Color(0xFF1239A5);
  static const Color primaryDeep  = Color(0xFF0A1F6B);
  static const Color primaryLight = Color(0xFFEBF2FF);
  static const Color accent       = Color(0xFF38BDF8); // Azul cielo

  // ── Neutrals ───────────────────────────────────────────────────────────────
  static const Color background   = Color(0xFFF5F8FF);
  static const Color surface      = Color(0xFFFFFFFF);
  static const Color surfaceOverlay = Color(0xFFF0F4FF);
  static const Color border       = Color(0xFFDDE5F5);
  static const Color divider      = Color(0xFFEEF2FF);

  // ── Text ───────────────────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFF0D1B3E);
  static const Color textSecondary = Color(0xFF4A5E8A);
  static const Color textLight     = Color(0xFFB0BDD8);

  // ── Status ─────────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF10B981);
  static const Color error   = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info    = Color(0xFF38BDF8);

  // ── Chat ───────────────────────────────────────────────────────────────────
  static const Color chatBubbleMe    = primary;
  static const Color chatBubbleOther = Color(0xFFFFFFFF);
  static const Color chatCheckRead   = Color(0xFF34D399);
  static const Color chatCheckSent   = Color(0xFF94A3B8);

  // ── Adaptive ───────────────────────────────────────────────────────────────
  static Color getBackgroundColor(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
          ? const Color(0xFF060D1F)
          : const Color(0xFFFFFFFF);

  static Color getSurfaceColor(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
          ? const Color(0xFF0D1B3E)
          : const Color(0xFFF5F8FF);

  static Color getCardBackground(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
          ? const Color(0xFF112044)
          : Colors.white;

  static Color getTextPrimary(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
          ? Colors.white
          : const Color(0xFF0D1B3E);

  static Color getTextSecondary(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
          ? Colors.white60
          : const Color(0xFF4A5E8A);

  static Color getDividerColor(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
          ? Colors.white.withOpacity(0.06)
          : const Color(0xFFEEF2FF);

  // ── Gradients ──────────────────────────────────────────────────────────────
  static const Gradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1A56DB), Color(0xFF1239A5)],
  );

  static const Gradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1A56DB), Color(0xFF0A1F6B)],
  );

  static const Gradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF38BDF8), Color(0xFF1A56DB)],
  );

  static const Gradient darkGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF112044), Color(0xFF060D1F)],
  );

  // ── Shadows ────────────────────────────────────────────────────────────────
  static List<BoxShadow> softShadow = [
    BoxShadow(
      color: const Color(0xFF1A56DB).withOpacity(0.08),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> cardShadow = [
    BoxShadow(
      color: const Color(0xFF1A56DB).withOpacity(0.10),
      blurRadius: 24,
      spreadRadius: -4,
      offset: const Offset(0, 8),
    ),
  ];

  static List<BoxShadow> premiumShadow = [
    BoxShadow(
      color: const Color(0xFF1A56DB).withOpacity(0.22),
      blurRadius: 32,
      offset: const Offset(0, 12),
    ),
  ];

  static List<BoxShadow> glowShadow = [
    BoxShadow(
      color: const Color(0xFF1A56DB).withOpacity(0.40),
      blurRadius: 48,
      spreadRadius: -8,
      offset: const Offset(0, 20),
    ),
  ];
}
