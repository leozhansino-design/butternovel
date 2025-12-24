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
              padding: const EdgeInsets.fromLTRB(16, 80, 16, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Spacer(),
                  // Genre Tag
                  ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          novel.displayGenre,
                          style: TextStyle(
                            color: const Color(0xFF60a5fa),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Title
                  Text(
                    novel.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  // Author
                  Text(
                    'by ${novel.authorName}',
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Preview Text
                  Expanded(
                    child: SingleChildScrollView(
                      child: Text(
                        novel.previewText,
                        style: TextStyle(
                          color: Colors.grey[200],
                          fontSize: 16,
                          height: 1.6,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Stats
                  Row(
                    children: [
                      _buildStat('${_formatCount(novel.viewCount)} views'),
                      const SizedBox(width: 16),
                      _buildStat('${_formatCount(novel.likeCount)} likes'),
                      const SizedBox(width: 16),
                      _buildStat('${novel.wordCount.toString()} words'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
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
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'Read Full Story',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      _buildActionButton('♡'),
                      const SizedBox(width: 8),
                      _buildActionButton('↗'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // Side Actions (TikTok style)
          Positioned(
            right: 12,
            bottom: 180,
            child: Column(
              children: [
                _buildSideAction('♡', _formatCount(novel.likeCount)),
                const SizedBox(height: 20),
                _buildSideAction('💬', '0'),
                const SizedBox(height: 20),
                _buildSideAction('🔖', 'Save'),
                const SizedBox(height: 20),
                _buildSideAction('↗', 'Share'),
              ],
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

  Widget _buildActionButton(String icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[800],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        icon,
        style: const TextStyle(fontSize: 20),
      ),
    );
  }

  Widget _buildSideAction(String icon, String label) {
    return Column(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: Colors.grey[800]?.withOpacity(0.8),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              icon,
              style: const TextStyle(fontSize: 20),
            ),
          ),
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
