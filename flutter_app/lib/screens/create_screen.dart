import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/theme_provider.dart';

class CreateScreen extends StatefulWidget {
  const CreateScreen({super.key});

  @override
  State<CreateScreen> createState() => _CreateScreenState();
}

class _CreateScreenState extends State<CreateScreen> {
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final isDark = themeProvider.isDarkMode;
        final bgColor = isDark ? Colors.black : Colors.white;
        final textColor = isDark ? Colors.white : Colors.grey[900]!;
        final subtitleColor = isDark ? Colors.grey[400]! : Colors.grey[600]!;
        final cardBgColor = isDark ? Colors.grey[900]! : Colors.grey[100]!;
        final borderColor = isDark ? Colors.grey[800]! : Colors.grey[300]!;

        return Scaffold(
          backgroundColor: bgColor,
          body: SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: () {},
                        child: Text(
                          'Cancel',
                          style: TextStyle(color: subtitleColor),
                        ),
                      ),
                      Text(
                        'Create Story',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3b82f6),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        child: const Text('Publish'),
                      ),
                    ],
                  ),
                ),
                // Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Title Input
                        TextField(
                          controller: _titleController,
                          style: TextStyle(
                            color: textColor,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Story Title',
                            hintStyle: TextStyle(color: subtitleColor),
                            border: InputBorder.none,
                          ),
                        ),
                        Divider(color: borderColor),
                        // Content Input
                        TextField(
                          controller: _contentController,
                          maxLines: null,
                          minLines: 15,
                          style: TextStyle(
                            color: textColor,
                            fontSize: 16,
                            height: 1.6,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Write your story...',
                            hintStyle: TextStyle(color: subtitleColor),
                            border: InputBorder.none,
                          ),
                        ),
                        const SizedBox(height: 24),
                        // Tips Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: cardBgColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Writing Tips',
                                style: TextStyle(
                                  color: Color(0xFF3b82f6),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Short stories have a 100,000 character limit. Start with a hook that grabs attention!',
                                style: TextStyle(
                                  color: subtitleColor,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
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
}
