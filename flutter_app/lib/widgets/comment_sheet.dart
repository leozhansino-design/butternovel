import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../screens/login_screen.dart';

class CommentSheet extends StatefulWidget {
  final int novelId;
  final int chapterId;
  final int paragraphIndex;
  final String paragraphText;

  const CommentSheet({
    super.key,
    required this.novelId,
    required this.chapterId,
    required this.paragraphIndex,
    required this.paragraphText,
  });

  @override
  State<CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends State<CommentSheet> {
  List<Map<String, dynamic>> _comments = [];
  bool _isLoading = true;
  final _commentController = TextEditingController();
  bool _isPosting = false;

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadComments() async {
    final comments = await ApiService.getComments(
      widget.chapterId,
      widget.paragraphIndex,
    );
    if (mounted) {
      setState(() {
        _comments = comments;
        _isLoading = false;
      });
    }
  }

  Future<void> _postComment() async {
    final content = _commentController.text.trim();
    if (content.isEmpty) return;

    // Check login status
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn) {
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      if (result != true || !mounted) return;
      // Continue with posting after successful login
    }

    setState(() => _isPosting = true);

    final result = await ApiService.postComment(
      novelId: widget.novelId,
      chapterId: widget.chapterId,
      paragraphIndex: widget.paragraphIndex,
      content: content,
    );

    if (result != null && mounted) {
      _commentController.clear();
      _loadComments();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Comment posted!')),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to post comment.')),
      );
    }

    if (mounted) {
      setState(() => _isPosting = false);
    }
  }

  Future<void> _likeComment(String commentId, int index) async {
    final success = await ApiService.likeComment(commentId);
    if (success && mounted) {
      setState(() {
        _comments[index]['likeCount'] = (_comments[index]['likeCount'] ?? 0) + 1;
        _comments[index]['isLiked'] = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final isDark = themeProvider.isDarkMode;
        final bgColor = isDark ? Colors.grey[900]! : Colors.white;
        final cardBgColor = isDark ? Colors.grey[850] : Colors.grey[100];
        final textColor = isDark ? Colors.white : Colors.grey[900]!;
        final subtitleColor = isDark ? Colors.grey[400]! : Colors.grey[600]!;
        final borderColor = isDark ? Colors.grey[800]! : Colors.grey[300]!;
        final inputBgColor = isDark ? Colors.grey[800] : Colors.grey[200];

        return Container(
          height: MediaQuery.of(context).size.height * 0.75,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.grey[700] : Colors.grey[400],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Text(
                      'Comments',
                      style: TextStyle(
                        color: textColor,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '(${_comments.length})',
                      style: TextStyle(color: subtitleColor, fontSize: 16),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: Icon(Icons.close, color: textColor),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              // Paragraph preview
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: cardBgColor,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: borderColor),
                ),
                child: Text(
                  widget.paragraphText.length > 100
                      ? '${widget.paragraphText.substring(0, 100)}...'
                      : widget.paragraphText,
                  style: TextStyle(
                    color: subtitleColor,
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: 8),
              // Comments list
              Expanded(
                child: _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(color: Color(0xFF3b82f6)),
                      )
                    : _comments.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.chat_bubble_outline,
                                    color: subtitleColor, size: 48),
                                const SizedBox(height: 16),
                                Text(
                                  'No comments yet',
                                  style: TextStyle(color: subtitleColor),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Be the first to comment!',
                                  style: TextStyle(color: subtitleColor, fontSize: 12),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _comments.length,
                            itemBuilder: (context, index) {
                              return _buildCommentItem(_comments[index], index, isDark, textColor, subtitleColor, borderColor);
                            },
                          ),
              ),
              // Comment input
              Container(
                padding: EdgeInsets.only(
                  left: 16,
                  right: 16,
                  top: 12,
                  bottom: MediaQuery.of(context).padding.bottom + 12,
                ),
                decoration: BoxDecoration(
                  color: cardBgColor,
                  border: Border(top: BorderSide(color: borderColor)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _commentController,
                        style: TextStyle(color: textColor),
                        decoration: InputDecoration(
                          hintText: 'Write a comment...',
                          hintStyle: TextStyle(color: subtitleColor),
                          filled: true,
                          fillColor: inputBgColor,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                        maxLines: null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      onPressed: _isPosting ? null : _postComment,
                      icon: _isPosting
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Color(0xFF3b82f6),
                              ),
                            )
                          : const Icon(
                              Icons.send,
                              color: Color(0xFF3b82f6),
                            ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCommentItem(Map<String, dynamic> comment, int index, bool isDark, Color textColor, Color subtitleColor, Color borderColor) {
    final user = comment['user'] as Map<String, dynamic>?;
    final userName = user?['name'] ?? 'Anonymous';
    final userAvatar = user?['avatar'] as String?;
    final content = comment['content'] as String? ?? '';
    final likeCount = comment['likeCount'] as int? ?? 0;
    final createdAt = comment['createdAt'] as String?;
    final isLiked = comment['isLiked'] as bool? ?? false;
    final avatarBgColor = isDark ? Colors.grey[700] : Colors.grey[400];
    final contentColor = isDark ? Colors.grey[300] : Colors.grey[700];

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: borderColor)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          CircleAvatar(
            radius: 18,
            backgroundColor: avatarBgColor,
            backgroundImage: userAvatar != null ? NetworkImage(userAvatar) : null,
            child: userAvatar == null
                ? Text(
                    userName.isNotEmpty ? userName[0].toUpperCase() : '?',
                    style: TextStyle(color: isDark ? Colors.white : Colors.grey[800], fontSize: 14),
                  )
                : null,
          ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      userName,
                      style: TextStyle(
                        color: textColor,
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                    if (createdAt != null) ...[
                      const SizedBox(width: 8),
                      Text(
                        _formatTime(createdAt),
                        style: TextStyle(color: subtitleColor, fontSize: 12),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  content,
                  style: TextStyle(color: contentColor, fontSize: 14),
                ),
                const SizedBox(height: 8),
                // Like button
                GestureDetector(
                  onTap: () => _likeComment(comment['id'], index),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isLiked ? Icons.favorite : Icons.favorite_border,
                        size: 16,
                        color: isLiked ? Colors.red : subtitleColor,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        likeCount.toString(),
                        style: TextStyle(color: subtitleColor, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inDays > 365) {
        return '${(diff.inDays / 365).floor()}y ago';
      } else if (diff.inDays > 30) {
        return '${(diff.inDays / 30).floor()}mo ago';
      } else if (diff.inDays > 0) {
        return '${diff.inDays}d ago';
      } else if (diff.inHours > 0) {
        return '${diff.inHours}h ago';
      } else if (diff.inMinutes > 0) {
        return '${diff.inMinutes}m ago';
      } else {
        return 'Just now';
      }
    } catch (e) {
      return '';
    }
  }
}
