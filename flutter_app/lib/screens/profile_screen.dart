import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

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
            child: SingleChildScrollView(
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
                        TextButton(
                          onPressed: () {},
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
                          ),
                          child: Center(
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
                          ),
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
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const LoginScreen(),
                                  ),
                                );
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
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const LoginScreen(),
                                  ),
                                );
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
                        _buildStatItem('0', 'Stories Read', textColor, subtitleColor),
                        _buildStatItem('0', 'Following', textColor, subtitleColor),
                        _buildStatItem('0', 'Bookmarked', textColor, subtitleColor),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Menu Items
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: [
                        _buildMenuItem('Reading History', textColor, subtitleColor, borderColor),
                        _buildMenuItem('My Stories', textColor, subtitleColor, borderColor),
                        _buildMenuItem('Notifications', textColor, subtitleColor, borderColor),
                        _buildMenuItem(
                          'Theme',
                          textColor,
                          subtitleColor,
                          borderColor,
                          subtitle: isDark ? 'Dark' : 'Light',
                          onTap: () => themeProvider.toggleTheme(),
                        ),
                        _buildMenuItem('About ButterNovel', textColor, subtitleColor, borderColor),
                        if (isLoggedIn)
                          _buildMenuItem(
                            'Sign Out',
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
        );
      },
    );
  }

  Widget _buildStatItem(String value, String label, Color textColor, Color subtitleColor) {
    return Column(
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
    );
  }

  Widget _buildMenuItem(
    String title,
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
