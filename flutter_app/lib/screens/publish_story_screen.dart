import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class PublishStoryScreen extends StatefulWidget {
  const PublishStoryScreen({super.key});

  @override
  State<PublishStoryScreen> createState() => _PublishStoryScreenState();
}

class _PublishStoryScreenState extends State<PublishStoryScreen> {
  final _titleController = TextEditingController();
  final _blurbController = TextEditingController();
  final _contentController = TextEditingController();
  final _tagsController = TextEditingController();
  final _contentFocusNode = FocusNode();

  String _selectedGenre = 'Romance';
  File? _coverImage;
  bool _isPublishing = false;
  int _characterCount = 0;

  static const int minCharacters = 2000;
  static const int maxCharacters = 100000;
  static const int maxTitleLength = 80;

  final List<String> _genres = [
    'Romance',
    'Fantasy',
    'Thriller',
    'Mystery',
    'Sci-Fi',
    'Horror',
    'Comedy',
    'Drama',
    'Adventure',
    'Historical',
    'Teen',
    'LGBTQ+',
    'Fanfiction',
    'General',
  ];

  @override
  void initState() {
    super.initState();
    _contentController.addListener(_updateCharacterCount);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _blurbController.dispose();
    _contentController.dispose();
    _tagsController.dispose();
    _contentFocusNode.dispose();
    super.dispose();
  }

  void _updateCharacterCount() {
    setState(() {
      _characterCount = _contentController.text.length;
    });
  }

