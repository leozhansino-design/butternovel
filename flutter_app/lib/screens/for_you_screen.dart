import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/shorts_provider.dart';
import '../widgets/short_novel_card.dart';

class ForYouScreen extends StatefulWidget {
  const ForYouScreen({super.key});

  @override
  State<ForYouScreen> createState() => _ForYouScreenState();
}

class _ForYouScreenState extends State<ForYouScreen> {
  late PageController _pageController;
  int _currentPage = 0;

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

  @override
  Widget build(BuildContext context) {
    return Consumer<ShortsProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.shorts.isEmpty) {
          return const Center(
            child: CircularProgressIndicator(
              color: Color(0xFF3b82f6),
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
                  style: TextStyle(color: Colors.grey[400], fontSize: 16),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => provider.fetchShorts(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3b82f6),
                  ),
                  child: const Text('Try Again'),
                ),
              ],
            ),
          );
        }

        if (provider.shorts.isEmpty) {
          return const Center(
            child: Text(
              'No stories yet',
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
          );
        }

        return Stack(
          children: [
            // TikTok-style vertical scroll
            PageView.builder(
              controller: _pageController,
              scrollDirection: Axis.vertical,
              itemCount: provider.shorts.length,
              onPageChanged: (index) {
                setState(() => _currentPage = index);
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
            ),
            // Header
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.7),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'For You',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
