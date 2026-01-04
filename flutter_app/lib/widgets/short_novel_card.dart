import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../models/short_novel.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/user_provider.dart';
import '../screens/short_detail_screen.dart';
import '../screens/search_screen.dart';
import '../screens/login_screen.dart';
import '../services/api_service.dart';

class ShortNovelCard extends StatefulWidget {
  final ShortNovel novel;
  final bool isActive;

  const ShortNovelCard({
    super.key,
    required this.novel,
    required this.isActive,
  });

  @override
  State<ShortNovelCard> createState() => _ShortNovelCardState();
}

class _ShortNovelCardState extends State<ShortNovelCard> {
  int _likeCount = 0;

  @override
  void initState() {
    super.initState();
    _likeCount = widget.novel.likeCount;
  }

  Future<void> _handleLike() async {
    final authProvider = context.read<AuthProvider>();

    if (!authProvider.isLoggedIn) {
      // Navigate to login screen
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );

      // If login successful, proceed with like
      if (result == true && mounted) {
        _performLike();
      }
      return;
    }

    _performLike();
  }

  void _performLike() {
    final userProvider = context.read<UserProvider>();
    final wasLiked = userProvider.isLiked(widget.novel.id);

    // Toggle like in UserProvider (pass novel for bookshelf)
    userProvider.toggleLike(widget.novel.id, novel: widget.novel);

    // Update local count
    setState(() {
      if (wasLiked) {
        _likeCount--;
      } else {
        _likeCount++;
      }
    });

    // Call API to persist like
    ApiService.toggleLike(widget.novel.id);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(!wasLiked ? 'Added to bookshelf' : 'Removed from bookshelf'),
        backgroundColor: Colors.grey[800],
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _handleShare() async {
    final authProvider = context.read<AuthProvider>();

    if (!authProvider.isLoggedIn) {
      // Navigate to login screen
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );

      // If login successful, proceed with share
      if (result == true && mounted) {
        _performShare();
      }
      return;
    }

    _performShare();
  }

  void _performShare() {
    Share.share(
      'Check out "${widget.novel.title}" by ${widget.novel.authorName} on ButterNovel!\n\nhttps://butternovel.com/shorts/${widget.novel.id}',
      subject: widget.novel.title,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<ThemeProvider, UserProvider>(
      builder: (context, themeProvider, userProvider, child) {
        final isDark = themeProvider.isDarkMode;
        final bgColor = isDark ? Colors.black : Colors.white;
        final textColor = isDark ? Colors.white : Colors.grey[900]!;
        final subtitleColor = isDark ? Colors.grey[400]! : Colors.grey[600]!;
        final cardBgColor = isDark ? Colors.grey[800]?.withOpacity(0.6) : Colors.grey[300]?.withOpacity(0.8);
        final isLiked = userProvider.isLiked(widget.novel.id);

        return Container(
          color: bgColor,
          child: Stack(
            children: [
              // Background color based on genre
              Container(
                decoration: BoxDecoration(
                  color: _getGenreColor(widget.novel.displayGenre).withOpacity(isDark ? 0.15 : 0.08),
                ),
              ),
              // Content
              Padding(
                padding: EdgeInsets.fromLTRB(
                  16,
                  MediaQuery.of(context).padding.top + 16, // Safe area + extra padding
                  16,
                  16,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title at top
                    Text(
                      widget.novel.title,
                      style: TextStyle(
                        color: textColor,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    // Author, Tag, and Search on same row
                    Row(
                      children: [
                        Text(
                          'by ${widget.novel.authorName}',
                          style: TextStyle(
                            color: subtitleColor,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Genre Tag
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: _getGenreColor(widget.novel.displayGenre).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            widget.novel.displayGenre,
                            style: TextStyle(
                              color: _getGenreColor(widget.novel.displayGenre),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const Spacer(),
                        // Search icon
                        IconButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const SearchScreen(),
                              ),
                            );
                          },
                          icon: Icon(
                            Icons.search,
                            color: subtitleColor,
                            size: 22,
                          ),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Preview Text - dynamically fill available space
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          // Calculate max lines based on available height
                          const double fontSize = 16;
                          const double lineHeight = 1.6;
                          final double lineSize = fontSize * lineHeight;
                          final int maxLines = (constraints.maxHeight / lineSize).floor();

                          return Text(
                            widget.novel.previewText,
                            style: TextStyle(
                              color: isDark ? Colors.grey[200] : Colors.grey[800],
                              fontSize: fontSize,
                              height: lineHeight,
                            ),
                            maxLines: maxLines > 0 ? maxLines : 1,
                            overflow: TextOverflow.ellipsis,
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Stats with rating
                    Row(
                      children: [
                        // Rating (if available)
                        if (widget.novel.averageRating != null && widget.novel.averageRating! > 0) ...[
                          Icon(Icons.star, color: Colors.amber[400], size: 16),
                          const SizedBox(width: 4),
                          Text(
                            widget.novel.averageRating!.toStringAsFixed(1),
                            style: TextStyle(
                              color: Colors.amber[400],
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 16),
                        ],
                        _buildStat('${_formatCount(widget.novel.viewCount)} views', subtitleColor),
                        const SizedBox(width: 16),
                        _buildStat('${_formatCount(_likeCount)} likes', subtitleColor),
                        const SizedBox(width: 16),
                        _buildStat(_getReadingTime(widget.novel.wordCount), subtitleColor),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Bottom Action Row: Start Reading + Like + Share + Theme Toggle
                    Row(
                      children: [
                        // Start Reading Button
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ShortDetailScreen(novel: widget.novel),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF3b82f6),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24),
                              ),
                            ),
                            child: const Text(
                              'Start Reading',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Like button
                        GestureDetector(
                          onTap: _handleLike,
                          child: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: isLiked
                                  ? Colors.red.withOpacity(0.2)
                                  : cardBgColor,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              isLiked ? Icons.favorite : Icons.favorite_border,
                              color: isLiked ? Colors.red : textColor,
                              size: 22,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Share button
                        GestureDetector(
                          onTap: _handleShare,
                          child: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: cardBgColor,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.share_outlined,
                              color: textColor,
                              size: 22,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Theme toggle button
                        GestureDetector(
                          onTap: () => themeProvider.toggleTheme(),
                          child: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: cardBgColor,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                              color: isDark ? Colors.amber[400] : Colors.indigo[400],
                              size: 22,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStat(String text, Color color) {
    return Text(
      text,
      style: TextStyle(
        color: color,
        fontSize: 14,
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    }
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  String _getReadingTime(int wordCount) {
    // ~1350 chars per minute (faster reading speed for short content)
    final minutes = (wordCount / 1350).ceil();
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return '$minutes min';
    final hours = minutes ~/ 60;
    final remainingMins = minutes % 60;
    if (remainingMins == 0) return '${hours}h';
    return '${hours}h ${remainingMins}m';
  }

  Color _getGenreColor(String genre) {
    final colors = {
      'Romance': const Color(0xFFec4899),
      'Fantasy': const Color(0xFF8b5cf6),
      'Thriller': const Color(0xFFef4444),
      'Mystery': const Color(0xFF6366f1),
      'Sci-Fi': const Color(0xFF06b6d4),
      'Drama': const Color(0xFFf59e0b),
      'Comedy': const Color(0xFF22c55e),
      'Horror': const Color(0xFF991b1b),
      'Age Gap': const Color(0xFFec4899),
      'Billionaire Romance': const Color(0xFFeab308),
      'Second Chance': const Color(0xFFf97316),
      'Enemies to Lovers': const Color(0xFFdc2626),
      'Fake Dating': const Color(0xFFa855f7),
      'Sweet Romance': const Color(0xFFec4899),
      'Face-Slapping': const Color(0xFFef4444),
      'Revenge': const Color(0xFFdc2626),
      'Rebirth': const Color(0xFF8b5cf6),
      'Regret': const Color(0xFF6366f1),
      'Healing/Redemption': const Color(0xFF22c55e),
      'True/Fake Identity': const Color(0xFFa855f7),
      'Substitute': const Color(0xFFf97316),
    };

    return colors[genre] ?? const Color(0xFF3b82f6);
  }
}
