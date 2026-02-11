import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PersonTypeSelectionScreen extends StatelessWidget {
  const PersonTypeSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // Dark background/dividers
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 120,
        leading: TextButton.icon(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_left, color: Colors.white),
          label: const Text(
            'Regresar',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          style: TextButton.styleFrom(
            padding: const EdgeInsets.only(left: 8),
            alignment: Alignment.centerLeft,
          ),
        ),
      ),
      body: Column(
        children: [
          // Top Half: Persona Natural
          Expanded(
            child: GestureDetector(
              onTap: () {
                final role = GoRouterState.of(
                  context,
                ).uri.queryParameters['role'];
                context.push('/register/form?role=$role&type=natural');
              },
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      image: DecorationImage(
                        // Placeholder for laptop image
                        image: const AssetImage(
                          'assets/images/natural_person_bg.jpg',
                        ),
                        fit: BoxFit.cover,
                        colorFilter: ColorFilter.mode(
                          Colors.black.withValues(alpha: 0.4),
                          BlendMode.darken,
                        ),
                      ),
                    ),
                  ),
                  Center(
                    child: Text(
                      'Persona natural\n(No empresas)',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.w400,
                        height: 1.1,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          Container(height: 1, color: Colors.white24),

          // Bottom Half: Persona Juridica
          Expanded(
            child: GestureDetector(
              onTap: () {
                final role = GoRouterState.of(
                  context,
                ).uri.queryParameters['role'];
                context.push('/register/form?role=$role&type=juridical');
              },
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      image: DecorationImage(
                        // Placeholder for server room/enterprise image
                        image: const AssetImage(
                          'assets/images/legal_person_bg.jpg',
                        ),
                        fit: BoxFit.cover,
                        colorFilter: ColorFilter.mode(
                          Colors.black.withValues(alpha: 0.4),
                          BlendMode.darken,
                        ),
                      ),
                    ),
                  ),
                  Center(
                    child: Text(
                      'Persona Jurídica\n(Empresas)',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.w400,
                        height: 1.1,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
