import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/theme_provider.dart';

class BookshelfScreen extends StatelessWidget {
  const BookshelfScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final isDark = themeProvider.isDarkMode;
        final bgColor = isDark ? Colors.black : Colors.white;
        final textColor = isDark ? Colors.white : Colors.grey[900]!;
        final subtitleColor = isDark ? Colors.grey[400]! : Colors.grey[600]!;
        final cardBgColor = isDark ? Colors.grey[900]! : Colors.grey[100]!;

        return Scaffold(
          backgroundColor: bgColor,
          body: SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Text(
                        'My Bookshelf',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                // Empty state
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Empty state icon
                        const SizedBox(height: 40),
                        Icon(
                          Icons.bookmark_outline,
                          size: 64,
                          color: subtitleColor,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No books saved',
                          style: TextStyle(
                            color: textColor,
                            fontSize: 18,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Save your favorite stories to read\nthem anytime, even offline',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: subtitleColor,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF3b82f6),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 12,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24),
                            ),
                          ),
                          child: const Text('Explore Stories'),
                        ),
                        const SizedBox(height: 48),
                        // Continue Reading Section
                        _buildSection(
                          'Continue Reading',
                          'Stories you\'re reading will appear here',
                          textColor,
                          subtitleColor,
                          cardBgColor,
                        ),
                        const SizedBox(height: 24),
                        // Saved for Later Section
                        _buildSection(
                          'Saved for Later',
                          'Stories you save will appear here',
                          textColor,
                          subtitleColor,
                          cardBgColor,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSection(
    String title,
    String placeholder,
    Color textColor,
    Color subtitleColor,
    Color cardBgColor,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: textColor,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: cardBgColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            placeholder,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: subtitleColor,
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }
}
