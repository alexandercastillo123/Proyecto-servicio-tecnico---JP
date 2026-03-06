import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:servicio_tecnico_app/core/services/auth_service.dart';
import '../../../../core/constants/assets.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/custom_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isPasswordVisible = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              // Logo
              Center(
                child: Image.asset(
                  AppAssets.logo,
                  height: 150, // Ajustar altura si es necesario
                  fit: BoxFit.contain,
                ),
              ),

              const SizedBox(height: 60),

              CustomTextField(
                label: 'Correo Electrónico',
                hint: 'Correo Electrónico',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
              ),

              const SizedBox(height: 20),

              CustomTextField(
                label: 'Contraseña',
                hint: 'Contraseña',
                controller: _passwordController,
                isPassword: !_isPasswordVisible,
                suffixIcon: IconButton(
                  icon: Icon(
                    _isPasswordVisible
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                    color: AppColors.primary,
                  ),
                  onPressed: () {
                    setState(() {
                      _isPasswordVisible = !_isPasswordVisible;
                    });
                  },
                ),
              ),

              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => context.push('/forgot-password'),
                  child: const Text(
                    '¿Olvido su contraseña?',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              CustomButton(
                text: 'Iniciar Sesión',
                onPressed: () async {
                  // Validar que los campos no estén vacíos
                  if (_emailController.text.isEmpty ||
                      _passwordController.text.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Por favor complete todos los campos'),
                        backgroundColor: Colors.red,
                      ),
                    );
                    return;
                  }

                  // Mostrar loading
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) =>
                        const Center(child: CircularProgressIndicator()),
                  );

                  try {
                    // Llamar al backend
                    final authService = AuthService();
                    final response = await authService.login(
                      email: _emailController.text.trim(),
                      password: _passwordController.text,
                    );

                    // Cerrar loading
                    if (context.mounted) Navigator.pop(context);

                    if (response.success && response.data != null) {
                      final role = response.data!['role'];

                      // Navegar según el rol
                      if (context.mounted) {
                        if (role == 'client') {
                          context.go('/client-home');
                        } else if (role == 'tech') {
                          context.go('/home');
                        } else if (role == 'store') {
                          context.go('/store-home');
                        }
                      }
                    } else {
                      // Mostrar error
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              response.message ?? 'Error al iniciar sesión',
                            ),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    }
                  } catch (e) {
                    // Cerrar loading si hay error
                    if (context.mounted) Navigator.pop(context);

                    // Mostrar error
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Error: ${e.toString()}'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  }
                },
              ),

              const SizedBox(height: 48),
              Center(
                child: TextButton(
                  onPressed: () => context.push('/role-selection'),
                  child: const Text(
                    '¿No tiene una cuenta?',
                    style: TextStyle(color: AppColors.primary, fontSize: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
