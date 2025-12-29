import 'package:flutter/material.dart';
import '../services/api_service.dart';

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
    return GestureDetector(
      onTap: () => _showRatingDialog(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.grey[850]?.withOpacity(0.6),
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
                color: Colors.grey[400],
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFull(BuildContext context) {
    return GestureDetector(
      onTap: () => _showRatingDialog(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.grey[850],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[700]!),
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
                style: TextStyle(color: Colors.grey[500], fontSize: 12),
              ),
              if (totalRatings != null && totalRatings! > 0) ...[
                const SizedBox(width: 8),
                Text(
                  '($totalRatings)',
                  style: TextStyle(color: Colors.grey[500], fontSize: 12),
                ),
              ],
            ] else ...[
              Text(
                'Rate',
                style: TextStyle(color: Colors.grey[400], fontSize: 14),
              ),
            ],
            const SizedBox(width: 4),
            Icon(Icons.chevron_right, color: Colors.grey[500], size: 18),
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
          _hasExistingRating = true;
          _existingReview = _reviewController.text.trim().isEmpty ? null : _reviewController.text.trim();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_hasExistingRating ? 'Rating updated!' : 'Rating submitted!')),
        );
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
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: Colors.grey[900],
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
              color: Colors.grey[700],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          // Tab bar
          TabBar(
            controller: _tabController,
            indicatorColor: const Color(0xFF3b82f6),
            labelColor: Colors.white,
            unselectedLabelColor: Colors.grey[500],
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
                _buildRateTab(),
                _buildReviewsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRateTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Title
          Text(
            _hasExistingRating ? 'Update Your Rating' : 'Rate this story',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tap a star to rate (2-10)',
            style: TextStyle(color: Colors.grey[500], fontSize: 14),
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
              color: _selectedRating > 0 ? Colors.amber[400] : Colors.grey[500],
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          // Optional review input
          Container(
            decoration: BoxDecoration(
              color: Colors.grey[850],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[700]!),
            ),
            child: TextField(
              controller: _reviewController,
              maxLines: 4,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Write a review (optional)',
                hintStyle: TextStyle(color: Colors.grey[600]),
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
              style: TextStyle(color: Colors.grey[500], fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildReviewsTab() {
    return Column(
      children: [
        // Sort options
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Text(
                'Sort by:',
                style: TextStyle(color: Colors.grey[500], fontSize: 14),
              ),
              const SizedBox(width: 12),
              _buildSortChip('Most Liked', 'likes'),
              const SizedBox(width: 8),
              _buildSortChip('Newest', 'newest'),
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
                          Icon(Icons.rate_review_outlined, color: Colors.grey[600], size: 48),
                          const SizedBox(height: 16),
                          Text(
                            'No reviews yet',
                            style: TextStyle(color: Colors.grey[500], fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Be the first to write a review!',
                            style: TextStyle(color: Colors.grey[600], fontSize: 14),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _reviews.length,
                      itemBuilder: (context, index) {
                        return _buildReviewItem(_reviews[index]);
                      },
                    ),
        ),
      ],
    );
  }

  Widget _buildSortChip(String label, String value) {
    final isSelected = _sortBy == value;
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
          color: isSelected ? const Color(0xFF3b82f6) : Colors.grey[800],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey[400],
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildReviewItem(Map<String, dynamic> review) {
    final user = review['user'] as Map<String, dynamic>?;
    final userName = user?['name'] ?? 'Anonymous';
    final score = (review['score'] as num?)?.toDouble() ?? 0;
    final reviewText = review['review'] as String?;
    final likeCount = review['likeCount'] as int? ?? 0;
    final createdAt = review['createdAt'] as String?;

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
        color: Colors.grey[850],
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
                backgroundColor: Colors.grey[700],
                child: Text(
                  userName.isNotEmpty ? userName[0].toUpperCase() : '?',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      userName,
                      style: const TextStyle(
                        color: Colors.white,
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
                            style: TextStyle(color: Colors.grey[600], fontSize: 12),
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
              style: TextStyle(color: Colors.grey[300], fontSize: 14, height: 1.5),
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
                          : Colors.grey[500],
                      size: 18,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      likeCount > 0 ? '$likeCount' : 'Like',
                      style: TextStyle(color: Colors.grey[500], fontSize: 13),
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
