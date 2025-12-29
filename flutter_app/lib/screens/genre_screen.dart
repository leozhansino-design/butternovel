import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/short_novel.dart';
import '../providers/theme_provider.dart';
import '../providers/shorts_provider.dart';
import '../widgets/short_novel_card.dart';

class GenreScreen extends StatefulWidget {
  const GenreScreen({super.key});

  @override
  State<GenreScreen> createState() => _GenreScreenState();
}

class _GenreScreenState extends State<GenreScreen> {
  late PageController _pageController;
  int _currentPage = 0;
  String _selectedGenre = 'All';

  // Genre data matching web version
  static const List<Map<String, dynamic>> genres = [
    {'slug': 'all', 'name': 'All', 'color': 0xFF3b82f6},
    {'slug': 'sweet-romance', 'name': 'Sweet Romance', 'color': 0xFFec4899},
    {'slug': 'billionaire-romance', 'name': 'Billionaire Romance', 'color': 0xFFeab308},
    {'slug': 'face-slapping', 'name': 'Face-Slapping', 'color': 0xFFf97316},
    {'slug': 'revenge', 'name': 'Revenge', 'color': 0xFFef4444},
    {'slug': 'rebirth', 'name': 'Rebirth', 'color': 0xFF8b5cf6},
    {'slug': 'regret', 'name': 'Regret', 'color': 0xFF6366f1},
    {'slug': 'healing-redemption', 'name': 'Healing/Redemption', 'color': 0xFF22c55e},
    {'slug': 'true-fake-identity', 'name': 'True/Fake Identity', 'color': 0xFF06b6d4},
    {'slug': 'substitute', 'name': 'Substitute', 'color': 0xFFa855f7},
    {'slug': 'age-gap', 'name': 'Age Gap', 'color': 0xFFec4899},
    {'slug': 'entertainment-circle', 'name': 'Entertainment Circle', 'color': 0xFFf59e0b},
    {'slug': 'group-pet', 'name': 'Group Pet', 'color': 0xFFfb7185},
    {'slug': 'lgbtq', 'name': 'LGBTQ+', 'color': 0xFF7c3aed},
    {'slug': 'quick-transmigration', 'name': 'Quick Transmigration', 'color': 0xFF0ea5e9},
    {'slug': 'survival-apocalypse', 'name': 'Survival/Apocalypse', 'color': 0xFF991b1b},
    {'slug': 'system', 'name': 'System', 'color': 0xFF14b8a6},
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    // Initial fetch
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ShortsProvider>().fetchShorts();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onGenreSelected(String genreName) {
    if (genreName == _selectedGenre) return;

    setState(() {
      _selectedGenre = genreName;
      _currentPage = 0;
    });

    // Reset page controller
    if (_pageController.hasClients) {
      _pageController.jumpToPage(0);
    }

    // Fetch by genre
    if (genreName == 'All') {
      context.read<ShortsProvider>().refresh();
    } else {
      context.read<ShortsProvider>().fetchShortsByGenre(genreName);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final isDark = themeProvider.isDarkMode;
        final bgColor = isDark ? Colors.black : Colors.white;
        final textColor = isDark ? Colors.white : Colors.grey[900]!;

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
                        'Browse by Genre',
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
                  height: 44,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: genres.length,
                    itemBuilder: (context, index) {
                      final genre = genres[index];
                      final isSelected = _selectedGenre == genre['name'];
                      final color = Color(genre['color'] as int);

                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: GestureDetector(
                          onTap: () => _onGenreSelected(genre['name'] as String),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? color
                                  : (isDark ? Colors.grey[800] : Colors.grey[200]),
                              borderRadius: BorderRadius.circular(20),
                              border: isSelected
                                  ? null
                                  : Border.all(
                                      color: isDark
                                          ? Colors.grey[700]!
                                          : Colors.grey[300]!,
                                    ),
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
                // Short novel cards (TikTok-style vertical scroll)
                Expanded(
                  child: Consumer<ShortsProvider>(
                    builder: (context, provider, child) {
                      if (provider.isLoading && provider.shorts.isEmpty) {
                        return Center(
                          child: CircularProgressIndicator(
                            color: const Color(0xFF3b82f6),
                          ),
                        );
                      }

                      if (provider.error != null && provider.shorts.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Failed to load stories',
                                style: TextStyle(
                                  color: isDark ? Colors.grey[400] : Colors.grey[600],
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: () => _onGenreSelected(_selectedGenre),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF3b82f6),
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        );
                      }

                      if (provider.shorts.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.auto_stories_outlined,
                                size: 64,
                                color: isDark ? Colors.grey[700] : Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No stories in this genre yet',
                                style: TextStyle(
                                  color: isDark ? Colors.grey[500] : Colors.grey[600],
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                        );
                      }

                      // TikTok-style vertical scroll
                      return PageView.builder(
                        controller: _pageController,
                        scrollDirection: Axis.vertical,
                        itemCount: provider.shorts.length,
                        onPageChanged: (index) {
                          setState(() => _currentPage = index);
                          // Mark as viewed for recommendation algorithm
                          if (index < provider.shorts.length) {
                            provider.markAsViewed(provider.shorts[index].id);
                          }
                          // Load more when near end
                          if (index >= provider.shorts.length - 3) {
                            if (_selectedGenre == 'All') {
                              provider.fetchShorts(loadMore: true);
                            }
                          }
                        },
                        itemBuilder: (context, index) {
                          return ShortNovelCard(
                            novel: provider.shorts[index],
                            isActive: index == _currentPage,
                          );
                        },
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
}
