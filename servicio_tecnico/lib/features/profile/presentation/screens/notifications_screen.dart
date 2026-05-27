import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:intl/intl.dart';
import '../../../../core/services/notification_service.dart';
import '../../../../core/theme/app_colors.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _service = NotificationService();
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final res = await _service.getNotifications();
      if (res.success && mounted) setState(() { _notifications = res.data ?? []; _isLoading = false; });
      else if (mounted) setState(() => _isLoading = false);
    } catch (_) { if (mounted) setState(() => _isLoading = false); }
  }

  Future<void> _markRead(int id) async {
    await _service.markAsRead(id);
    setState(() {
      final i = _notifications.indexWhere((n) => n['id'] == id);
      if (i != -1) _notifications[i]['is_read'] = 1;
    });
  }

  IconData _icon(String? type) {
    switch (type) {
      case 'appointment': return Icons.calendar_today_rounded;
      case 'chat':        return Icons.chat_bubble_outline_rounded;
      case 'order':       return Icons.shopping_bag_outlined;
      case 'system':      return Icons.settings_suggest_outlined;
      default:            return Icons.notifications_none_rounded;
    }
  }

  Color _color(String? type) {
    switch (type) {
      case 'appointment': return AppColors.primary;
      case 'chat':        return AppColors.success;
      case 'order':       return AppColors.warning;
      case 'system':      return AppColors.accent;
      default:            return AppColors.primary;
    }
  }

  String _formatDate(String? s) {
    if (s == null) return '';
    try {
      final d = DateTime.parse(s).toLocal();
      final diff = DateTime.now().difference(d);
      if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes}m';
      if (diff.inHours < 24)   return 'Hace ${diff.inHours}h';
      if (diff.inDays < 7)     return 'Hace ${diff.inDays}d';
      return DateFormat('dd/MM').format(d);
    } catch (_) { return ''; }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: AppColors.getBackgroundColor(context),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0D1B3E) : Colors.white,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: Container(
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.08) : AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.primary, size: 18),
              onPressed: () => context.pop(),
            ),
          ),
        ),
        title: Text('Notificaciones',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800, color: AppColors.getTextPrimary(context))),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: _load,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _notifications.isEmpty
              ? _empty()
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    itemBuilder: (context, i) {
                      final n = _notifications[i];
                      final isRead = n['is_read'] == 1 || n['is_read'] == true;
                      final color = _color(n['type']);
                      return FadeInUp(
                        duration: const Duration(milliseconds: 400),
                        delay: Duration(milliseconds: 50 * i),
                        child: GestureDetector(
                          onTap: () {
                            if (!isRead) _markRead(n['id']);
                            _handleTap(n);
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isRead
                                  ? (isDark ? const Color(0xFF112044) : Colors.white)
                                  : (isDark ? color.withOpacity(0.08) : color.withOpacity(0.04)),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isRead
                                    ? (isDark ? Colors.white.withOpacity(0.07) : AppColors.border)
                                    : color.withOpacity(0.2),
                              ),
                              boxShadow: isDark ? [] : AppColors.softShadow,
                            ),
                            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: color.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(_icon(n['type']), color: color, size: 20),
                              ),
                              const SizedBox(width: 14),
                              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                  Expanded(child: Text(n['title'] ?? 'Notificación',
                                    style: GoogleFonts.outfit(
                                      fontWeight: isRead ? FontWeight.w600 : FontWeight.w800,
                                      fontSize: 14,
                                      color: AppColors.getTextPrimary(context)))),
                                  Text(_formatDate(n['created_at']),
                                    style: GoogleFonts.outfit(color: AppColors.textLight, fontSize: 11)),
                                ]),
                                const SizedBox(height: 3),
                                Text(n['message'] ?? '',
                                  style: GoogleFonts.outfit(
                                    color: AppColors.getTextSecondary(context),
                                    fontSize: 13, height: 1.4)),
                              ])),
                              if (!isRead) ...[
                                const SizedBox(width: 8),
                                Container(
                                  width: 8, height: 8,
                                  margin: const EdgeInsets.only(top: 4),
                                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                                ),
                              ],
                            ]),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  void _handleTap(dynamic n) {
    final type = n['type'];
    final id   = n['related_id'];
    if (id == null) return;
    if (type == 'appointment') context.push('/appointment-details/$id');
  }

  Widget _empty() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
          child: Icon(Icons.notifications_none_rounded, size: 48, color: AppColors.primary.withOpacity(0.4)),
        ),
        const SizedBox(height: 16),
        Text('Sin notificaciones',
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700,
            color: AppColors.getTextPrimary(context))),
        const SizedBox(height: 6),
        Text('Te avisaremos cuando pase algo importante',
          style: GoogleFonts.outfit(color: AppColors.textSecondary, fontSize: 14)),
      ]),
    );
  }
}
