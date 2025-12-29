import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/shorts_provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/short_novel_card.dart';

class ForYouScreen extends StatefulWidget {
  const ForYouScreen({super.key});

  @override
  State<ForYouScreen> createState() => _ForYouScreenState();
}

class _ForYouScreenState extends State<ForYouScreen> {
  late PageController _pageController;
  int _currentPage = 0;
  String _selectedGenre = 'All';

  final List<String> _genres = [
    'All',
    'Sweet Romance',
    'Billionaire Romance',
    'Face-Slapping',
    'Revenge',
    'Rebirth',
    'Regret',
    'Healing/Redemption',
    'True/Fake Identity',
    'Substitute',
    'Fantasy',
    'Thriller',
    'Mystery',
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    // Fetch shorts when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ShortsProvider>().fetchShorts();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onGenreSelected(String genre) {
    setState(() {
      _selectedGenre = genre;
      _currentPage = 0;
    });
    _pageController.jumpToPage(0);

    // Fetch shorts with genre filter
    final provider = context.read<ShortsProvider>();
    if (genre == 'All') {
      provider.fetchShorts();
    } else {
      provider.fetchShortsByGenre(genre);
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final isDark = themeProvider.isDarkMode;

    return Column(
      children: [
        // Genre chips at top
        SafeArea(
          bottom: false,
          child: Container(
            padding: const EdgeInsets.fromLTRB(0, 8, 0, 8),
            child: SizedBox(
              height: 36,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: _genres.length,
                itemBuilder: (context, index) {
                  final genre = _genres[index];
                  final isSelected = _selectedGenre == genre;
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: GestureDetector(
                      onTap: () => _onGenreSelected(genre),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFF3b82f6)
                              : (isDark ? Colors.grey[850] : Colors.grey[200]),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Center(
                          child: Text(
                            genre,
                            style: TextStyle(
                              color: isSelected
                                  ? Colors.white
                                  : (isDark ? Colors.grey[300] : Colors.grey[700]),
                              fontSize: 13,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
        // Content
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
                        onPressed: () => provider.fetchShorts(),
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
                  child: Text(
                    'No stories yet',
                    style: TextStyle(
                      color: isDark ? Colors.grey : Colors.grey[600],
                      fontSize: 16,
                    ),
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
                    provider.fetchShorts(loadMore: true);
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
    );
  }
}
