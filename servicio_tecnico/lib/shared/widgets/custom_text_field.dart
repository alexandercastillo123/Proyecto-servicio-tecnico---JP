import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';

class CustomTextField extends StatefulWidget {
  final String label;
  final String hint;
  final TextEditingController controller;
  final bool isPassword;
  final TextInputType? keyboardType;
  final Widget? suffixIcon;
  final Widget? prefixIcon;
  final bool readOnly;
  final int? maxLines;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;

  const CustomTextField({
    super.key,
    required this.label,
    required this.hint,
    required this.controller,
    this.isPassword = false,
    this.keyboardType,
    this.suffixIcon,
    this.prefixIcon,
    this.readOnly = false,
    this.maxLines = 1,
    this.validator,
    this.onChanged,
  });

  @override
  State<CustomTextField> createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField>
    with SingleTickerProviderStateMixin {
  late AnimationController _focusController;
  late Animation<double> _borderAnimation;
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _borderAnimation = CurvedAnimation(
      parent: _focusController,
      curve: Curves.easeOut,
    );
    _focusNode.addListener(() {
      setState(() => _isFocused = _focusNode.hasFocus);
      if (_focusNode.hasFocus) {
        _focusController.forward();
      } else {
        _focusController.reverse();
      }
    });
  }

  @override
  void dispose() {
    _focusController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(left: 2, bottom: 8),
            child: AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: GoogleFonts.outfit(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: _isFocused
                    ? AppColors.primary
                    : AppColors.getTextSecondary(context),
                letterSpacing: 0.2,
              ),
              child: Text(widget.label),
            ),
          ),
        ],
        AnimatedBuilder(
          animation: _borderAnimation,
          builder: (context, child) {
            return Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                boxShadow: _isFocused
                    ? [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.12),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : [],
              ),
              child: child,
            );
          },
          child: TextField(
            controller: widget.controller,
            focusNode: _focusNode,
            obscureText: widget.isPassword,
            keyboardType: widget.keyboardType,
            readOnly: widget.readOnly,
            maxLines: widget.isPassword ? 1 : widget.maxLines,
            onChanged: widget.onChanged,
            style: GoogleFonts.outfit(
              color: AppColors.getTextPrimary(context),
              fontWeight: FontWeight.w500,
              fontSize: 15,
            ),
            decoration: InputDecoration(
              hintText: widget.hint,
              prefixIcon: widget.prefixIcon != null
                  ? Padding(
                      padding: const EdgeInsets.only(left: 4),
                      child: widget.prefixIcon,
                    )
                  : null,
              suffixIcon: widget.suffixIcon,
              filled: true,
              fillColor: isDark
                  ? const Color(0xFF1E293B)
                  : (_isFocused ? Colors.white : const Color(0xFFF8FAFC)),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: _isFocused
                      ? AppColors.primary
                      : AppColors.border,
                  width: _isFocused ? 2 : 1.5,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(
                  color: AppColors.border,
                  width: 1.5,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(
                  color: AppColors.primary,
                  width: 2,
                ),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
