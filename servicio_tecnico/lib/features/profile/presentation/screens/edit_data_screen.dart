import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class EditDataScreen extends StatefulWidget {
  const EditDataScreen({super.key});

  @override
  State<EditDataScreen> createState() => _EditDataScreenState();
}

class _EditDataScreenState extends State<EditDataScreen> {
  final _nameController = TextEditingController(text: 'Nombre Técnico');
  final _dniController = TextEditingController(text: 'DNI/RUC Técnico');
  final _phoneController = TextEditingController(text: 'Teléfono Técnico');
  final _locationController = TextEditingController(
    text: 'Ubicación Cuartel General',
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(height: 10),
              // Back Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: () => context.pop(),
                    icon: const Icon(
                      Icons.arrow_left,
                      color: Color(0xFF3B28FF),
                    ),
                    label: const Text(
                      'Regresar',
                      style: TextStyle(
                        color: Color(0xFF3B28FF),
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero),
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Logo
              Column(
                children: [
                  const Text(
                    'J&P',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 80,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF3B28FF),
                      height: 0.9,
                    ),
                  ),
                  const Text(
                    'PERIFÉRICOS  S.A.C',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF3B28FF),
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    '¡QUE SOPORTE!',
                    style: TextStyle(
                      color: Color(0xFF3B28FF),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 40),

              // Form
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Column(
                  children: [
                    _buildField(_nameController, 'Nombre Técnico'),
                    const SizedBox(height: 16),
                    _buildField(_dniController, 'DNI/RUC Técnico'),
                    const SizedBox(height: 16),
                    _buildField(_phoneController, 'Teléfono Técnico'),
                    const SizedBox(height: 16),
                    _buildField(
                      _locationController,
                      'Ubicación Cuartel General',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              // Update Button
              SizedBox(
                width: 200,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE8E8E8),
                    foregroundColor: const Color(0xFF3B28FF),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: () => context.pop(),
                  child: const Text(
                    'Actualizar Datos',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(TextEditingController controller, String hint) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFE8E8E8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          hintText: hint,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 16,
          ),
        ),
        style: const TextStyle(
          color: Color(0xFF3B28FF),
          fontWeight: FontWeight.w500,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}
