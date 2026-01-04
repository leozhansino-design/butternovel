import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/short_novel.dart';
import 'short_detail_screen.dart';
import 'publish_story_screen.dart';

class MyStoriesScreen extends StatefulWidget {
  const MyStoriesScreen({super.key});

  @override
  State<MyStoriesScreen> createState() => _MyStoriesScreenState();
}

class _MyStoriesScreenState extends State<MyStoriesScreen> {
  List<ShortNovel> _stories = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStories();
  }

  Future<void> _loadStories() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn) {
      setState(() => _isLoading = false);
      return;
    }

    final stories = await ApiService.getUserStories(
      authProvider.user!.id,
      token: authProvider.token,
    );

    if (mounted) {
      setState(() {
        _stories = stories;
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteStory(ShortNovel story) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        final isDark = context.watch<ThemeProvider>().isDarkMode;
        return AlertDialog(
          backgroundColor: isDark ? Colors.grey[900] : Colors.white,
          title: Text(
            'Delete Story',
            style: TextStyle(color: isDark ? Colors.white : Colors.black),
          ),
          content: Text(
            'Are you sure you want to delete "${story.title}"? This action cannot be undone.',
            style: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[600]),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete', style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );

    if (confirm == true) {
      final token = context.read<AuthProvider>().token;
      if (token != null) {
        final success = await ApiService.deleteStory(story.id, token: token);
        if (success) {
          _loadStories();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Story deleted')),
            );
          }
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final isDark = themeProvider.isDarkMode;
        final bgColor = isDark ? Colors.black : Colors.white;
        final textColor = isDark ? Colors.white : Colors.grey[900]!;
        final subtitleColor = isDark ? Colors.grey[500]! : Colors.grey[600]!;
        final cardBgColor = isDark ? Colors.grey[900]! : Colors.grey[100]!;

        return Scaffold(
          backgroundColor: bgColor,
          appBar: AppBar(
            backgroundColor: bgColor,
            elevation: 0,
            leading: IconButton(
              icon: Icon(Icons.arrow_back, color: textColor),
              onPressed: () => Navigator.pop(context),
            ),
            title: Text(
              'My Stories',
              style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
            ),
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () async {
              final result = await Navigator.push<bool>(
                context,
                MaterialPageRoute(builder: (_) => const PublishStoryScreen()),
              );
              if (result == true) {
                _loadStories();
              }
            },
            backgroundColor: const Color(0xFF3b82f6),
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text('Publish', style: TextStyle(color: Colors.white)),
          ),
          body: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : !context.read<AuthProvider>().isLoggedIn
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.login, size: 64, color: subtitleColor),
                          const SizedBox(height: 16),
                          Text(
                            'Please sign in',
                            style: TextStyle(color: textColor, fontSize: 18),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Sign in to view and manage your stories',
                            style: TextStyle(color: subtitleColor),
                          ),
                        ],
                      ),
                    )
                  : _stories.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.edit_note, size: 64, color: subtitleColor),
                              const SizedBox(height: 16),
                              Text(
                                'No stories yet',
                                style: TextStyle(color: textColor, fontSize: 18),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Tap the button below to publish your first story',
                                style: TextStyle(color: subtitleColor),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadStories,
                          child: ListView.builder(
                            padding: const EdgeInsets.only(left: 16, right: 16, bottom: 80),
                            itemCount: _stories.length,
                            itemBuilder: (context, index) {
                              final story = _stories[index];

                              return _buildStoryCard(
                                context,
                                story,
                                isDark,
                                textColor,
                                subtitleColor,
                                cardBgColor,
                              );
                            },
                          ),
                        ),
        );
      },
    );
  }

  Widget _buildStoryCard(
    BuildContext context,
    ShortNovel story,
    bool isDark,
    Color textColor,
    Color subtitleColor,
    Color cardBgColor,
  ) {
    final previewColor = isDark ? Colors.grey[400] : Colors.grey[600];

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ShortDetailScreen(novel: story),
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
        child: Row(
          children: [
            // Story info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    story.title,
                    style: TextStyle(
                      color: textColor,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        story.authorName,
                        style: TextStyle(
                          color: subtitleColor,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: _getGenreColor(story.displayGenre)
                              .withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          story.displayGenre,
                          style: TextStyle(
                            color: _getGenreColor(story.displayGenre),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    story.previewText,
                    style: TextStyle(
                      color: previewColor,
                      fontSize: 13,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  // Stats row
                  Row(
                    children: [
                      Icon(Icons.visibility, size: 14, color: subtitleColor),
                      const SizedBox(width: 4),
                      Text(
                        '${story.viewCount}',
                        style: TextStyle(color: subtitleColor, fontSize: 12),
                      ),
                      const SizedBox(width: 12),
                      Icon(Icons.favorite, size: 14, color: subtitleColor),
                      const SizedBox(width: 4),
                      Text(
                        '${story.likeCount}',
                        style: TextStyle(color: subtitleColor, fontSize: 12),
                      ),
                      if ((story.averageRating ?? 0) > 0) ...[
                        const SizedBox(width: 12),
                        Icon(Icons.star, size: 14, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(
                          (story.averageRating ?? 0).toStringAsFixed(1),
                          style: TextStyle(color: subtitleColor, fontSize: 12),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            // More options button
            PopupMenuButton<String>(
              icon: Icon(Icons.more_vert, color: subtitleColor),
              color: cardBgColor,
              onSelected: (value) {
                if (value == 'view') {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ShortDetailScreen(novel: story),
                    ),
                  );
                } else if (value == 'delete') {
                  _deleteStory(story);
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'view',
                  child: Row(
                    children: [
                      Icon(Icons.visibility, color: textColor, size: 20),
                      const SizedBox(width: 8),
                      Text('View', style: TextStyle(color: textColor)),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'delete',
                  child: const Row(
                    children: [
                      Icon(Icons.delete, color: Colors.red, size: 20),
                      SizedBox(width: 8),
                      Text('Delete', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getGenreColor(String genre) {
    final colors = {
      'Romance': const Color(0xFFec4899),
      'Sweet Romance': const Color(0xFFec4899),
      'Fantasy': const Color(0xFF8b5cf6),
      'Thriller': const Color(0xFFef4444),
      'Revenge': const Color(0xFFef4444),
      'Rebirth': const Color(0xFF8b5cf6),
      'Billionaire': const Color(0xFFeab308),
    };
    return colors[genre] ?? const Color(0xFF3b82f6);
  }
}
