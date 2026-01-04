import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:ui';

import '../models/short_novel.dart';
import '../services/api_service.dart';
import '../services/reading_history_service.dart';
import '../widgets/comment_sheet.dart';
import '../widgets/rating_widget.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/user_provider.dart';
import 'login_screen.dart';

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

  // Recommendations
  List<ShortNovel> _similarNovels = [];
  bool _loadingSimilar = false;

  // Like count (local for display)
  int _likeCount = 0;

  // Reader settings
  Color? _backgroundColor;
  double _fontSize = 18;
  bool _showCommentBubbles = true;
  bool _themeInitialized = false;

  // Predefined background colors
  final List<Color> _bgColors = [
    Colors.black,
    const Color(0xFF1a1a2e),
    const Color(0xFFc7edcc), // Eye-care green (护眼绿)
    Colors.white,            // White
    const Color(0xFFf5f5dc), // Beige
    const Color(0xFFfaf3e0), // Cream
  ];

  @override
  void initState() {
    super.initState();
    _likeCount = widget.novel.likeCount;
    _fetchFullContent();
    _trackView();
    _saveToHistory();
  }

  Future<void> _saveToHistory() async {
    await ReadingHistoryService.addToHistory(widget.novel);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Initialize background color based on app theme only once
    if (!_themeInitialized) {
      final themeProvider = context.read<ThemeProvider>();
      _backgroundColor = themeProvider.isDarkMode ? Colors.black : Colors.white;
      _themeInitialized = true;
    }
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

      // Load similar novels for recommendations
      _fetchSimilarNovels(fullNovel);
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchSimilarNovels(ShortNovel novel) async {
    if (_loadingSimilar) return;
    setState(() => _loadingSimilar = true);

    try {
      final tagNames = novel.tags?.map((t) => t.name).toList();
      final similar = await ApiService.getSimilarNovels(
        currentNovelId: novel.id,
        genre: novel.displayGenre,
        tags: tagNames,
        limit: 6,
      );

      if (mounted) {
        setState(() {
          _similarNovels = similar;
          _loadingSimilar = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingSimilar = false);
      }
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

  Future<void> _handleLike() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn) {
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
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
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      if (result == true && mounted) {
        _performShare();
      }
      return;
    }
    _performShare();
  }

  void _performShare() {
    final novel = _fullNovel ?? widget.novel;
    Share.share(
      '${novel.title} by ${novel.authorName}\n\nCheck out this story on ButterNovel!',
      subject: novel.title,
    );
  }

  void _showSettingsSheet() {
    final themeProvider = context.read<ThemeProvider>();
    final isDark = themeProvider.isDarkMode;
    final sheetBgColor = isDark ? Colors.grey[900]! : Colors.white;
    final sheetTextColor = isDark ? Colors.white : Colors.grey[900]!;
    final sheetSubtitleColor = isDark ? Colors.grey[400]! : Colors.grey[600]!;
    final handleColor = isDark ? Colors.grey[700] : Colors.grey[400];

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
              color: sheetBgColor,
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
                    color: handleColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 20),
                // Title
                Text(
                  'Reader Settings',
                  style: TextStyle(
                    color: sheetTextColor,
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
                        style: TextStyle(color: sheetSubtitleColor, fontSize: 14),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: _bgColors.map((color) {
                          final isSelected = _effectiveBackgroundColor == color;
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
                            style: TextStyle(color: sheetSubtitleColor, fontSize: 14),
                          ),
                          Text(
                            '${_fontSize.toInt()}',
                            style: TextStyle(
                              color: sheetTextColor,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Text('A', style: TextStyle(color: sheetSubtitleColor, fontSize: 12)),
                          Expanded(
                            child: Slider(
                              value: _fontSize,
                              min: 14,
                              max: 28,
                              divisions: 7,
                              activeColor: const Color(0xFF3b82f6),
                              inactiveColor: isDark ? Colors.grey[700] : Colors.grey[300],
                              onChanged: (value) {
                                setState(() => _fontSize = value);
                                setSheetState(() {});
                              },
                            ),
                          ),
                          Text('A', style: TextStyle(color: sheetSubtitleColor, fontSize: 20)),
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
                        style: TextStyle(color: sheetSubtitleColor, fontSize: 14),
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

  Color get _effectiveBackgroundColor => _backgroundColor ?? Colors.black;
  bool get _isLightBackground => _effectiveBackgroundColor.computeLuminance() > 0.5;
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
      backgroundColor: _effectiveBackgroundColor,
      body: Stack(
        children: [
          // Content
          CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                pinned: true,
                toolbarHeight: 56,
                backgroundColor: _effectiveBackgroundColor.withOpacity(0.95),
                // Automatically handles safe area (notch, status bar)
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
                    onPressed: _handleShare,
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
                              '$_likeCount likes',
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
                        // You may also like section
                        const SizedBox(height: 40),
                        _buildRecommendationsSection(),
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
                  color: _effectiveBackgroundColor.withOpacity(0.85),
                  child: SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Consumer<UserProvider>(
                        builder: (context, userProvider, child) {
                          final isLiked = userProvider.isLiked(widget.novel.id);
                          return Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // Like/Bookmark button
                              _buildActionButton(
                                icon: isLiked ? Icons.favorite : Icons.favorite_border,
                                onTap: _handleLike,
                                isActive: isLiked,
                              ),
                              const SizedBox(width: 16),
                              // Share button
                              _buildActionButton(
                                icon: Icons.share_outlined,
                                onTap: _handleShare,
                              ),
                              const SizedBox(width: 16),
                              // Settings button
                              _buildActionButton(
                                icon: Icons.settings_outlined,
                                onTap: _showSettingsSheet,
                              ),
                            ],
                          );
                        },
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
    // Trim any trailing whitespace/newlines from paragraph
    final cleanParagraph = paragraph.trimRight();

    final textStyle = TextStyle(
      color: _textColor,
      fontSize: _fontSize,
      height: 1.8,
    );

    if (!_showCommentBubbles) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 20),
        child: Text(cleanParagraph, style: textStyle),
      );
    }

    // Build icon-based comment indicator
    Widget commentIcon;
    if (commentCount == 0) {
      commentIcon = Icon(
        Icons.chat_bubble_outline,
        size: 14,
        color: _subtitleColor.withOpacity(0.3),
      );
    } else if (commentCount >= 99) {
      commentIcon = Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.local_fire_department, size: 12, color: Color(0xFFef4444)),
          Text(
            '99+',
            style: TextStyle(
              color: const Color(0xFFef4444),
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      );
    } else if (commentCount >= 50) {
      commentIcon = Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.local_fire_department, size: 12, color: Color(0xFFf97316)),
          Text(
            '$commentCount',
            style: TextStyle(
              color: const Color(0xFFf97316),
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      );
    } else {
      commentIcon = Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
        decoration: BoxDecoration(
          color: const Color(0xFF3b82f6).withOpacity(0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          '$commentCount',
          style: const TextStyle(
            color: Color(0xFF3b82f6),
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Text.rich(
        TextSpan(
          style: textStyle,
          children: [
            TextSpan(text: cleanParagraph),
            WidgetSpan(
              alignment: PlaceholderAlignment.middle,
              child: GestureDetector(
                onTap: () => _showCommentSheet(index, cleanParagraph),
                child: Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: commentIcon,
                ),
              ),
            ),
          ],
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

  Widget _buildActionButton({
    required IconData icon,
    required VoidCallback onTap,
    bool isActive = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: _isLightBackground
              ? Colors.grey[200]
              : Colors.grey[800]?.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: isActive ? Colors.red : _textColor,
          size: 22,
        ),
      ),
    );
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

  Widget _buildRecommendationsSection() {
    if (_loadingSimilar) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: CircularProgressIndicator(
            color: const Color(0xFF3b82f6),
            strokeWidth: 2,
          ),
        ),
      );
    }

    if (_similarNovels.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section header
        Row(
          children: [
            Container(
              width: 4,
              height: 20,
              decoration: BoxDecoration(
                color: const Color(0xFF3b82f6),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'You may also like',
              style: TextStyle(
                color: _textColor,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        // Recommendation cards in a grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.75,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: _similarNovels.length,
          itemBuilder: (context, index) {
            return _buildRecommendationCard(_similarNovels[index]);
          },
        ),
      ],
    );
  }

  Widget _buildRecommendationCard(ShortNovel novel) {
    return GestureDetector(
      onTap: () {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ShortDetailScreen(novel: novel),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: _isLightBackground
              ? Colors.grey[100]
              : Colors.grey[900]?.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _isLightBackground
                ? Colors.grey[300]!
                : Colors.grey[800]!,
          ),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Genre tag
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getGenreColor(novel.displayGenre).withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                novel.displayGenre,
                style: TextStyle(
                  color: _getGenreColor(novel.displayGenre),
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Title
            Text(
              novel.title,
              style: TextStyle(
                color: _textColor,
                fontSize: 14,
                fontWeight: FontWeight.bold,
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            // Author
            Text(
              'by ${novel.authorName}',
              style: TextStyle(
                color: _subtitleColor,
                fontSize: 11,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            // Preview text
            Text(
              novel.previewText,
              style: TextStyle(
                color: _subtitleColor,
                fontSize: 12,
                height: 1.4,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            // Stats row
            Row(
              children: [
                if (novel.averageRating != null && novel.averageRating! > 0) ...[
                  Icon(Icons.star, size: 12, color: Colors.amber[400]),
                  const SizedBox(width: 2),
                  Text(
                    novel.averageRating!.toStringAsFixed(1),
                    style: TextStyle(
                      color: Colors.amber[400],
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Icon(Icons.visibility_outlined, size: 12, color: _subtitleColor),
                const SizedBox(width: 2),
                Text(
                  _formatCount(novel.viewCount),
                  style: TextStyle(
                    color: _subtitleColor,
                    fontSize: 11,
                  ),
                ),
              ],
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
