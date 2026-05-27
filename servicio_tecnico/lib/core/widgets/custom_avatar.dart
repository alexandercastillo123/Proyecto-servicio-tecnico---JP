import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CustomAvatar extends StatelessWidget {
  final String? imageUrl;
  final String name;
  final double size;
  final double fontSize;
  final bool showBorder;
  final bool showOnlineIndicator;
  final bool isOnline;

  const CustomAvatar({
    super.key,
    this.imageUrl,
    required this.name,
    this.size = 40,
    this.fontSize = 16,
    this.showBorder = false,
    this.showOnlineIndicator = false,
    this.isOnline = false,
  });

  static const List<List<Color>> _gradients = [
    [Color(0xFF4F46E5), Color(0xFF7C3AED)],  // Indigo → Violet
    [Color(0xFF0EA5E9), Color(0xFF4F46E5)],  // Sky → Indigo
    [Color(0xFF10B981), Color(0xFF0EA5E9)],  // Emerald → Sky
    [Color(0xFFF59E0B), Color(0xFFEF4444)],  // Amber → Red
    [Color(0xFFEC4899), Color(0xFF8B5CF6)],  // Pink → Violet
    [Color(0xFF06B6D4), Color(0xFF10B981)],  // Cyan → Emerald
  ];

  List<Color> _getGradient() {
    if (name.isEmpty) return _gradients[0];
    return _gradients[name.codeUnitAt(0) % _gradients.length];
  }

  String _getInitials() {
    if (name.isEmpty) return '?';
    final parts = name.trim().split(' ');
    if (parts.length > 1 && parts[1].isNotEmpty) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final gradient = _getGradient();

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: imageUrl == null || imageUrl!.isEmpty
                ? LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: gradient,
                  )
                : null,
            color: imageUrl != null && imageUrl!.isNotEmpty
                ? Colors.grey[200]
                : null,
            border: showBorder
                ? Border.all(
                    color: Colors.white,
                    width: size * 0.04,
                  )
                : null,
            boxShadow: [
              BoxShadow(
                color: gradient[0].withOpacity(0.25),
                blurRadius: size * 0.3,
                offset: Offset(0, size * 0.08),
              ),
            ],
          ),
          child: ClipOval(
            child: imageUrl != null && imageUrl!.isNotEmpty
                ? Image.network(
                    imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        _buildInitials(gradient),
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return _buildInitials(gradient);
                    },
                  )
                : _buildInitials(gradient),
          ),
        ),
        if (showOnlineIndicator)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: size * 0.28,
              height: size * 0.28,
              decoration: BoxDecoration(
                color: isOnline ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildInitials(List<Color> gradient) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradient,
        ),
      ),
      child: Center(
        child: Text(
          _getInitials(),
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.w800,
            fontSize: fontSize,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}
