import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn || authProvider.token == null) {
      setState(() => _isLoading = false);
      return;
    }

    final notifications = await ApiService.getNotifications(token: authProvider.token!);

    if (mounted) {
      setState(() {
        _notifications = notifications;
        _isLoading = false;
      });
    }
  }

  Future<void> _markAllRead() async {
    final token = context.read<AuthProvider>().token;
    if (token != null) {
      await ApiService.markAllNotificationsRead(token: token);
      _loadNotifications();
    }
  }

  String _getNotificationIcon(String type) {
    switch (type) {
      case 'NOVEL_RATING':
        return '⭐';
      case 'NOVEL_COMMENT':
        return '💬';
      case 'COMMENT_REPLY':
        return '↩️';
      case 'NOVEL_BOOKMARK':
        return '🔖';
      case 'NEW_FOLLOWER':
        return '👤';
      case 'NOVEL_LIKE':
        return '❤️';
      default:
        return '🔔';
    }
  }

  String _getNotificationText(Map<String, dynamic> notification) {
    final type = notification['type'] ?? '';
    final actorName = notification['actor']?['name'] ?? 'Someone';
    final data = notification['data'] ?? {};
    final novelTitle = data['novelTitle'] ?? 'your story';

    switch (type) {
      case 'NOVEL_RATING':
        final score = data['score'] ?? 0;
        return '$actorName rated "$novelTitle" $score/10';
      case 'NOVEL_COMMENT':
        return '$actorName commented on "$novelTitle"';
      case 'COMMENT_REPLY':
        return '$actorName replied to your comment';
      case 'NOVEL_BOOKMARK':
        return '$actorName bookmarked "$novelTitle"';
      case 'NEW_FOLLOWER':
        return '$actorName started following you';
      case 'NOVEL_LIKE':
        return '$actorName liked "$novelTitle"';
      default:
        return 'You have a new notification';
    }
  }

  String _formatTime(String? isoDate) {
    if (isoDate == null) return '';
    try {
      final date = DateTime.parse(isoDate);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m';
      if (diff.inHours < 24) return '${diff.inHours}h';
      if (diff.inDays < 7) return '${diff.inDays}d';
      return '${date.month}/${date.day}';
    } catch (e) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final isDark = themeProvider.isDarkMode;
        final bgColor = isDark ? Colors.black : Colors.white;
        final textColor = isDark ? Colors.white : Colors.grey[900]!;
        final subtitleColor = isDark ? Colors.grey[500]! : Colors.grey[600]!;
        final cardBgColor = isDark ? Colors.grey[900]! : Colors.grey[100]!;
        final unreadBgColor = isDark ? Colors.blue.withOpacity(0.1) : Colors.blue.withOpacity(0.05);

        return Scaffold(
          backgroundColor: bgColor,
          appBar: AppBar(
            backgroundColor: bgColor,
            elevation: 0,
            leading: IconButton(
              icon: Icon(Icons.arrow_back, color: textColor),
              onPressed: () => Navigator.pop(context),
            ),
            title: Text(
              'Notifications',
              style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
            ),
            actions: [
              if (_notifications.isNotEmpty)
                TextButton(
                  onPressed: _markAllRead,
                  child: const Text('Mark all read'),
                ),
            ],
          ),
          body: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : !context.read<AuthProvider>().isLoggedIn
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.login, size: 64, color: subtitleColor),
                          const SizedBox(height: 16),
                          Text(
                            'Please sign in',
                            style: TextStyle(color: textColor, fontSize: 18),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Sign in to view your notifications',
                            style: TextStyle(color: subtitleColor),
                          ),
                        ],
                      ),
                    )
                  : _notifications.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.notifications_none, size: 64, color: subtitleColor),
                              const SizedBox(height: 16),
                              Text(
                                'No notifications',
                                style: TextStyle(color: textColor, fontSize: 18),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'You\'re all caught up!',
                                style: TextStyle(color: subtitleColor),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadNotifications,
                          child: ListView.builder(
                            itemCount: _notifications.length,
                            itemBuilder: (context, index) {
                              final notification = _notifications[index];
                              final isRead = notification['read'] == true;

                              return Container(
                                color: isRead ? null : unreadBgColor,
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  leading: Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: cardBgColor,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Center(
                                      child: Text(
                                        _getNotificationIcon(notification['type'] ?? ''),
                                        style: const TextStyle(fontSize: 20),
                                      ),
                                    ),
                                  ),
                                  title: Text(
                                    _getNotificationText(notification),
                                    style: TextStyle(
                                      color: textColor,
                                      fontWeight: isRead ? FontWeight.normal : FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  subtitle: Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(
                                      _formatTime(notification['createdAt']),
                                      style: TextStyle(
                                        color: subtitleColor,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                  trailing: !isRead
                                      ? Container(
                                          width: 8,
                                          height: 8,
                                          decoration: const BoxDecoration(
                                            color: Color(0xFF3b82f6),
                                            shape: BoxShape.circle,
                                          ),
                                        )
                                      : null,
                                  onTap: () async {
                                    final token = context.read<AuthProvider>().token;
                                    final id = notification['id']?.toString();
                                    if (token != null && id != null && !isRead) {
                                      await ApiService.markNotificationRead(id, token: token);
                                      _loadNotifications();
                                    }
                                    // TODO: Navigate to related content based on notification type
                                  },
                                ),
                              );
                            },
                          ),
                        ),
        );
      },
    );
  }
}
