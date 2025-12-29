import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RatingWidget extends StatelessWidget {
  final double? averageRating;
  final int? totalRatings;
  final int novelId;
  final VoidCallback? onRated;

  const RatingWidget({
    super.key,
    this.averageRating,
    this.totalRatings,
    required this.novelId,
    this.onRated,
  });

  @override
  Widget build(BuildContext context) {
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

class _RatingSheetState extends State<RatingSheet> {
  double _selectedRating = 0;
  bool _isSubmitting = false;
  bool _hasRated = false;

  @override
  void initState() {
    super.initState();
    _checkExistingRating();
  }

  Future<void> _checkExistingRating() async {
    final existing = await ApiService.getUserRating(widget.novelId);
    if (existing != null && existing['rating'] != null && mounted) {
      setState(() {
        _selectedRating = (existing['rating']['score'] as num).toDouble();
        _hasRated = true;
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
    );

    if (mounted) {
      setState(() => _isSubmitting = false);

      if (result != null) {
        widget.onRated?.call();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Rating submitted!')),
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
          const SizedBox(height: 24),
          // Title
          Text(
            _hasRated ? 'Your Rating' : 'Rate this story',
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
                onTap: _hasRated
                    ? null
                    : () => setState(() => _selectedRating = starValue.toDouble()),
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
          // Submit button
          if (!_hasRated)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: SizedBox(
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
                      : const Text(
                          'Submit Rating',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                'You have already rated this story',
                style: TextStyle(color: Colors.grey[500], fontSize: 14),
              ),
            ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
