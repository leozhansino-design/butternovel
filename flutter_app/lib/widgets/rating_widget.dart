import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/theme_provider.dart';

class RatingWidget extends StatelessWidget {
  final double? averageRating;
  final int? totalRatings;
  final int novelId;
  final VoidCallback? onRated;
  final bool compact;

  const RatingWidget({
    super.key,
    this.averageRating,
    this.totalRatings,
    required this.novelId,
    this.onRated,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return _buildCompact(context);
    }
    return _buildFull(context);
  }

  Widget _buildCompact(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final isDark = themeProvider.isDarkMode;
    final bgColor = isDark ? Colors.grey[850]?.withOpacity(0.6) : Colors.grey[200]?.withOpacity(0.8);
    final subtitleColor = isDark ? Colors.grey[400] : Colors.grey[600];

    return GestureDetector(
      onTap: () => _showRatingDialog(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.star_rounded, color: Colors.amber[400], size: 14),
            const SizedBox(width: 3),
            Text(
              'Rate',
              style: TextStyle(
                color: subtitleColor,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFull(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final isDark = themeProvider.isDarkMode;
    final bgColor = isDark ? Colors.grey[850] : Colors.grey[200];
    final borderColor = isDark ? Colors.grey[700]! : Colors.grey[400]!;
    final subtitleColor = isDark ? Colors.grey[500] : Colors.grey[600];

    return GestureDetector(
      onTap: () => _showRatingDialog(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.star, color: Colors.amber[400], size: 20),
            const SizedBox(width: 6),
            if (averageRating != null && averageRating! > 0) ...[
              Text(
                averageRating!.toStringAsFixed(1),
                style: TextStyle(
                  color: Colors.amber[400],
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Text(
                '/10',
                style: TextStyle(color: subtitleColor, fontSize: 12),
              ),
              if (totalRatings != null && totalRatings! > 0) ...[
                const SizedBox(width: 8),
                Text(
                  '($totalRatings)',
                  style: TextStyle(color: subtitleColor, fontSize: 12),
                ),
              ],
            ] else ...[
              Text(
                'Rate',
                style: TextStyle(color: subtitleColor, fontSize: 14),
              ),
            ],
            const SizedBox(width: 4),
            Icon(Icons.chevron_right, color: subtitleColor, size: 18),
          ],
        ),
      ),
    );
  }

  void _showRatingDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => RatingSheet(
        novelId: novelId,
        currentRating: averageRating,
        onRated: onRated,
      ),
    );
  }
}

class RatingSheet extends StatefulWidget {
  final int novelId;
  final double? currentRating;
  final VoidCallback? onRated;

  const RatingSheet({
    super.key,
    required this.novelId,
    this.currentRating,
    this.onRated,
  });

  @override
  State<RatingSheet> createState() => _RatingSheetState();
}

class _RatingSheetState extends State<RatingSheet> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  double _selectedRating = 0;
  bool _isSubmitting = false;
  bool _hasExistingRating = false;
  bool _justSubmitted = false;
  String? _existingReview;
  final TextEditingController _reviewController = TextEditingController();