  Future<void> _pickCoverImage() async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 1200,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        setState(() {
          _coverImage = File(pickedFile.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to pick image: $e')),
        );
      }
    }
  }

  void _insertFormatting(String prefix, String suffix) {
    final text = _contentController.text;
    final selection = _contentController.selection;

    if (selection.isValid && selection.start != selection.end) {
      // Wrap selected text
      final selectedText = text.substring(selection.start, selection.end);
      final newText = text.replaceRange(
        selection.start,
        selection.end,
        '$prefix$selectedText$suffix',
      );
      _contentController.value = TextEditingValue(
        text: newText,
        selection: TextSelection.collapsed(
          offset: selection.start + prefix.length + selectedText.length + suffix.length,
        ),
      );
    } else {
      // Insert at cursor
      final cursorPos = selection.baseOffset;
      final newText = text.substring(0, cursorPos) +
          prefix +
          suffix +
          text.substring(cursorPos);
      _contentController.value = TextEditingValue(
        text: newText,
        selection: TextSelection.collapsed(offset: cursorPos + prefix.length),
      );
    }
    _contentFocusNode.requestFocus();
  }

  Future<void> _insertImage() async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );

      if (pickedFile != null) {
        final bytes = await File(pickedFile.path).readAsBytes();
        if (bytes.length > 500 * 1024) {
          // 500KB limit
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Image too large. Max 500KB.')),
            );
          }
          return;
        }

        final base64Image = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        final imageTag = '\n[IMG]$base64Image[/IMG]\n';

        final text = _contentController.text;
        final selection = _contentController.selection;
        final cursorPos = selection.isValid ? selection.baseOffset : text.length;

        final newText = text.substring(0, cursorPos) +
            imageTag +
            text.substring(cursorPos);

        _contentController.value = TextEditingValue(
          text: newText,
          selection: TextSelection.collapsed(offset: cursorPos + imageTag.length),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to insert image: $e')),
        );
      }
    }
  }

  Future<void> _publish() async {
    final title = _titleController.text.trim();
    final blurb = _blurbController.text.trim();
    final content = _contentController.text.trim();
    final tagsText = _tagsController.text.trim();

    // Validation
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a title')),
      );
      return;
    }

    if (title.length > maxTitleLength) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Title must be $maxTitleLength characters or less')),
      );
      return;
    }

    if (content.length < minCharacters) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Story must be at least $minCharacters characters')),
      );
      return;
    }

    if (content.length > maxCharacters) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Story must be $maxCharacters characters or less')),
      );
      return;
    }

    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn || authProvider.token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in to publish')),
      );
      return;
    }

    setState(() => _isPublishing = true);

    try {
      String? coverImageBase64;
      if (_coverImage != null) {
        final bytes = await _coverImage!.readAsBytes();
        coverImageBase64 = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      }

      final tags = tagsText.isNotEmpty
          ? tagsText.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty).toList()
          : null;

      final result = await ApiService.publishStory(
        token: authProvider.token!,
        title: title,
        content: content,
        genre: _selectedGenre,
        blurb: blurb.isNotEmpty ? blurb : null,
        coverImage: coverImageBase64,
        tags: tags,
      );

      if (result['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Story published successfully!')),
          );
          Navigator.pop(context, true);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['error'] ?? 'Failed to publish')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isPublishing = false);
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
        final inputBgColor = isDark ? Colors.grey[850] : Colors.grey[200];

        final isValidLength = _characterCount >= minCharacters && _characterCount <= maxCharacters;
        final countColor = _characterCount < minCharacters
            ? Colors.orange
            : _characterCount > maxCharacters
                ? Colors.red
                : Colors.green;

        return Scaffold(
          backgroundColor: bgColor,
          appBar: AppBar(
            backgroundColor: bgColor,
            elevation: 0,
            leading: IconButton(
              icon: Icon(Icons.close, color: textColor),
              onPressed: () => Navigator.pop(context),
            ),
            title: Text(
              'Publish Story',
              style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
            ),
            actions: [
              TextButton(
                onPressed: _isPublishing || !isValidLength ? null : _publish,
                child: _isPublishing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Publish'),
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Cover Image
                Center(
                  child: GestureDetector(
                    onTap: _pickCoverImage,
                    child: Container(
                      width: 120,
                      height: 180,
                      decoration: BoxDecoration(
                        color: cardBgColor,
                        borderRadius: BorderRadius.circular(8),
                        image: _coverImage != null
                            ? DecorationImage(
                                image: FileImage(_coverImage!),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: _coverImage == null
                          ? Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.add_photo_alternate, size: 32, color: subtitleColor),
                                const SizedBox(height: 8),
                                Text(
                                  'Add Cover',
                                  style: TextStyle(color: subtitleColor, fontSize: 12),
                                ),
                              ],
                            )
                          : null,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Title
                Text(
                  'Title *',
                  style: TextStyle(color: textColor, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _titleController,
                  style: TextStyle(color: textColor),
                  maxLength: maxTitleLength,
                  decoration: InputDecoration(
                    hintText: 'Enter your story title',
                    hintStyle: TextStyle(color: subtitleColor),
                    filled: true,
                    fillColor: inputBgColor,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    counterStyle: TextStyle(color: subtitleColor),
                  ),
                ),
                const SizedBox(height: 16),

                // Genre
                Text(
                  'Genre *',
                  style: TextStyle(color: textColor, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: inputBgColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedGenre,
                      isExpanded: true,
                      dropdownColor: cardBgColor,
                      style: TextStyle(color: textColor),
                      items: _genres.map((genre) {
                        return DropdownMenuItem(
                          value: genre,
                          child: Text(genre),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() => _selectedGenre = value);
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Blurb
                Text(
                  'Blurb (optional)',
                  style: TextStyle(color: textColor, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _blurbController,
                  style: TextStyle(color: textColor),
                  maxLines: 3,
                  maxLength: 500,
                  decoration: InputDecoration(
                    hintText: 'Write a short description...',
                    hintStyle: TextStyle(color: subtitleColor),
                    filled: true,
                    fillColor: inputBgColor,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    counterStyle: TextStyle(color: subtitleColor),
                  ),
                ),
                const SizedBox(height: 16),

                // Tags
                Text(
                  'Tags (optional)',
                  style: TextStyle(color: textColor, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _tagsController,
                  style: TextStyle(color: textColor),
                  decoration: InputDecoration(
                    hintText: 'romance, drama, happy ending (comma separated)',
                    hintStyle: TextStyle(color: subtitleColor),
                    filled: true,
                    fillColor: inputBgColor,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Content
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Story Content *',
                      style: TextStyle(color: textColor, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      '$_characterCount / $minCharacters-$maxCharacters',
                      style: TextStyle(color: countColor, fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Formatting toolbar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: cardBgColor,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: Icon(Icons.format_bold, color: textColor, size: 20),
                        onPressed: () => _insertFormatting('[B]', '[/B]'),
                        tooltip: 'Bold',
                      ),
                      IconButton(
                        icon: Icon(Icons.format_italic, color: textColor, size: 20),
                        onPressed: () => _insertFormatting('[I]', '[/I]'),
                        tooltip: 'Italic',
                      ),
                      IconButton(
                        icon: Icon(Icons.image, color: textColor, size: 20),
                        onPressed: _insertImage,
                        tooltip: 'Insert Image (max 500KB)',
                      ),
                      const Spacer(),
                      Text(
                        'Tap to format',
                        style: TextStyle(color: subtitleColor, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                TextField(
                  controller: _contentController,
                  focusNode: _contentFocusNode,
                  style: TextStyle(color: textColor, height: 1.6),
                  maxLines: 20,
                  decoration: InputDecoration(
                    hintText: 'Write your story here...\n\nUse [B]text[/B] for bold\nUse [I]text[/I] for italic',
                    hintStyle: TextStyle(color: subtitleColor),
                    filled: true,
                    fillColor: inputBgColor,
                    border: OutlineInputBorder(
                      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),

                const SizedBox(height: 16),
                Text(
                  '• Minimum $minCharacters characters, maximum $maxCharacters characters\n'
                  '• Use [B]text[/B] for bold, [I]text[/I] for italic\n'
                  '• Images must be under 500KB',
                  style: TextStyle(color: subtitleColor, fontSize: 12),
                ),

                const SizedBox(height: 80),
              ],
            ),
          ),
        );
      },
    );
  }
}
