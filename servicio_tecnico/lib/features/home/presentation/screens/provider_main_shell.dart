import 'package:flutter/material.dart';
import '../../../../shared/widgets/animated_bottom_nav.dart';
import '../../../home/presentation/screens/provider_home_screen.dart';
import '../../../chat/presentation/screens/conversations_screen.dart';
import '../../../profile/presentation/screens/provider_profile_screen.dart';
import '../../../dashboard/presentation/screens/provider_dashboard_screen.dart';

class ProviderMainShell extends StatefulWidget {
  const ProviderMainShell({super.key});

  @override
  State<ProviderMainShell> createState() => _ProviderMainShellState();
}

class _ProviderMainShellState extends State<ProviderMainShell> {
  int _currentIndex = 0;
  final PageController _pageController = PageController();

  final List<Widget> _screens = [
    const ProviderDashboardScreen(),
    const ProviderHomeScreen(),
    const ConversationsScreen(),
    const ProviderProfileScreen(),
  ];

  final List<NavItem> _navItems = const [
    NavItem(
      icon: Icons.dashboard_outlined,
      activeIcon: Icons.dashboard_rounded,
      label: 'Inicio',
    ),
    NavItem(
      icon: Icons.work_outline_rounded,
      activeIcon: Icons.work_rounded,
      label: 'Trabajos',
    ),
    NavItem(
      icon: Icons.chat_bubble_outline_rounded,
      activeIcon: Icons.chat_bubble_rounded,
      label: 'Chat',
    ),
    NavItem(
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
      label: 'Perfil',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    if (index == _currentIndex) return;
    setState(() => _currentIndex = index);
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: _screens,
      ),
      bottomNavigationBar: AnimatedBottomNav(
        currentIndex: _currentIndex,
        onTap: _onTabTapped,
        items: _navItems,
      ),
    );
  }
}
