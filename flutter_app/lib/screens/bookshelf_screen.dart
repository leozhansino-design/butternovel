import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/short_novel.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'short_detail_screen.dart';

class BookshelfScreen extends StatefulWidget {
  const BookshelfScreen({super.key});

  @override
  State<BookshelfScreen> createState() => _BookshelfScreenState();
}

class _BookshelfScreenState extends State<BookshelfScreen> {
  List<ShortNovel> _likedStories = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadLikedStories();
  }

  Future<void> _loadLikedStories() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn) return;

    setState(() => _isLoading = true);

    try {
      // For now, fetch some stories as placeholder
      // In a real app, this would fetch the user's liked/saved stories
      final stories = await ApiService.fetchShorts(limit: 10);
      if (mounted) {
        setState(() {
          _likedStories = stories;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
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
        final subtitleColor = isDark ? Colors.grey[400]! : Colors.grey[600]!;
        final cardBgColor = isDark ? Colors.grey[900]! : Colors.grey[100]!;

        // Not logged in state
        if (!authProvider.isLoggedIn) {
          return Scaffold(
            backgroundColor: bgColor,
            body: SafeArea(
              child: Column(
                children: [
                  // Header
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Text(
                          'My Bookshelf',
                          style: TextStyle(
                            color: textColor,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Login prompt
                  Expanded(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.bookmark_outline,
                              size: 64,
                              color: subtitleColor,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Sign in to see your bookshelf',
                              style: TextStyle(
                                color: textColor,
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Save your favorite stories and pick up where you left off',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: subtitleColor,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton(
                              onPressed: () async {
                                final result = await Navigator.push<bool>(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const LoginScreen(),
                                  ),
                                );
                                if (result == true) {
                                  _loadLikedStories();
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF3b82f6),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 32,
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(24),
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
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        // Logged in state
        return Scaffold(
          backgroundColor: bgColor,
          body: SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Text(
                        'My Bookshelf',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${_likedStories.length} stories',
                        style: TextStyle(
                          color: subtitleColor,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                // Content
                Expanded(
                  child: _isLoading
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFF3b82f6),
                          ),
                        )
                      : _likedStories.isEmpty
                          ? _buildEmptyState(textColor, subtitleColor)
                          : RefreshIndicator(
                              onRefresh: _loadLikedStories,
                              color: const Color(0xFF3b82f6),
                              child: ListView.builder(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                itemCount: _likedStories.length,
                                itemBuilder: (context, index) {
                                  return _buildStoryCard(
                                    _likedStories[index],
                                    isDark,
                                    textColor,
                                    subtitleColor,
                                    cardBgColor,
                                  );
                                },
                              ),
                            ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(Color textColor, Color subtitleColor) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.favorite_outline,
              size: 64,
              color: subtitleColor,
            ),
            const SizedBox(height: 16),
            Text(
              'No saved stories yet',
              style: TextStyle(
                color: textColor,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Stories you like will appear here',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: subtitleColor,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStoryCard(
    ShortNovel novel,
    bool isDark,
    Color textColor,
    Color subtitleColor,
    Color cardBgColor,
  ) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ShortDetailScreen(novel: novel),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBgColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            // Story info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    novel.title,
                    style: TextStyle(
                      color: textColor,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    novel.authorName,
                    style: TextStyle(
                      color: subtitleColor,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: _getGenreColor(novel.displayGenre)
                              .withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          novel.displayGenre,
                          style: TextStyle(
                            color: _getGenreColor(novel.displayGenre),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.favorite,
                        size: 14,
                        color: Colors.red[400],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${novel.likeCount}',
                        style: TextStyle(
                          color: subtitleColor,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Arrow icon
            Icon(
              Icons.chevron_right,
              color: subtitleColor,
            ),
          ],
        ),
      ),
    );
  }

  Color _getGenreColor(String genre) {
    final colors = {
      'Romance': const Color(0xFFec4899),
      'Sweet Romance': const Color(0xFFec4899),
      'Fantasy': const Color(0xFF8b5cf6),
      'Thriller': const Color(0xFFef4444),
      'Revenge': const Color(0xFFef4444),
      'Rebirth': const Color(0xFF8b5cf6),
      'Billionaire': const Color(0xFFeab308),
    };
    return colors[genre] ?? const Color(0xFF3b82f6);
  }
}
