import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../services/reading_history_service.dart';
import '../services/api_service.dart';
import '../models/short_novel.dart';
import 'short_detail_screen.dart';

class ReadingHistoryScreen extends StatefulWidget {
  const ReadingHistoryScreen({super.key});

  @override
  State<ReadingHistoryScreen> createState() => _ReadingHistoryScreenState();
}

class _ReadingHistoryScreenState extends State<ReadingHistoryScreen> {
  List<Map<String, dynamic>> _history = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final history = await ReadingHistoryService.getHistory();
    if (mounted) {
      setState(() {
        _history = history;
        _isLoading = false;
      });
    }
  }

  Future<void> _clearHistory() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        final isDark = context.watch<ThemeProvider>().isDarkMode;
        return AlertDialog(
          backgroundColor: isDark ? Colors.grey[900] : Colors.white,
          title: Text(
            'Clear History',
            style: TextStyle(color: isDark ? Colors.white : Colors.black),
          ),
          content: Text(
            'Are you sure you want to clear all reading history?',
            style: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[600]),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Clear', style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );

    if (confirm == true) {
      await ReadingHistoryService.clearHistory();
      _loadHistory();
    }
  }

  String _formatReadTime(String? isoDate) {
    if (isoDate == null) return '';
    try {
      final date = DateTime.parse(isoDate);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${date.month}/${date.day}/${date.year}';
    } catch (e) {
      return '';
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
              'Reading History',
              style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
            ),
            actions: [
              if (_history.isNotEmpty)
                IconButton(
                  icon: Icon(Icons.delete_outline, color: subtitleColor),
                  onPressed: _clearHistory,
                ),
            ],
          ),
          body: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _history.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.history, size: 64, color: subtitleColor),
                          const SizedBox(height: 16),
                          Text(
                            'No reading history',
                            style: TextStyle(color: textColor, fontSize: 18),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Stories you read will appear here',
                            style: TextStyle(color: subtitleColor),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _history.length,
                      itemBuilder: (context, index) {
                        final item = _history[index];
                        final novel = ReadingHistoryService.historyItemToNovel(item);

                        return Dismissible(
                          key: Key('history_${item['id']}'),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 20),
                            color: Colors.red,
                            child: const Icon(Icons.delete, color: Colors.white),
                          ),
                          onDismissed: (_) async {
                            await ReadingHistoryService.removeFromHistory(item['id']);
                            setState(() {
                              _history.removeAt(index);
                            });
                          },
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            leading: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: item['coverImage'] != null
                                  ? Image.network(
                                      item['coverImage'],
                                      width: 50,
                                      height: 70,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => Container(
                                        width: 50,
                                        height: 70,
                                        color: cardBgColor,
                                        child: Icon(Icons.book, color: subtitleColor),
                                      ),
                                    )
                                  : Container(
                                      width: 50,
                                      height: 70,
                                      color: cardBgColor,
                                      child: Icon(Icons.book, color: subtitleColor),
                                    ),
                            ),
                            title: Text(
                              item['title'] ?? 'Unknown Title',
                              style: TextStyle(
                                color: textColor,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 4),
                                Text(
                                  item['authorName'] ?? 'Unknown Author',
                                  style: TextStyle(color: subtitleColor, fontSize: 12),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _formatReadTime(item['readAt']),
                                  style: TextStyle(
                                    color: subtitleColor.withOpacity(0.7),
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                            trailing: Icon(Icons.chevron_right, color: subtitleColor),
                            onTap: () async {
                              // Fetch full novel data and navigate
                              final fullNovel = await ApiService.fetchShortById(item['id']);
                              if (fullNovel != null && mounted) {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ShortDetailScreen(novel: fullNovel),
                                  ),
                                );
                              }
                            },
                          ),
                        );
                      },
                    ),
        );
      },
    );
  }
}
