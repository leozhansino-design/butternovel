import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'dart:math';

import '../models/short_novel.dart';
import '../services/api_service.dart';
import 'short_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();

  List<ShortNovel> _searchResults = [];
  List<ShortNovel> _suggestions = [];
  List<ShortNovel> _recommendedNovels = [];
  List<String> _searchHistory = [];
  bool _isLoading = false;
  bool _hasMore = false;
  int _currentPage = 1;
  int _totalResults = 0;
  String _currentQuery = '';
  bool _showSuggestions = false;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _loadSearchHistory();
    _loadRecommendedNovels();
    _scrollController.addListener(_onScroll);
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    _scrollController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text.trim();

    // Debounce search suggestions
    _debounceTimer?.cancel();

    if (query.isEmpty) {
      setState(() {
        _suggestions = [];
        _showSuggestions = false;
      });
      return;
    }

    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      _fetchSuggestions(query);
    });
  }

  Future<void> _fetchSuggestions(String query) async {
    if (query.length < 2) {
      setState(() => _showSuggestions = false);
      return;
    }

    try {
      final result = await ApiService.searchNovels(
        query: query,
        limit: 5,
      );

      if (mounted && _searchController.text.trim() == query) {
        final novels = result['novels'];
        if (novels != null && novels is List<ShortNovel>) {
          setState(() {
            _suggestions = novels;
            _showSuggestions = novels.isNotEmpty;
          });
        } else {
          setState(() {
            _suggestions = [];
            _showSuggestions = false;
          });
        }
      }
    } catch (e) {
      // Ignore errors for suggestions
      setState(() {
        _suggestions = [];
        _showSuggestions = false;
      });
    }
  }

  Future<void> _loadSearchHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final history = prefs.getStringList('search_history') ?? [];
    if (mounted) {
      setState(() => _searchHistory = history.take(8).toList());
    }
  }

  Future<void> _saveSearchHistory(String query) async {
    if (query.trim().isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    _searchHistory.remove(query);
    _searchHistory.insert(0, query);
    if (_searchHistory.length > 8) {
      _searchHistory = _searchHistory.take(8).toList();
    }
    await prefs.setStringList('search_history', _searchHistory);
    setState(() {});
  }

  Future<void> _clearSearchHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('search_history');
    setState(() => _searchHistory = []);
  }

  Future<void> _loadRecommendedNovels() async {
    try {
      final random = Random();
      final sortOptions = ['popular', 'trending', 'latest'];
      final randomSort = sortOptions[random.nextInt(sortOptions.length)];

      final novels = await ApiService.fetchShorts(
        limit: 20, // Fetch more to allow shuffling
        sortBy: randomSort,
        page: random.nextInt(2) + 1, // Random page 1-2
      );

      if (mounted && novels.isNotEmpty) {
        // Shuffle and take 10
        final shuffled = List<ShortNovel>.from(novels)..shuffle(random);
        setState(() => _recommendedNovels = shuffled.take(10).toList());
      }
    } catch (e) {
      // Ignore errors
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_isLoading &&
        _hasMore) {
      _loadMoreResults();
    }
  }

  Future<void> _search(String query, {bool newSearch = true}) async {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _currentQuery = '';
        _totalResults = 0;
        _showSuggestions = false;
      });
      return;
    }

    if (newSearch) {
      setState(() {
        _currentPage = 1;
        _searchResults = [];
        _isLoading = true;
        _currentQuery = query;
        _showSuggestions = false;
      });
      _saveSearchHistory(query);
      _focusNode.unfocus();
    }

    try {
      final result = await ApiService.searchNovels(
        query: query,
        page: _currentPage,
        limit: 20,
      );

      if (mounted) {
        final novels = result['novels'];
        final novelsList = (novels != null && novels is List<ShortNovel>)
            ? novels
            : <ShortNovel>[];

        setState(() {
          if (newSearch) {
            _searchResults = novelsList;
          } else {
            _searchResults.addAll(novelsList);
          }
          _totalResults = (result['total'] as int?) ?? novelsList.length;
          _hasMore = (result['hasMore'] as bool?) ?? false;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          if (newSearch) {
            _searchResults = [];
          }
        });
      }
    }
  }

  Future<void> _loadMoreResults() async {
    if (_isLoading || !_hasMore) return;
    setState(() {
      _currentPage++;
      _isLoading = true;
    });
    await _search(_currentQuery, newSearch: false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Search bar
            _buildSearchBar(),
            // Content
            Expanded(
              child: Stack(
                children: [
                  // Main content
                  _currentQuery.isEmpty
                      ? _buildEmptyState()
                      : _buildSearchResults(),
                  // Suggestions overlay
                  if (_showSuggestions) _buildSuggestionsOverlay(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 12),
      child: Row(
        children: [
          // Back button
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: Icon(Icons.arrow_back, color: Colors.grey[400]),
          ),
          Expanded(
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(22),
              ),
              child: TextField(
                controller: _searchController,
                focusNode: _focusNode,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Search by title...',
                  hintStyle: TextStyle(color: Colors.grey[500]),
                  prefixIcon: Icon(Icons.search, color: Colors.grey[500]),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: Icon(Icons.clear, color: Colors.grey[500], size: 20),
                          onPressed: () {
                            _searchController.clear();
                            setState(() {
                              _searchResults = [];
                              _currentQuery = '';
                              _showSuggestions = false;
                            });
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
                textInputAction: TextInputAction.search,
                onSubmitted: (value) => _search(value),
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () {
              if (_searchController.text.isNotEmpty) {
                _search(_searchController.text);
              }
            },
            child: Text(
              'Search',
              style: TextStyle(
                color: const Color(0xFF3b82f6),
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestionsOverlay() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: _suggestions.map((novel) {
            return ListTile(
              dense: true,
              leading: Icon(Icons.search, color: Colors.grey[600], size: 20),
              title: Text(
                novel.title,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              subtitle: Text(
                novel.authorName,
                style: TextStyle(color: Colors.grey[500], fontSize: 12),
              ),
              trailing: Icon(Icons.north_west, color: Colors.grey[600], size: 16),
              onTap: () {
                _searchController.text = novel.title;
                _search(novel.title);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search history
          if (_searchHistory.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Search History',
                  style: TextStyle(
                    color: Colors.grey[300],
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                GestureDetector(
                  onTap: _clearSearchHistory,
                  child: Row(
                    children: [
                      Icon(Icons.delete_outline, color: Colors.grey[500], size: 18),
                      const SizedBox(width: 4),
                      Text(
                        'Clear',
                        style: TextStyle(color: Colors.grey[500], fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // History items in 2 columns
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 4,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemCount: _searchHistory.length,
              itemBuilder: (context, index) {
                final query = _searchHistory[index];
                return GestureDetector(
                  onTap: () {
                    _searchController.text = query;
                    _search(query);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.grey[850],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.history, size: 16, color: Colors.grey[500]),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            query,
                            style: TextStyle(color: Colors.grey[300], fontSize: 13),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),
          ],

          // Recommended section
          if (_recommendedNovels.isNotEmpty) ...[
            Row(
              children: [
                Container(
                  width: 4,
                  height: 18,
                  decoration: BoxDecoration(
                    color: const Color(0xFF3b82f6),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Recommended For You',
                  style: TextStyle(
                    color: Colors.grey[300],
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Recommended novels list
            ...List.generate(_recommendedNovels.length, (index) {
              final novel = _recommendedNovels[index];
              return _buildRecommendedItem(novel, index + 1);
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildRecommendedItem(ShortNovel novel, int rank) {
    final isTop3 = rank <= 3;
    final rankColors = [
      const Color(0xFFef4444), // 1st - red
      const Color(0xFFf97316), // 2nd - orange
      const Color(0xFFeab308), // 3rd - yellow
    ];

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
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            // Rank number
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: isTop3
                    ? rankColors[rank - 1].withOpacity(0.2)
                    : Colors.grey[800],
                borderRadius: BorderRadius.circular(6),
              ),
              child: Center(
                child: Text(
                  '$rank',
                  style: TextStyle(
                    color: isTop3 ? rankColors[rank - 1] : Colors.grey[500],
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    novel.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        novel.authorName,
                        style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: _getGenreColor(novel.displayGenre).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          novel.displayGenre,
                          style: TextStyle(
                            color: _getGenreColor(novel.displayGenre),
                            fontSize: 10,
                          ),
                        ),
                      ),
                      if (novel.averageRating != null && novel.averageRating! > 0) ...[
                        const SizedBox(width: 8),
                        Icon(Icons.star, size: 12, color: Colors.amber[400]),
                        const SizedBox(width: 2),
                        Text(
                          novel.averageRating!.toStringAsFixed(1),
                          style: TextStyle(
                            color: Colors.amber[400],
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey[700], size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    if (_isLoading && _searchResults.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(0xFF3b82f6),
        ),
      );
    }

    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey[700]),
            const SizedBox(height: 16),
            Text(
              'No results found',
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try a different search term',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Results count
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: Text(
            '$_totalResults results',
            style: TextStyle(
              color: Colors.grey[500],
              fontSize: 13,
            ),
          ),
        ),
        // Results list
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _searchResults.length + (_hasMore ? 1 : 0),
            itemBuilder: (context, index) {
              if (index == _searchResults.length) {
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
              return _buildResultCard(_searchResults[index]);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildResultCard(ShortNovel novel) {
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
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left side content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    novel.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  // Author and genre
                  Row(
                    children: [
                      Text(
                        novel.authorName,
                        style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: _getGenreColor(novel.displayGenre).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          novel.displayGenre,
                          style: TextStyle(
                            color: _getGenreColor(novel.displayGenre),
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Preview
                  Text(
                    novel.previewText,
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 13,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  // Stats
                  Row(
                    children: [
                      if (novel.averageRating != null &&
                          novel.averageRating! > 0) ...[
                        Icon(Icons.star, size: 14, color: Colors.amber[400]),
                        const SizedBox(width: 2),
                        Text(
                          novel.averageRating!.toStringAsFixed(1),
                          style: TextStyle(
                            color: Colors.amber[400],
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      Icon(Icons.visibility_outlined,
                          size: 14, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        _formatCount(novel.viewCount),
                        style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Right arrow
            const SizedBox(width: 8),
            Icon(Icons.chevron_right, color: Colors.grey[700]),
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
