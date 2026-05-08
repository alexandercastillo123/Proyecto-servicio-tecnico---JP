import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/services/user_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/services/message_service.dart';
import 'package:provider/provider.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/widgets/custom_avatar.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final UserService _userService = UserService();
  final ImagePicker _picker = ImagePicker();
  final MessageService _messageService = MessageService();
  Map<String, dynamic>? _userData;
  List<dynamic> _recentTechs = [];
  bool _isLoading = true;
  bool _isLoadingRecent = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadProfile();
    _loadRecentTechs();
  }

  Future<void> _loadRecentTechs() async {
    if (mounted) setState(() => _isLoadingRecent = true);
    try {
      final res = await _messageService.getConversations();
      if (res.success && mounted) {
        setState(() {
          _recentTechs = res.data ?? [];
          _isLoadingRecent = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingRecent = false);
    }
  }

  Future<void> _pickAndUploadImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 70, // Optimizar tamaño
      );

      if (image == null) return;

      // Mostrar loading
      setState(() => _isLoading = true);

      final response = await _userService.uploadPhoto(image.path);

      if (response.success) {
        // Recargar perfil para ver la nueva foto
        await _loadProfile();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Foto actualizada correctamente')),
          );
        }
      } else {
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response.message ?? 'Error al subir foto')),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    }
  }

  Future<void> _loadProfile() async {
    try {
      final response = await _userService.getProfile();
      if (response.success) {
        setState(() {
          _userData = response.data;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response.message;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error al cargar perfil';
        _isLoading = false;
      });
    }
  }

  void _showEditDialog() {
    if (_userData == null) return;
    final phoneController = TextEditingController(text: _userData!['phone']);
    final addressController = TextEditingController(
      text: _userData!['address'],
    );
    final cityController = TextEditingController(text: _userData!['city']);
    final usernameController = TextEditingController(
      text: _userData!['username'],
    );
    final namesController = TextEditingController(text: _userData!['names']);
    final surnamesController = TextEditingController(
      text: _userData!['surnames'],
    );
    final companyNameController = TextEditingController(
      text: _userData!['company_name'],
    );
    final dniRucController = TextEditingController(
      text: _userData!['dni'] ?? _userData!['ruc'],
    );
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'Editar Perfil',
          style: TextStyle(color: AppColors.primary),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: dniRucController,
                readOnly: true,
                decoration: const InputDecoration(
                  labelText: 'DNI / RUC (No editable)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              if (_userData!['person_type'] == 'natural') ...[
                TextField(
                  controller: namesController,
                  decoration: const InputDecoration(labelText: 'Nombres'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: surnamesController,
                  decoration: const InputDecoration(labelText: 'Apellidos'),
                ),
              ] else ...[
                TextField(
                  controller: companyNameController,
                  decoration: const InputDecoration(
                    labelText: 'Nombre de Empresa',
                  ),
                ),
              ],
              const SizedBox(height: 12),
              TextField(
                controller: usernameController,
                decoration: const InputDecoration(
                  labelText: 'Nombre de Usuario',
                  hintText: 'Ej: alex_peralta',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(labelText: 'Teléfono'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: addressController,
                decoration: const InputDecoration(labelText: 'Dirección'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: cityController,
                decoration: const InputDecoration(labelText: 'Ciudad'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              setState(() => _isLoading = true);
              final response = await _userService.updateProfile(
                username: usernameController.text,
                phone: phoneController.text,
                address: addressController.text,
                city: cityController.text,
                names: _userData!['person_type'] == 'natural'
                    ? namesController.text
                    : null,
                surnames: _userData!['person_type'] == 'natural'
                    ? surnamesController.text
                    : null,
                companyName: _userData!['person_type'] != 'natural'
                    ? companyNameController.text
                    : null,
              );
              if (response.success)
                await _loadProfile();
              else {
                setState(() => _isLoading = false);
                if (mounted)
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(response.message ?? 'Error al actualizar'),
                    ),
                  );
              }
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Text(_errorMessage!)),
      );
    }

    final user = _userData!;
    final name =
        (user['username'] != null && user['username'].toString().isNotEmpty)
        ? user['username'].toString()
        : (user['person_type'] == 'natural'
              ? '${user['names'] ?? ''} ${user['surnames'] ?? ''}'.trim()
              : user['company_name'] ?? 'Usuario');
    final dniRuc = user['dni'] ?? user['ruc'] ?? 'N/A';
    final email = user['email'] ?? 'N/A';
    final profileImg = user['profile_image_url'] ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 30),
                const SizedBox(height: 20),
                Stack(
                  children: [
                    CustomAvatar(
                      imageUrl: profileImg.isNotEmpty ? ApiConstants.getStorageUrl(profileImg) : null,
                      name: name,
                      size: 150,
                      fontSize: 40,
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: _pickAndUploadImage,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.camera_alt,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Text(
                  name,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  dniRuc,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  email,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 18,
                    decoration: TextDecoration.underline,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 48),
                const Text(
                  'Ultimos servicios:',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 20,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8E8E8),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: _isLoadingRecent
                      ? const Center(child: CircularProgressIndicator())
                      : _recentTechs.isEmpty
                          ? const Center(
                              child: Padding(
                                padding: EdgeInsets.all(20),
                                child: Text('No has contactado técnicos aún', style: TextStyle(color: Colors.grey)),
                              ),
                            )
                          : Column(
                              children: [
                                ..._recentTechs.take(3).map((tech) => Padding(
                                      padding: const EdgeInsets.only(bottom: 12),
                                      child: GestureDetector(
                                        onTap: () => context.push('/technician-profile', extra: tech['other_user_id']),
                                        child: _buildServiceItem(
                                          tech['username'] ?? 'Técnico',
                                          tech['profile_image_url'],
                                          (tech['rating'] ?? 5.0).toDouble(),
                                        ),
                                      ),
                                    )),
                                if (_recentTechs.length > 3)
                                  SizedBox(
                                    width: 200,
                                    child: ElevatedButton(
                                      onPressed: () {
                                        // Redirigir a vista de chats o similar
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFFCDCDCD),
                                        foregroundColor: AppColors.primary,
                                        padding: const EdgeInsets.symmetric(vertical: 12),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        elevation: 0,
                                      ),
                                      child: const Text(
                                        'Mostrar Más',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                ),
                const SizedBox(height: 60),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: () => context.push('/settings'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(
                        color: AppColors.primary,
                        width: 1.5,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.settings_outlined, size: 20),
                        SizedBox(width: 10),
                        Text(
                          'Configuración General',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: TextButton(
                    onPressed: () async {
                      await context.read<AuthProvider>().logout();
                      if (context.mounted) {
                        context.go('/login');
                      }
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.redAccent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.logout, size: 20),
                        SizedBox(width: 10),
                        Text(
                          'Cerrar Sesión',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildServiceItem(String name, String? imageUrl, double rating) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CustomAvatar(
            imageUrl: imageUrl != null && imageUrl.isNotEmpty ? ApiConstants.getStorageUrl(imageUrl) : null,
            name: name,
            size: 36,
            fontSize: 14,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                Row(
                  children: List.generate(
                    5,
                    (index) => Icon(
                      index < rating.round() ? Icons.star : Icons.star_border,
                      color: const Color(0xFFFFD700),
                      size: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.primary, size: 18),
        ],
      ),
    );
  }
}
