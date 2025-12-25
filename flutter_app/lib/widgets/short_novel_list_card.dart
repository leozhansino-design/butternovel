import 'package:flutter/material.dart';

import '../models/short_novel.dart';
import '../screens/short_detail_screen.dart';

class ShortNovelListCard extends StatelessWidget {
  final ShortNovel novel;

  const ShortNovelListCard({
    super.key,
    required this.novel,
  });

  @override
  Widget build(BuildContext context) {
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
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[800]!, width: 1),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Genre Tag & Reading Time
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3b82f6).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    novel.displayGenre,
                    style: const TextStyle(
                      color: Color(0xFF3b82f6),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Row(
                  children: [
                    Icon(Icons.schedule, color: Colors.grey[500], size: 14),
                    const SizedBox(width: 4),
                    Text(
                      _getReadingTime(novel.wordCount),
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Title
            Text(
              novel.title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            // Preview text
            Text(
              novel.previewText,
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 13,
                height: 1.5,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            // Stats row
            Row(
              children: [
                // Views
                Icon(Icons.visibility_outlined, color: Colors.grey[500], size: 14),
                const SizedBox(width: 4),
                Text(
                  _formatCount(novel.viewCount),
                  style: TextStyle(color: Colors.grey[500], fontSize: 12),
                ),
                const SizedBox(width: 12),
                // Rating
                if (novel.averageRating != null && novel.averageRating! > 0) ...[
                  Icon(Icons.star, color: Colors.amber[400], size: 14),
                  const SizedBox(width: 4),
                  Text(
                    novel.averageRating!.toStringAsFixed(1),
                    style: TextStyle(
                      color: Colors.amber[400],
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
                const Spacer(),
                // Read button
                Text(
                  'Read →',
                  style: TextStyle(
                    color: const Color(0xFF3b82f6),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getReadingTime(int wordCount) {
    // Average reading speed: ~450 chars per minute
    final minutes = (wordCount / 450).ceil();
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return '$minutes min';
    final hours = minutes ~/ 60;
    final remainingMins = minutes % 60;
    if (remainingMins == 0) return '${hours}h';
    return '${hours}h ${remainingMins}m';
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
      'sweet-romance': const Color(0xFFec4899),
      'billionaire-romance': const Color(0xFFeab308),
      'face-slapping': const Color(0xFFf97316),
      'revenge': const Color(0xFFef4444),
      'rebirth': const Color(0xFF8b5cf6),
      'regret': const Color(0xFF6366f1),
      'healing-redemption': const Color(0xFF22c55e),
      'true-fake-identity': const Color(0xFF06b6d4),
      'substitute': const Color(0xFFa855f7),
      'age-gap': const Color(0xFFec4899),
      'entertainment-circle': const Color(0xFFf59e0b),
      'group-pet': const Color(0xFFfb7185),
      'lgbtq': const Color(0xFF7c3aed),
      'quick-transmigration': const Color(0xFF0ea5e9),
      'survival-apocalypse': const Color(0xFF991b1b),
      'system': const Color(0xFF14b8a6),
    };

    return colors[genre] ?? const Color(0xFF3b82f6);
  }
}
