import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/short_novel.dart';
import '../providers/theme_provider.dart';
import '../services/api_service.dart';
import 'short_detail_screen.dart';

class GenreScreen extends StatefulWidget {
  const GenreScreen({super.key});

  @override
  State<GenreScreen> createState() => _GenreScreenState();
}

class _GenreScreenState extends State<GenreScreen> {
  final ScrollController _scrollController = ScrollController();
  String _selectedGenreSlug = 'all';
  String _selectedGenreName = 'All';
  String _selectedSort = 'popular';
  List<ShortNovel> _novels = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _currentPage = 1;

  // Sort options
  static const List<Map<String, String>> sortOptions = [
    {'value': 'popular', 'label': 'Popular'},
    {'value': 'trending', 'label': 'Trending'},
    {'value': 'latest', 'label': 'Latest'},
    {'value': 'rating', 'label': 'Top Rated'},
  ];

  // Genre data matching web version
  static const List<Map<String, dynamic>> genres = [
    {'slug': 'all', 'name': 'All', 'color': 0xFF3b82f6},
    {'slug': 'sweet-romance', 'name': 'Sweet Romance', 'color': 0xFFec4899},
    {'slug': 'billionaire-romance', 'name': 'Billionaire', 'color': 0xFFeab308},
    {'slug': 'face-slapping', 'name': 'Face-Slapping', 'color': 0xFFf97316},
    {'slug': 'revenge', 'name': 'Revenge', 'color': 0xFFef4444},
    {'slug': 'rebirth', 'name': 'Rebirth', 'color': 0xFF8b5cf6},
    {'slug': 'regret', 'name': 'Regret', 'color': 0xFF6366f1},
    {'slug': 'healing-redemption', 'name': 'Healing', 'color': 0xFF22c55e},
    {'slug': 'true-fake-identity', 'name': 'Identity', 'color': 0xFF06b6d4},
    {'slug': 'substitute', 'name': 'Substitute', 'color': 0xFFa855f7},
    {'slug': 'age-gap', 'name': 'Age Gap', 'color': 0xFFec4899},
    {'slug': 'lgbtq', 'name': 'LGBTQ+', 'color': 0xFF7c3aed},
    {'slug': 'system', 'name': 'System', 'color': 0xFF14b8a6},
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _fetchNovels();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_isLoading &&
        _hasMore) {
      _fetchNovels(loadMore: true);
    }
  }

  Future<void> _fetchNovels({bool loadMore = false}) async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
      if (!loadMore) {
        _currentPage = 1;
        _novels = [];
        _hasMore = true;
      }
    });

    try {
      List<ShortNovel> novels;
      if (_selectedGenreSlug == 'all') {
        novels = await ApiService.fetchShorts(
          page: _currentPage,
          limit: 20,
          sortBy: _selectedSort,
        );
      } else {
        novels = await ApiService.fetchShorts(
          page: _currentPage,
          limit: 20,
          genre: _selectedGenreSlug,
          sortBy: _selectedSort,
        );
      }

      if (mounted) {
        setState(() {
          if (loadMore) {
            _novels.addAll(novels);
          } else {
            _novels = novels;
          }
          _hasMore = novels.length >= 20;
          _currentPage++;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _onGenreSelected(String slug, String name) {
    if (slug == _selectedGenreSlug) return;

    setState(() {
      _selectedGenreSlug = slug;
      _selectedGenreName = name;
    });

    // Scroll to top
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(0);
    }

    _fetchNovels();
  }

  void _onSortSelected(String sort) {
    if (sort == _selectedSort) return;

    setState(() {
      _selectedSort = sort;
    });

    // Scroll to top
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(0);
    }

    _fetchNovels();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final isDark = themeProvider.isDarkMode;
        final bgColor = isDark ? Colors.black : Colors.white;
        final textColor = isDark ? Colors.white : Colors.grey[900]!;
        final subtitleColor = isDark ? Colors.grey[400]! : Colors.grey[600]!;
        final cardBgColor = isDark ? Colors.grey[900]! : Colors.grey[50]!;

        return Scaffold(
          backgroundColor: bgColor,
          body: SafeArea(
            child: Column(
              children: [
                // Title bar
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: Row(
                    children: [
                      Text(
                        'Browse',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                // Horizontal genre chips
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: genres.length,
                    itemBuilder: (context, index) {
                      final genre = genres[index];
                      final isSelected = _selectedGenreSlug == genre['slug'];
                      final color = Color(genre['color'] as int);

                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: GestureDetector(
                          onTap: () => _onGenreSelected(
                            genre['slug'] as String,
                            genre['name'] as String,
                          ),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? color
                                  : (isDark ? Colors.grey[800] : Colors.grey[200]),
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Text(
                              genre['name'] as String,
                              style: TextStyle(
                                color: isSelected
                                    ? Colors.white
                                    : (isDark ? Colors.grey[300] : Colors.grey[700]),
                                fontSize: 13,
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 8),
                // Sort by row
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Text(
                        'Sort by:',
                        style: TextStyle(
                          color: subtitleColor,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(width: 8),
                      ...sortOptions.map((option) {
                        final isSelected = _selectedSort == option['value'];
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: GestureDetector(
                            onTap: () => _onSortSelected(option['value']!),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFF3b82f6)
                                    : (isDark ? Colors.grey[800] : Colors.grey[200]),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                option['label']!,
                                style: TextStyle(
                                  color: isSelected
                                      ? Colors.white
                                      : (isDark ? Colors.grey[300] : Colors.grey[700]),
                                  fontSize: 12,
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                ),
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                // Story cards list
                Expanded(
                  child: _isLoading && _novels.isEmpty
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFF3b82f6),
                          ),
                        )
                      : _novels.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.auto_stories_outlined,
                                    size: 64,
                                    color: subtitleColor,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No stories in this genre',
                                    style: TextStyle(
                                      color: subtitleColor,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _novels.length + (_hasMore ? 1 : 0),
                              itemBuilder: (context, index) {
                                if (index == _novels.length) {
                                  return const Padding(
                                    padding: EdgeInsets.all(16),
                                    child: Center(
                                      child: CircularProgressIndicator(
                                        color: Color(0xFF3b82f6),
                                        strokeWidth: 2,
                                      ),
                                    ),
                                  );
                                }
                                return _buildStoryCard(
                                  _novels[index],
                                  isDark,
                                  textColor,
                                  subtitleColor,
                                  cardBgColor,
                                );
                              },
                            ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStoryCard(
    ShortNovel novel,
    bool isDark,
    Color textColor,
    Color subtitleColor,
    Color cardBgColor,
  ) {
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
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBgColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            Text(
              novel.title,
              style: TextStyle(
                color: textColor,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
            // Author
            Text(
              novel.authorName,
              style: TextStyle(
                color: subtitleColor,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 8),
            // Preview text
            Text(
              novel.previewText,
              style: TextStyle(
                color: isDark ? Colors.grey[300] : Colors.grey[700],
                fontSize: 14,
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 10),
            // Stats row
            Row(
              children: [
                // Genre tag
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _getGenreColor(novel.displayGenre).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(4),
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
                const SizedBox(width: 12),
                // Views
                Icon(Icons.visibility_outlined, size: 14, color: subtitleColor),
                const SizedBox(width: 4),
                Text(
                  _formatCount(novel.viewCount),
                  style: TextStyle(color: subtitleColor, fontSize: 12),
                ),
                const SizedBox(width: 12),
                // Likes
                Icon(Icons.favorite_outline, size: 14, color: subtitleColor),
                const SizedBox(width: 4),
                Text(
                  _formatCount(novel.likeCount),
                  style: TextStyle(color: subtitleColor, fontSize: 12),
                ),
                if (novel.averageRating != null && novel.averageRating! > 0) ...[
                  const Spacer(),
                  Icon(Icons.star, size: 14, color: Colors.amber[400]),
                  const SizedBox(width: 2),
                  Text(
                    novel.averageRating!.toStringAsFixed(1),
                    style: TextStyle(
                      color: Colors.amber[400],
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
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
      'Sweet Romance': const Color(0xFFec4899),
      'Fantasy': const Color(0xFF8b5cf6),
      'Thriller': const Color(0xFFef4444),
      'Mystery': const Color(0xFF6366f1),
      'Sci-Fi': const Color(0xFF06b6d4),
      'Drama': const Color(0xFFf59e0b),
      'Comedy': const Color(0xFF22c55e),
      'Horror': const Color(0xFF991b1b),
      'Age Gap': const Color(0xFFec4899),
      'Billionaire Romance': const Color(0xFFeab308),
      'Billionaire': const Color(0xFFeab308),
      'Second Chance': const Color(0xFFf97316),
      'Enemies to Lovers': const Color(0xFFdc2626),
      'Fake Dating': const Color(0xFFa855f7),
      'Revenge': const Color(0xFFef4444),
      'Rebirth': const Color(0xFF8b5cf6),
      'Regret': const Color(0xFF6366f1),
      'System': const Color(0xFF14b8a6),
    };
    return colors[genre] ?? const Color(0xFF3b82f6);
  }
}
