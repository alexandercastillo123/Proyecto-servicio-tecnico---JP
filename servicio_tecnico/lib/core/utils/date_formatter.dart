import 'package:intl/intl.dart';

class DateFormatter {
  static String formatRelative(String? timestamp) {
    if (timestamp == null) return '';
    try {
      final date = DateTime.parse(timestamp).toLocal();
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 1) return 'Ahora';
      if (diff.inHours < 1) return '${diff.inMinutes}m';
      
      final today = DateTime(now.year, now.month, now.day);
      final yesterday = today.subtract(const Duration(days: 1));
      final dateOnly = DateTime(date.year, date.month, date.day);

      if (dateOnly == today) {
        return DateFormat('h:mm a').format(date);
      } else if (dateOnly == yesterday) {
        return 'Ayer';
      } else if (diff.inDays < 7) {
        final weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        return weekdays[date.weekday - 1];
      } else {
        return DateFormat('dd/MM/yy').format(date);
      }
    } catch (e) {
      return '';
    }
  }
}
