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

  // Reader settings
  Color _backgroundColor = Colors.black;
  double _fontSize = 18;
  bool _showCommentBubbles = true;

  // Predefined background colors
  final List<Color> _bgColors = [
    Colors.black,
    const Color(0xFF1a1a2e),
    const Color(0xFF16213e),
    const Color(0xFF0f0f0f),
    const Color(0xFF2d2d2d),
    const Color(0xFFf5f5dc), // Beige
    const Color(0xFFfaf3e0), // Cream
  ];

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

  void _showSettingsSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) {
          return Container(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).padding.bottom,
            ),
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle bar
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[700],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 20),
                // Title
                const Text(
                  'Reader Settings',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 24),
                // Background Color
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Background Color',
                        style: TextStyle(color: Colors.grey[400], fontSize: 14),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: _bgColors.map((color) {
                          final isSelected = _backgroundColor == color;
                          final isLight = color.computeLuminance() > 0.5;
                          return GestureDetector(
                            onTap: () {
                              setState(() => _backgroundColor = color);
                              setSheetState(() {});
                            },
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: color,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isSelected
                                      ? const Color(0xFF3b82f6)
                                      : isLight
                                          ? Colors.grey[400]!
                                          : Colors.grey[700]!,
                                  width: isSelected ? 3 : 1,
                                ),
                              ),
                              child: isSelected
                                  ? Icon(
                                      Icons.check,
                                      color: isLight ? Colors.black : Colors.white,
                                      size: 20,
                                    )
                                  : null,
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                // Font Size
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Font Size',
                            style: TextStyle(color: Colors.grey[400], fontSize: 14),
                          ),
                          Text(
                            '${_fontSize.toInt()}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Text('A', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          Expanded(
                            child: Slider(
                              value: _fontSize,
                              min: 14,
                              max: 28,
                              divisions: 7,
                              activeColor: const Color(0xFF3b82f6),
                              inactiveColor: Colors.grey[700],
                              onChanged: (value) {
                                setState(() => _fontSize = value);
                                setSheetState(() {});
                              },
                            ),
                          ),
                          const Text('A', style: TextStyle(color: Colors.grey, fontSize: 20)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Show Comments Toggle
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Show Comment Bubbles',
                        style: TextStyle(color: Colors.grey[400], fontSize: 14),
                      ),
                      Switch(
                        value: _showCommentBubbles,
                        activeColor: const Color(0xFF3b82f6),
                        onChanged: (value) {
                          setState(() => _showCommentBubbles = value);
                          setSheetState(() {});
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  bool get _isLightBackground => _backgroundColor.computeLuminance() > 0.5;
  Color get _textColor => _isLightBackground ? Colors.grey[900]! : Colors.grey[200]!;
  Color get _subtitleColor => _isLightBackground ? Colors.grey[600]! : Colors.grey[400]!;

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
      backgroundColor: _backgroundColor,
      body: Stack(
        children: [
          // Content
          CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                pinned: true,
                backgroundColor: _backgroundColor.withOpacity(0.95),
                leading: IconButton(
                  icon: Icon(Icons.arrow_back, color: _isLightBackground ? Colors.grey[800] : const Color(0xFF3b82f6)),
                  onPressed: () => Navigator.pop(context),
                ),
                title: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'ButterPicks',
                      style: TextStyle(
                        color: _textColor,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (_averageRating != null && _averageRating! > 0) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.amber[400],
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star, color: Colors.black, size: 12),
                            const SizedBox(width: 2),
                            Text(
                              _averageRating!.toStringAsFixed(1),
                              style: const TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                actions: [
                  // Compact rate button
                  RatingWidget(
                    novelId: novel.id,
                    averageRating: _averageRating ?? novel.averageRating,
                    totalRatings: _totalRatings,
                    onRated: _refreshRating,
                    compact: true,
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () {},
                    child: Text(
                      'Share',
                      style: TextStyle(color: _isLightBackground ? Colors.grey[700] : const Color(0xFF3b82f6)),
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
                        style: TextStyle(
                          color: _textColor,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Author
                      Text(
                        'by ${novel.authorName}',
                        style: TextStyle(color: _subtitleColor),
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
                            top: BorderSide(color: _isLightBackground ? Colors.grey[300]! : Colors.grey[800]!),
                            bottom: BorderSide(color: _isLightBackground ? Colors.grey[300]! : Colors.grey[800]!),
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
                      // Story Content with inline comment bubbles
                      ...paragraphs.asMap().entries.map((entry) {
                        final index = entry.key;
                        final paragraph = entry.value;
                        final commentCount = _commentCounts[index] ?? 0;

                        return _buildParagraphWithInlineComment(
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
                                color: _subtitleColor,
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
                                  color: _subtitleColor,
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
                  color: _backgroundColor.withOpacity(0.85),
                  child: SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          // Add to Bookshelf button
                          ElevatedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.bookmark_add_outlined, size: 18),
                            label: const Text(
                              'Bookshelf',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF3b82f6),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 10,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                            ),
                          ),
                          _buildBottomAction(Icons.chat_bubble_outline, 'Comment'),
                          _buildBottomAction(Icons.share_outlined, 'Share'),
                          // Settings button
                          GestureDetector(
                            onTap: _showSettingsSheet,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.settings_outlined, color: _textColor, size: 24),
                                const SizedBox(height: 4),
                                Text(
                                  'Settings',
                                  style: TextStyle(
                                    color: _subtitleColor,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
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

  Widget _buildParagraphWithInlineComment(String paragraph, int index, int commentCount) {
    if (!_showCommentBubbles) {
      // Just show paragraph without comment bubble
      return Padding(
        padding: const EdgeInsets.only(bottom: 20),
        child: Text(
          paragraph,
          style: TextStyle(
            color: _textColor,
            fontSize: _fontSize,
            height: 1.8,
          ),
        ),
      );
    }

    // Build inline comment bubble at end of paragraph
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: GestureDetector(
        onTap: () => _showCommentSheet(index, paragraph),
        child: RichText(
          text: TextSpan(
            style: TextStyle(
              color: _textColor,
              fontSize: _fontSize,
              height: 1.8,
            ),
            children: [
              TextSpan(text: paragraph),
              const TextSpan(text: ' '),
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: commentCount > 0
                        ? const Color(0xFF3b82f6).withOpacity(0.15)
                        : (_isLightBackground ? Colors.grey[200] : Colors.grey[850]),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: commentCount > 0
                          ? const Color(0xFF3b82f6).withOpacity(0.4)
                          : (_isLightBackground ? Colors.grey[400]! : Colors.grey[700]!),
                      width: 0.5,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.chat_bubble_outline,
                        size: 12,
                        color: commentCount > 0
                            ? const Color(0xFF3b82f6)
                            : _subtitleColor,
                      ),
                      if (commentCount > 0) ...[
                        const SizedBox(width: 3),
                        Text(
                          commentCount.toString(),
                          style: const TextStyle(
                            color: Color(0xFF3b82f6),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTag(String text, {bool isPrimary = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isPrimary
            ? const Color(0xFF3b82f6).withOpacity(0.2)
            : (_isLightBackground ? Colors.grey[200] : Colors.grey[800]),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: isPrimary ? const Color(0xFF60a5fa) : _subtitleColor,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildStatItem(String text) {
    return Text(
      text,
      style: TextStyle(
        color: _subtitleColor,
        fontSize: 14,
      ),
    );
  }

  Widget _buildBottomAction(IconData icon, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: _textColor, size: 24),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: _subtitleColor,
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
