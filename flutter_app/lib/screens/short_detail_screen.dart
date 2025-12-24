import 'package:flutter/material.dart';
import 'dart:ui';

import '../models/short_novel.dart';

class ShortDetailScreen extends StatelessWidget {
  final ShortNovel novel;

  const ShortDetailScreen({super.key, required this.novel});

  @override
  Widget build(BuildContext context) {
    final content = novel.chapters?.isNotEmpty == true
        ? novel.chapters!.first.content
        : novel.blurb;

    return Scaffold(
      body: Stack(
        children: [
          // Content
          CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                pinned: true,
                backgroundColor: Colors.black.withOpacity(0.9),
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Color(0xFF3b82f6)),
                  onPressed: () => Navigator.pop(context),
                ),
                title: Text(
                  novel.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                actions: [
                  TextButton(
                    onPressed: () {},
                    child: const Text(
                      'Share',
                      style: TextStyle(color: Color(0xFF3b82f6)),
                    ),
                  ),
                ],
              ),
              // Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title
                      Text(
                        novel.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Author
                      Text(
                        'by ${novel.authorName}',
                        style: TextStyle(color: Colors.grey[400]),
                      ),
                      const SizedBox(height: 16),
                      // Tags
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _buildTag(novel.displayGenre, isPrimary: true),
                          if (novel.tags != null)
                            ...novel.tags!.take(3).map(
                                  (tag) => _buildTag(tag.name),
                                ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Stats
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          border: Border(
                            top: BorderSide(color: Colors.grey[800]!),
                            bottom: BorderSide(color: Colors.grey[800]!),
                          ),
                        ),
                        child: Row(
                          children: [
                            _buildStatItem(
                              '${novel.viewCount.toString()} views',
                            ),
                            const SizedBox(width: 16),
                            _buildStatItem(
                              '${novel.likeCount.toString()} likes',
                            ),
                            const SizedBox(width: 16),
                            _buildStatItem(
                              '${novel.wordCount.toString()} words',
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Story Content
                      ...content.split('\n').where((p) => p.trim().isNotEmpty).map(
                            (paragraph) => Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: Text(
                                paragraph,
                                style: TextStyle(
                                  color: Colors.grey[200],
                                  fontSize: 18,
                                  height: 1.8,
                                ),
                              ),
                            ),
                          ),
                      // End marker
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 32),
                        child: Center(
                          child: Text(
                            '— The End —',
                            style: TextStyle(
                              color: Colors.grey[500],
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Bottom Action Bar
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  color: Colors.black.withOpacity(0.8),
                  child: SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildBottomAction('♡', novel.likeCount.toString()),
                          _buildBottomAction('💬', 'Comments'),
                          ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF3b82f6),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24),
                              ),
                            ),
                            child: const Text(
                              'Save to Library',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          _buildBottomAction('↗', 'Share'),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(String text, {bool isPrimary = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isPrimary
            ? const Color(0xFF3b82f6).withOpacity(0.2)
            : Colors.grey[800],
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: isPrimary ? const Color(0xFF60a5fa) : Colors.grey[400],
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildStatItem(String text) {
    return Text(
      text,
      style: TextStyle(
        color: Colors.grey[500],
        fontSize: 14,
      ),
    );
  }

  Widget _buildBottomAction(String icon, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(icon, style: const TextStyle(fontSize: 24)),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[400],
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
