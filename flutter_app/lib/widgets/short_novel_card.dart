import 'package:flutter/material.dart';
import 'dart:ui';

import '../models/short_novel.dart';
import '../screens/short_detail_screen.dart';

class ShortNovelCard extends StatelessWidget {
  final ShortNovel novel;
  final bool isActive;

  const ShortNovelCard({
    super.key,
    required this.novel,
    required this.isActive,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      child: Stack(
        children: [
          // Background color based on genre
          Container(
            decoration: BoxDecoration(
              color: _getGenreColor(novel.displayGenre).withOpacity(0.15),
            ),
          ),
          // Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title at top (below For You header)
                  Text(
                    novel.title,
                    style: const TextStyle(
                      color: Colors.white,
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
                        'by ${novel.authorName}',
                        style: TextStyle(
                          color: Colors.grey[400],
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
                          color: _getGenreColor(novel.displayGenre).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
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
                      const Spacer(),
                      // Search icon
                      IconButton(
                        onPressed: () {
                          // TODO: Navigate to search
                        },
                        icon: Icon(
                          Icons.search,
                          color: Colors.grey[400],
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
                          novel.previewText,
                          style: TextStyle(
                            color: Colors.grey[200],
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
                  // Stats
                  Row(
                    children: [
                      _buildStat('${_formatCount(novel.viewCount)} views'),
                      const SizedBox(width: 16),
                      _buildStat('${_formatCount(novel.likeCount)} likes'),
                      const SizedBox(width: 16),
                      _buildStat('${novel.wordCount.toString()} chars'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Bottom Actions Row with swipe indicator
                  Row(
                    children: [
                      // Like button
                      _buildBottomAction(Icons.favorite_border, 'Like'),
                      const SizedBox(width: 8),
                      // Comment button
                      _buildBottomAction(Icons.chat_bubble_outline, 'Comment'),
                      const SizedBox(width: 8),
                      // Save button
                      _buildBottomAction(Icons.bookmark_border, 'Save'),
                      const SizedBox(width: 8),
                      // Share button
                      _buildBottomAction(Icons.share_outlined, 'Share'),
                      const SizedBox(width: 8),
                      // Swipe indicator
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                        decoration: BoxDecoration(
                          color: Colors.grey[800]?.withOpacity(0.6),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.swap_vert,
                              color: Colors.grey[400],
                              size: 22,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Swipe',
                              style: TextStyle(
                                color: Colors.grey[400],
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Start Reading Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ShortDetailScreen(novel: novel),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3b82f6),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Start Reading',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
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

  Widget _buildStat(String text) {
    return Text(
      text,
      style: TextStyle(
        color: Colors.grey[400],
        fontSize: 14,
      ),
    );
  }

  Widget _buildBottomAction(IconData icon, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: Colors.grey[800]?.withOpacity(0.6),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: Colors.white,
              size: 22,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
              ),
            ),
          ],
        ),
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
    };

    return colors[genre] ?? const Color(0xFF3b82f6);
  }
}