  // Reviews
  List<Map<String, dynamic>> _reviews = [];
  bool _isLoadingReviews = false;
  String _sortBy = 'likes';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _checkExistingRating();
    _loadReviews();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _reviewController.dispose();
    super.dispose();
  }

  Future<void> _checkExistingRating() async {
    final existing = await ApiService.getUserRating(widget.novelId);
    if (existing != null && existing['rating'] != null && mounted) {
      final rating = existing['rating'];
      setState(() {
        _selectedRating = (rating['score'] as num).toDouble();
        _existingReview = rating['review']?.toString();
        _hasExistingRating = true;
        if (_existingReview != null) {
          _reviewController.text = _existingReview!;
        }
      });
    }
  }

  Future<void> _loadReviews() async {
    setState(() => _isLoadingReviews = true);
    final reviews = await ApiService.getReviews(widget.novelId, sortBy: _sortBy);
    if (mounted) {
      setState(() {
        _reviews = reviews;
        _isLoadingReviews = false;
      });
    }
  }

  Future<void> _submitRating() async {
    if (_selectedRating < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a rating (minimum 2)')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final result = await ApiService.rateNovel(
      novelId: widget.novelId,
      score: _selectedRating,
      review: _reviewController.text.trim().isEmpty ? null : _reviewController.text.trim(),
    );

    if (mounted) {
      setState(() => _isSubmitting = false);

      if (result != null) {
        widget.onRated?.call();
        _loadReviews(); // Refresh reviews
        setState(() {
          _justSubmitted = true;
          _hasExistingRating = true;
          _existingReview = _reviewController.text.trim().isEmpty ? null : _reviewController.text.trim();
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to submit rating. Please login first.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final isDark = themeProvider.isDarkMode;
        final bgColor = isDark ? Colors.grey[900]! : Colors.white;
        final textColor = isDark ? Colors.white : Colors.grey[900]!;
        final subtitleColor = isDark ? Colors.grey[500]! : Colors.grey[600]!;
        final handleColor = isDark ? Colors.grey[700] : Colors.grey[400];

        return Container(
          height: MediaQuery.of(context).size.height * 0.75,
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).padding.bottom,
          ),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
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
              const SizedBox(height: 16),
              // Tab bar
              TabBar(
                controller: _tabController,
                indicatorColor: const Color(0xFF3b82f6),
                labelColor: textColor,
                unselectedLabelColor: subtitleColor,
                tabs: const [
                  Tab(text: 'Rate'),
                  Tab(text: 'Reviews'),
                ],
              ),
              // Tab views
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildRateTab(isDark, textColor, subtitleColor),
                    _buildReviewsTab(isDark, textColor, subtitleColor),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRateTab(bool isDark, Color textColor, Color subtitleColor) {
    final cardBgColor = isDark ? Colors.grey[850] : Colors.grey[100];
    final borderColor = isDark ? Colors.grey[700]! : Colors.grey[300]!;

    // Show success state after submission
    if (_justSubmitted) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 40),
            // Success icon
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFF22c55e).withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle,
                color: Color(0xFF22c55e),
                size: 48,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Thanks for rating!',
              style: TextStyle(
                color: textColor,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            // Show the submitted rating
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final starValue = (index + 1) * 2;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: Icon(
                    _selectedRating >= starValue ? Icons.star : Icons.star_border,
                    color: Colors.amber[400],
                    size: 36,
                  ),
                );
              }),
            ),
            const SizedBox(height: 12),
            Text(
              'Your rating: ${_selectedRating.toInt()}/10',
              style: TextStyle(
                color: Colors.amber[400],
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (_existingReview != null && _existingReview!.isNotEmpty) ...[
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cardBgColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your review:',
                      style: TextStyle(
                        color: subtitleColor,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _existingReview!,
                      style: TextStyle(
                        color: textColor,
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 32),
            // Edit button
            TextButton.icon(
              onPressed: () => setState(() => _justSubmitted = false),
              icon: Icon(Icons.edit, color: subtitleColor, size: 18),
              label: Text(
                'Edit your rating',
                style: TextStyle(color: subtitleColor),
              ),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Title
          Text(
            _hasExistingRating ? 'Update Your Rating' : 'Rate this story',
            style: TextStyle(
              color: textColor,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tap a star to rate (2-10)',
            style: TextStyle(color: subtitleColor, fontSize: 14),
          ),
          const SizedBox(height: 24),
          // Star rating (5 stars, each represents 2 points)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) {
              final starValue = (index + 1) * 2; // 2, 4, 6, 8, 10
              final isSelected = _selectedRating >= starValue;
              final isHalf = _selectedRating >= starValue - 1 &&
                  _selectedRating < starValue;

              return GestureDetector(
                onTap: () => setState(() => _selectedRating = starValue.toDouble()),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    isSelected
                        ? Icons.star
                        : isHalf
                            ? Icons.star_half
                            : Icons.star_border,
                    color: Colors.amber[400],
                    size: 48,
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 16),
          // Rating value display
          Text(
            _selectedRating > 0 ? '${_selectedRating.toInt()}/10' : 'Select a rating',
            style: TextStyle(
              color: _selectedRating > 0 ? Colors.amber[400] : subtitleColor,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          // Optional review input
          Container(
            decoration: BoxDecoration(
              color: cardBgColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: borderColor),
            ),
            child: TextField(
              controller: _reviewController,
              maxLines: 4,
              style: TextStyle(color: textColor),
              decoration: InputDecoration(
                hintText: 'Write a review (optional)',
                hintStyle: TextStyle(color: subtitleColor),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(16),
              ),
            ),
          ),
          const SizedBox(height: 24),
          // Submit button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submitRating,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3b82f6),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      _hasExistingRating ? 'Update Rating' : 'Submit Rating',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
          if (_hasExistingRating) ...[
            const SizedBox(height: 12),
            Text(
              'You can update your rating anytime',
              style: TextStyle(color: subtitleColor, fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildReviewsTab(bool isDark, Color textColor, Color subtitleColor) {
    return Column(
      children: [
        // Sort options
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Text(
                'Sort by:',
                style: TextStyle(color: subtitleColor, fontSize: 14),
              ),
              const SizedBox(width: 12),
              _buildSortChip('Most Liked', 'likes', isDark),
              const SizedBox(width: 8),
              _buildSortChip('Newest', 'newest', isDark),
            ],
          ),
        ),
        // Reviews list
        Expanded(
          child: _isLoadingReviews
              ? const Center(
                  child: CircularProgressIndicator(
                    color: Color(0xFF3b82f6),
                  ),
                )
              : _reviews.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.rate_review_outlined, color: subtitleColor, size: 48),
                          const SizedBox(height: 16),
                          Text(
                            'No reviews yet',
                            style: TextStyle(color: subtitleColor, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Be the first to write a review!',
                            style: TextStyle(color: subtitleColor, fontSize: 14),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _reviews.length,
                      itemBuilder: (context, index) {
                        return _buildReviewItem(_reviews[index], isDark, textColor, subtitleColor);
                      },
                    ),
        ),
      ],
    );
  }

  Widget _buildSortChip(String label, String value, bool isDark) {
    final isSelected = _sortBy == value;
    final unselectedBg = isDark ? Colors.grey[800] : Colors.grey[200];
    final unselectedText = isDark ? Colors.grey[400] : Colors.grey[700];

    return GestureDetector(
      onTap: () {
        if (_sortBy != value) {
          setState(() => _sortBy = value);
          _loadReviews();
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF3b82f6) : unselectedBg,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : unselectedText,
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildReviewItem(Map<String, dynamic> review, bool isDark, Color textColor, Color subtitleColor) {
    final user = review['user'] as Map<String, dynamic>?;
    final userName = user?['name'] ?? 'Anonymous';
    final score = (review['score'] as num?)?.toDouble() ?? 0;
    final reviewText = review['review'] as String?;
    final likeCount = review['likeCount'] as int? ?? 0;
    final createdAt = review['createdAt'] as String?;
    final cardBgColor = isDark ? Colors.grey[850] : Colors.grey[100];
    final avatarBgColor = isDark ? Colors.grey[700] : Colors.grey[400];
    final contentColor = isDark ? Colors.grey[300] : Colors.grey[700];

    String timeAgo = '';
    if (createdAt != null) {
      final date = DateTime.tryParse(createdAt);
      if (date != null) {
        final diff = DateTime.now().difference(date);
        if (diff.inDays > 30) {
          timeAgo = '${diff.inDays ~/ 30}mo ago';
        } else if (diff.inDays > 0) {
          timeAgo = '${diff.inDays}d ago';
        } else if (diff.inHours > 0) {
          timeAgo = '${diff.inHours}h ago';
        } else {
          timeAgo = '${diff.inMinutes}m ago';
        }
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info and rating
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: avatarBgColor,
                child: Text(
                  userName.isNotEmpty ? userName[0].toUpperCase() : '?',
                  style: TextStyle(color: isDark ? Colors.white : Colors.grey[800], fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      userName,
                      style: TextStyle(
                        color: textColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Row(
                      children: [
                        ...List.generate(5, (index) {
                          final starValue = (index + 1) * 2;
                          return Icon(
                            score >= starValue ? Icons.star : Icons.star_border,
                            color: Colors.amber[400],
                            size: 14,
                          );
                        }),
                        const SizedBox(width: 6),
                        Text(
                          '${score.toInt()}/10',
                          style: TextStyle(color: Colors.amber[400], fontSize: 12),
                        ),
                        if (timeAgo.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Text(
                            timeAgo,
                            style: TextStyle(color: subtitleColor, fontSize: 12),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (reviewText != null && reviewText.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              reviewText,
              style: TextStyle(color: contentColor, fontSize: 14, height: 1.5),
            ),
          ],
          const SizedBox(height: 12),
          // Like button
          Row(
            children: [
              GestureDetector(
                onTap: () async {
                  final reviewId = review['id']?.toString();
                  if (reviewId != null) {
                    await ApiService.likeReview(reviewId);
                    _loadReviews();
                  }
                },
                child: Row(
                  children: [
                    Icon(
                      review['userHasLiked'] == true
                          ? Icons.favorite
                          : Icons.favorite_border,
                      color: review['userHasLiked'] == true
                          ? Colors.red
                          : subtitleColor,
                      size: 18,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      likeCount > 0 ? '$likeCount' : 'Like',
                      style: TextStyle(color: subtitleColor, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
