import 'package:flutter/material.dart';
import 'dart:ui';

import '../models/short_novel.dart';
import '../services/api_service.dart';
import '../widgets/comment_sheet.dart';
import '../widgets/rating_widget.dart';

class ShortDetailScreen extends StatefulWidget {
  final ShortNovel novel;

  const ShortDetailScreen({super.key, required this.novel});

  @override
  State<ShortDetailScreen> createState() => _ShortDetailScreenState();
}

class _ShortDetailScreenState extends State<ShortDetailScreen> {
  ShortNovel? _fullNovel;
  bool _isLoading = true;
  String? _error;
  int? _currentViewCount;
  Map<int, int> _commentCounts = {};
  double? _averageRating;
  int? _totalRatings;

  @override
  void initState() {
    super.initState();
    _fetchFullContent();
    _trackView();
  }

  Future<void> _fetchFullContent() async {
    try {
      final fullNovel = await ApiService.fetchShortById(widget.novel.id);
      setState(() {
        _fullNovel = fullNovel;
        _averageRating = fullNovel.averageRating;
        _isLoading = false;
      });

      // Load comment counts if we have chapter
      if (fullNovel.chapters?.isNotEmpty == true) {
        final chapterId = fullNovel.chapters!.first.id;
        final counts = await ApiService.getCommentCounts(chapterId);
        if (mounted) {
          setState(() => _commentCounts = counts);
        }
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _trackView() async {
    final newViewCount = await ApiService.trackView(widget.novel.id);
    if (newViewCount != null && mounted) {
      setState(() => _currentViewCount = newViewCount);
    }
  }

  void _showCommentSheet(int paragraphIndex, String paragraphText) {
    final novel = _fullNovel ?? widget.novel;
    if (novel.chapters?.isEmpty ?? true) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => CommentSheet(
        novelId: novel.id,
        chapterId: novel.chapters!.first.id,
        paragraphIndex: paragraphIndex,
        paragraphText: paragraphText,
      ),
    ).then((_) {
      // Refresh comment counts after closing
      if (novel.chapters?.isNotEmpty == true) {
        ApiService.getCommentCounts(novel.chapters!.first.id).then((counts) {
          if (mounted) setState(() => _commentCounts = counts);
        });
      }
    });
  }

  void _refreshRating() {
    ApiService.fetchShortById(widget.novel.id).then((novel) {
      if (mounted) {
        setState(() {
          _averageRating = novel.averageRating;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final novel = _fullNovel ?? widget.novel;
    final content = novel.chapters?.isNotEmpty == true
        ? novel.chapters!.first.content
        : novel.blurb;
    final paragraphs = content
        .split('\n')
        .where((p) => p.trim().isNotEmpty)
        .toList();

    return Scaffold(
      backgroundColor: Colors.black,
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
                      // Author and Rating row
                      Row(
                        children: [
                          Text(
                            'by ${novel.authorName}',
                            style: TextStyle(color: Colors.grey[400]),
                          ),
                          const Spacer(),
                          // Rating widget
                          RatingWidget(
                            novelId: novel.id,
                            averageRating: _averageRating ?? novel.averageRating,
                            totalRatings: _totalRatings,
                            onRated: _refreshRating,
                          ),
                        ],
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
                              '${(_currentViewCount ?? novel.viewCount)} views',
                            ),
                            const SizedBox(width: 16),
                            _buildStatItem(
                              '${novel.likeCount} likes',
                            ),
                            const SizedBox(width: 16),
                            _buildStatItem(
                              _getReadingTime(novel.wordCount),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Story Content with comment bubbles
                      ...paragraphs.asMap().entries.map((entry) {
                        final index = entry.key;
                        final paragraph = entry.value;
                        final commentCount = _commentCounts[index] ?? 0;

                        return _buildParagraphWithComment(
                          paragraph,
                          index,
                          commentCount,
                        );
                      }),
                      // Loading indicator
                      if (_isLoading)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Center(
                            child: SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                color: Color(0xFF3b82f6),
                                strokeWidth: 2,
                              ),
                            ),
                          ),
                        )
                      else if (_error != null)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          child: Center(
                            child: TextButton(
                              onPressed: _fetchFullContent,
                              child: const Text(
                                'Tap to load full content',
                                style: TextStyle(color: Color(0xFF3b82f6)),
                              ),
                            ),
                          ),
                        )
                      else ...[
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
                        // Bottom rating
                        Center(
                          child: Column(
                            children: [
                              Text(
                                'Did you enjoy this story?',
                                style: TextStyle(
                                  color: Colors.grey[400],
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 12),
                              RatingWidget(
                                novelId: novel.id,
                                averageRating: _averageRating ?? novel.averageRating,
                                totalRatings: _totalRatings,
                                onRated: _refreshRating,
                              ),
                            ],
                          ),
                        ),
                      ],
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
                          _buildBottomAction(Icons.favorite_border, 'Like'),
                          _buildBottomAction(Icons.chat_bubble_outline, 'Comment'),
                          ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF3b82f6),
                              foregroundColor: Colors.white,
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
                          _buildBottomAction(Icons.share_outlined, 'Share'),
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

  Widget _buildParagraphWithComment(String paragraph, int index, int commentCount) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Paragraph text
          Text(
            paragraph,
            style: TextStyle(
              color: Colors.grey[200],
              fontSize: 18,
              height: 1.8,
            ),
          ),
          // Comment bubble
          Align(
            alignment: Alignment.centerRight,
            child: GestureDetector(
              onTap: () => _showCommentSheet(index, paragraph),
              child: Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: commentCount > 0
                      ? const Color(0xFF3b82f6).withOpacity(0.2)
                      : Colors.grey[850],
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: commentCount > 0
                        ? const Color(0xFF3b82f6).withOpacity(0.5)
                        : Colors.grey[700]!,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.chat_bubble_outline,
                      size: 14,
                      color: commentCount > 0
                          ? const Color(0xFF3b82f6)
                          : Colors.grey[500],
                    ),
                    if (commentCount > 0) ...[
                      const SizedBox(width: 4),
                      Text(
                        commentCount.toString(),
                        style: const TextStyle(
                          color: Color(0xFF3b82f6),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ],
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

  Widget _buildBottomAction(IconData icon, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: Colors.white, size: 24),
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

  String _getReadingTime(int wordCount) {
    final minutes = (wordCount / 450).ceil();
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return '$minutes min';
    final hours = minutes ~/ 60;
    final remainingMins = minutes % 60;
    if (remainingMins == 0) return '${hours}h';
    return '${hours}h ${remainingMins}m';
  }
}
