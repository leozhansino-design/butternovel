import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/reading_history_service.dart';
import 'login_screen.dart';
import 'reading_history_screen.dart';
import 'my_stories_screen.dart';
import 'notifications_screen.dart';
import 'settings_screen.dart';
import 'follow_list_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  int _storiesRead = 0;
  int _following = 0;
  int _followers = 0;
  int _bookmarked = 0;
  bool _isLoadingStats = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final authProvider = context.read<AuthProvider>();

    // Load local reading history count
    final historyCount = await ReadingHistoryService.getHistoryCount();

    if (authProvider.isLoggedIn && authProvider.user != null) {
      // Load stats from API
      final stats = await ApiService.getUserStats(
        authProvider.user!.id,
        token: authProvider.token,
      );

      if (mounted) {
        setState(() {
          _storiesRead = historyCount;
          _following = stats['following'] ?? 0;
          _followers = stats['followers'] ?? 0;
          _bookmarked = stats['bookmarked'] ?? 0;
          _isLoadingStats = false;
        });
      }
    } else {
      if (mounted) {
        setState(() {
          _storiesRead = historyCount;
          _isLoadingStats = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<ThemeProvider, AuthProvider>(
      builder: (context, themeProvider, authProvider, child) {
        final isDark = themeProvider.isDarkMode;
        final bgColor = isDark ? Colors.black : Colors.white;
        final textColor = isDark ? Colors.white : Colors.grey[900]!;
        final subtitleColor = isDark ? Colors.grey[500]! : Colors.grey[600]!;
        final cardBgColor = isDark ? Colors.grey[900]! : Colors.grey[100]!;
        final borderColor = isDark ? Colors.grey[800]! : Colors.grey[300]!;
        final avatarBgColor = isDark ? Colors.grey[700]! : Colors.grey[300]!;

        final isLoggedIn = authProvider.isLoggedIn;
        final user = authProvider.user;

        return Scaffold(
          backgroundColor: bgColor,
          body: SafeArea(
            child: RefreshIndicator(
              onRefresh: _loadStats,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    // Header
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Profile',
                            style: TextStyle(
                              color: textColor,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (isLoggedIn)
                            TextButton(
                              onPressed: () async {
                                final result = await Navigator.push<bool>(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const SettingsScreen(),
                                  ),
                                );
                                if (result == true) {
                                  _loadStats();
                                }
                              },
                              child: const Text(
                                'Settings',
                                style: TextStyle(color: Color(0xFF3b82f6)),
                              ),
                            ),
                        ],
                      ),
                    ),
                    // Profile Card
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: Column(
                        children: [
                          // Avatar
                          Container(
                            width: 96,
                            height: 96,
                            decoration: BoxDecoration(
                              color: isLoggedIn ? const Color(0xFF3b82f6) : avatarBgColor,
                              shape: BoxShape.circle,
                              image: user?.avatarUrl != null
                                  ? DecorationImage(
                                      image: NetworkImage(user!.avatarUrl!),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                            ),
                            child: user?.avatarUrl == null
                                ? Center(
                                    child: Text(
                                      isLoggedIn
                                          ? (user?.username.isNotEmpty == true
                                              ? user!.username[0].toUpperCase()
                                              : 'U')
                                          : 'G',
                                      style: TextStyle(
                                        color: isLoggedIn ? Colors.white : textColor,
                                        fontSize: 36,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  )
                                : null,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            isLoggedIn ? (user?.username ?? 'User') : 'Guest User',
                            style: TextStyle(
                              color: textColor,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isLoggedIn ? (user?.email ?? '') : 'Not signed in',
                            style: TextStyle(color: subtitleColor),
                          ),
                        ],
                      ),
                    ),
                    // Sign In/Out Buttons
                    if (!isLoggedIn)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          children: [
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () async {
                                  await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const LoginScreen(),
                                    ),
                                  );
                                  _loadStats();
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF3b82f6),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: const Text(
                                  'Sign In',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton(
                                onPressed: () async {
                                  await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const LoginScreen(),
                                    ),
                                  );
                                  _loadStats();
                                },
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Color(0xFF3b82f6)),
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: const Text(
                                  'Create Account',
                                  style: TextStyle(
                                    color: Color(0xFF3b82f6),
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 24),
                    // Stats
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: cardBgColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStatItem(
                            _isLoadingStats ? '-' : '$_storiesRead',
                            'Stories Read',
                            textColor,
                            subtitleColor,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const ReadingHistoryScreen(),
                                ),
                              );
                            },
                          ),
                          _buildStatItem(
                            _isLoadingStats ? '-' : '$_following',
                            'Following',
                            textColor,
                            subtitleColor,
                            onTap: isLoggedIn
                                ? () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => FollowListScreen(
                                          type: FollowListType.following,
                                          userId: user!.id,
                                        ),
                                      ),
                                    );
                                  }
                                : null,
                          ),
                          _buildStatItem(
                            _isLoadingStats ? '-' : '$_followers',
                            'Followers',
                            textColor,
                            subtitleColor,
                            onTap: isLoggedIn
                                ? () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => FollowListScreen(
                                          type: FollowListType.followers,
                                          userId: user!.id,
                                        ),
                                      ),
                                    );
                                  }
                                : null,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Menu Items
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        children: [
                          _buildMenuItem(
                            'Reading History',
                            Icons.history,
                            textColor,
                            subtitleColor,
                            borderColor,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const ReadingHistoryScreen(),
                                ),
                              );
                            },
                          ),
                          _buildMenuItem(
                            'My Stories',
                            Icons.edit_note,
                            textColor,
                            subtitleColor,
                            borderColor,
                            onTap: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const MyStoriesScreen(),
                                ),
                              );
                            },
                          ),
                          _buildMenuItem(
                            'Notifications',
                            Icons.notifications_outlined,
                            textColor,
                            subtitleColor,
                            borderColor,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const NotificationsScreen(),
                                ),
                              );
                            },
                          ),
                          _buildMenuItem(
                            'Theme',
                            isDark ? Icons.dark_mode : Icons.light_mode,
                            textColor,
                            subtitleColor,
                            borderColor,
                            subtitle: isDark ? 'Dark' : 'Light',
                            onTap: () => themeProvider.toggleTheme(),
                          ),
                          if (isLoggedIn)
                            _buildMenuItem(
                              'Sign Out',
                              Icons.logout,
                              Colors.red,
                              subtitleColor,
                              borderColor,
                              onTap: () async {
                                final confirm = await showDialog<bool>(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    backgroundColor: cardBgColor,
                                    title: Text(
                                      'Sign Out',
                                      style: TextStyle(color: textColor),
                                    ),
                                    content: Text(
                                      'Are you sure you want to sign out?',
                                      style: TextStyle(color: subtitleColor),
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context, false),
                                        child: Text(
                                          'Cancel',
                                          style: TextStyle(color: subtitleColor),
                                        ),
                                      ),
                                      TextButton(
                                        onPressed: () => Navigator.pop(context, true),
                                        child: const Text(
                                          'Sign Out',
                                          style: TextStyle(color: Colors.red),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                                if (confirm == true) {
                                  await authProvider.logout();
                                  _loadStats();
                                }
                              },
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatItem(
    String value,
    String label,
    Color textColor,
    Color subtitleColor, {
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: textColor,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: subtitleColor,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    String title,
    IconData icon,
    Color textColor,
    Color subtitleColor,
    Color borderColor, {
    String? subtitle,
    VoidCallback? onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: borderColor),
        ),
      ),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(icon, color: textColor, size: 22),
        title: Text(
          title,
          style: TextStyle(color: textColor),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (subtitle != null)
              Text(
                subtitle,
                style: TextStyle(color: subtitleColor),
              ),
            const SizedBox(width: 8),
            Icon(
              Icons.chevron_right,
              color: subtitleColor,
            ),
          ],
        ),
        onTap: onTap ?? () {},
      ),
    );
  }
}
