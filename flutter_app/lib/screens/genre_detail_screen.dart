import 'package:flutter/material.dart';

import '../models/short_novel.dart';
import '../services/api_service.dart';
import '../widgets/short_novel_list_card.dart';

class GenreDetailScreen extends StatefulWidget {
  final String genreSlug;
  final String genreName;
  final Color genreColor;

  const GenreDetailScreen({
    super.key,
    required this.genreSlug,
    required this.genreName,
    required this.genreColor,
  });

  @override
  State<GenreDetailScreen> createState() => _GenreDetailScreenState();
}

class _GenreDetailScreenState extends State<GenreDetailScreen> {
  List<ShortNovel> _shorts = [];
  bool _isLoading = true;
  String? _error;
  String _sortBy = 'hot'; // hot, new, rating
  int _page = 1;
  bool _hasMore = true;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchShorts();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoading && _hasMore) {
        _fetchShorts(loadMore: true);
      }
    }
  }

  Future<void> _fetchShorts({bool loadMore = false}) async {
    if (loadMore) {
      _page++;
    } else {
      _page = 1;
      _shorts = [];
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final shorts = await ApiService.fetchShorts(
        page: _page,
        limit: 20,
        genre: widget.genreSlug,
        sortBy: _sortBy,
      );

      setState(() {
        if (loadMore) {
          _shorts.addAll(shorts);
        } else {
          _shorts = shorts;
        }
        _hasMore = shorts.length >= 20;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _onSortChanged(String sort) {
    if (_sortBy != sort) {
      setState(() {
        _sortBy = sort;
      });
      _fetchShorts();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.genreName,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Sort options
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Text(
                  '${_shorts.length} stories',
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 14,
                  ),
                ),
                const Spacer(),
                _buildSortDropdown(),
              ],
            ),
          ),
          // Stories list
          Expanded(
            child: _buildContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildSortDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _sortBy,
          dropdownColor: Colors.grey[900],
          icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
          style: const TextStyle(color: Colors.white, fontSize: 14),
          items: const [
            DropdownMenuItem(value: 'hot', child: Text('Hot')),
            DropdownMenuItem(value: 'new', child: Text('New')),
            DropdownMenuItem(value: 'rating', child: Text('Rating')),
          ],
          onChanged: (value) {
            if (value != null) _onSortChanged(value);
          },
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading && _shorts.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF3b82f6)),
      );
    }

    if (_error != null && _shorts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Failed to load stories',
              style: TextStyle(color: Colors.grey[400]),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchShorts,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3b82f6),
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_shorts.isEmpty) {
      return Center(
        child: Text(
          'No stories in this genre yet',
          style: TextStyle(color: Colors.grey[400]),
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: _shorts.length + (_hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index >= _shorts.length) {
          return const Padding(
            padding: EdgeInsets.all(16),
            child: Center(
              child: CircularProgressIndicator(color: Color(0xFF3b82f6)),
            ),
          );
        }
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: ShortNovelListCard(novel: _shorts[index]),
        );
      },
    );
  }
}
