import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/technician_service.dart';
import '../../domain/models/technician.dart';
import '../../../../core/theme/app_colors.dart';

class TechnicianListScreen extends StatefulWidget {
  const TechnicianListScreen({super.key});

  @override
  State<TechnicianListScreen> createState() => _TechnicianListScreenState();
}

class _TechnicianListScreenState extends State<TechnicianListScreen> {
  final TechnicianService _technicianService = TechnicianService();
  List<Technician> _technicians = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadTechnicians();
  }

  Future<void> _loadTechnicians() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _technicianService.getTechnicians();
      if (response.success) {
        setState(() {
          _technicians = response.data ?? [];
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
        _errorMessage = 'Error al cargar técnicos';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE8E8E8),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leadingWidth: 115,
        leading: TextButton.icon(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_left, color: AppColors.primary),
          label: const Text(
            'Regresar',
            style: TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: const Text(
          'Lista de Técnicos Cercanos',
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? Center(child: Text(_errorMessage!))
          : _technicians.isEmpty
          ? _buildEmptyState()
          : _buildTechnicianList(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            'No se han encontrado técnicos en su area',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _loadTechnicians,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }

  Widget _buildTechnicianList() {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _technicians.length,
            itemBuilder: (context, index) {
              return _buildTechnicianCard(context, _technicians[index]);
            },
          ),
        ),
        _buildFooter(),
      ],
    );
  }

  Widget _buildFooter() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        children: [
          const Text(
            'No se han encontrado más resultados en su area',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 30),
          const Text(
            'Para solicitar asistencia, puede llamar al 999 999 999\nentre las 8 am y las 10 pm, o puede escribirnos por whatsapp\npara obtener asistencia de un chatbot',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 12,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildTechnicianCard(BuildContext context, Technician tech) {
    return GestureDetector(
      onTap: () => context.push('/technician-profile', extra: tech.id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary, width: 2),
              ),
              child: CircleAvatar(
                radius: 24,
                backgroundColor: Colors.white,
                backgroundImage: tech.profileImageUrl.isNotEmpty
                    ? NetworkImage(tech.profileImageUrl)
                    : null,
                child: tech.profileImageUrl.isEmpty
                    ? const Icon(
                        Icons.person_outline,
                        color: AppColors.primary,
                        size: 32,
                      )
                    : null,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tech.name,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: List.generate(5, (index) {
                      return const Padding(
                        padding: EdgeInsets.only(right: 2.0),
                        child: Icon(
                          Icons.star,
                          color: Color(0xFFFFD700),
                          size: 24,
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
