import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

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
  List<String> _trendingSearches = [];
  List<String> _searchHistory = [];
  bool _isLoading = false;
  bool _hasMore = false;
  int _currentPage = 1;
  int _totalResults = 0;
  String _currentQuery = '';
  String? _selectedGenre;

  final List<String> _genres = [
    'All',
    'Romance',
    'Fantasy',
    'Thriller',
    'Mystery',
    'Sci-Fi',
    'Drama',
    'Comedy',
    'Horror',
  ];

  @override
  void initState() {
    super.initState();
    _loadTrendingSearches();
    _loadSearchHistory();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadTrendingSearches() async {
    final trending = await ApiService.getTrendingSearches();
    if (mounted) {
      setState(() => _trendingSearches = trending);
    }
  }

  Future<void> _loadSearchHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final history = prefs.getStringList('search_history') ?? [];
    if (mounted) {
      setState(() => _searchHistory = history);
    }
  }

  Future<void> _saveSearchHistory(String query) async {
    if (query.trim().isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    _searchHistory.remove(query);
    _searchHistory.insert(0, query);
    if (_searchHistory.length > 10) {
      _searchHistory = _searchHistory.take(10).toList();
    }
    await prefs.setStringList('search_history', _searchHistory);
  }

  Future<void> _clearSearchHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('search_history');
    setState(() => _searchHistory = []);
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
      });
      return;
    }

    if (newSearch) {
      setState(() {
        _currentPage = 1;
        _searchResults = [];
        _isLoading = true;
        _currentQuery = query;
      });
      _saveSearchHistory(query);
    }

    try {
      final result = await ApiService.searchNovels(
        query: query,
        page: _currentPage,
        limit: 20,
        genre: _selectedGenre == 'All' ? null : _selectedGenre,
      );

      if (mounted) {
        setState(() {
          if (newSearch) {
            _searchResults = result['novels'] as List<ShortNovel>;
          } else {
            _searchResults.addAll(result['novels'] as List<ShortNovel>);
          }
          _totalResults = result['total'] as int;
          _hasMore = result['hasMore'] as bool;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
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

  void _onGenreSelected(String genre) {
    setState(() {
      _selectedGenre = genre == 'All' ? null : genre;
    });
    if (_currentQuery.isNotEmpty) {
      _search(_currentQuery);
    }
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
            // Genre filter chips
            _buildGenreChips(),
            // Content
            Expanded(
              child: _currentQuery.isEmpty
                  ? _buildEmptyState()
                  : _buildSearchResults(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
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
                  hintText: 'Search stories, authors, tags...',
                  hintStyle: TextStyle(color: Colors.grey[500]),
                  prefixIcon: Icon(Icons.search, color: Colors.grey[500]),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: Icon(Icons.clear, color: Colors.grey[500]),
                          onPressed: () {
                            _searchController.clear();
                            setState(() {
                              _searchResults = [];
                              _currentQuery = '';
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
                onChanged: (value) {
                  setState(() {}); // Update clear button visibility
                },
                onSubmitted: (value) => _search(value),
              ),
            ),
          ),
          if (_currentQuery.isNotEmpty) ...[
            const SizedBox(width: 8),
            TextButton(
              onPressed: () {
                _searchController.clear();
                _focusNode.unfocus();
                setState(() {
                  _searchResults = [];
                  _currentQuery = '';
                });
              },
              child: Text(
                'Cancel',
                style: TextStyle(color: Colors.grey[400]),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildGenreChips() {
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: _genres.length,
        itemBuilder: (context, index) {
          final genre = _genres[index];
          final isSelected = (_selectedGenre == null && genre == 'All') ||
              _selectedGenre == genre;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: FilterChip(
              label: Text(genre),
              selected: isSelected,
              onSelected: (_) => _onGenreSelected(genre),
              backgroundColor: Colors.grey[900],
              selectedColor: const Color(0xFF3b82f6).withOpacity(0.3),
              labelStyle: TextStyle(
                color: isSelected ? const Color(0xFF3b82f6) : Colors.grey[400],
                fontSize: 13,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(
                  color: isSelected
                      ? const Color(0xFF3b82f6)
                      : Colors.transparent,
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 8),
            ),
          );
        },
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
                  'Recent Searches',
                  style: TextStyle(
                    color: Colors.grey[300],
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: _clearSearchHistory,
                  child: Text(
                    'Clear',
                    style: TextStyle(color: Colors.grey[500], fontSize: 13),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _searchHistory.map((query) {
                return GestureDetector(
                  onTap: () {
                    _searchController.text = query;
                    _search(query);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.grey[850],
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.history, size: 16, color: Colors.grey[500]),
                        const SizedBox(width: 6),
                        Text(
                          query,
                          style: TextStyle(color: Colors.grey[300]),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
          ],
          // Trending searches
          Text(
            'Trending Searches',
            style: TextStyle(
              color: Colors.grey[300],
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _trendingSearches.asMap().entries.map((entry) {
              final index = entry.key;
              final query = entry.value;
              return GestureDetector(
                onTap: () {
                  _searchController.text = query;
                  _search(query);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.grey[850],
                    borderRadius: BorderRadius.circular(16),
                    border: index < 3
                        ? Border.all(
                            color: const Color(0xFFf97316).withOpacity(0.5),
                          )
                        : null,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (index < 3) ...[
                        Icon(
                          Icons.local_fire_department,
                          size: 16,
                          color: const Color(0xFFf97316),
                        ),
                        const SizedBox(width: 4),
                      ],
                      Text(
                        query,
                        style: TextStyle(
                          color: index < 3
                              ? const Color(0xFFf97316)
                              : Colors.grey[300],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
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
              'Try different keywords or filters',
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
            '$_totalResults results for "$_currentQuery"',
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
                  // Genre tag
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: _getGenreColor(novel.displayGenre).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
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
                  const SizedBox(height: 8),
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
                  const SizedBox(height: 4),
                  // Author
                  Text(
                    'by ${novel.authorName}',
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 12,
                    ),
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
                      const SizedBox(width: 12),
                      Icon(Icons.favorite_border,
                          size: 14, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        _formatCount(novel.likeCount),
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
