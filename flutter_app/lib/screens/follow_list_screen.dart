import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import 'user_profile_view_screen.dart';

enum FollowListType { following, followers }

class FollowListScreen extends StatefulWidget {
  final FollowListType type;
  final String userId;

  const FollowListScreen({
    super.key,
    required this.type,
    required this.userId,
  });

  @override
  State<FollowListScreen> createState() => _FollowListScreenState();
}

class _FollowListScreenState extends State<FollowListScreen> {
  List<Map<String, dynamic>> _users = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    final token = context.read<AuthProvider>().token;

    final users = widget.type == FollowListType.following
        ? await ApiService.getFollowing(widget.userId, token: token)
        : await ApiService.getFollowers(widget.userId, token: token);

    if (mounted) {
      setState(() {
        _users = users;
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleFollow(String userId, bool isFollowing) async {
    final token = context.read<AuthProvider>().token;
    if (token == null) return;

    bool success;
    if (isFollowing) {
      success = await ApiService.unfollowUser(userId, token: token);
    } else {
      success = await ApiService.followUser(userId, token: token);
    }

    if (success) {
      _loadUsers();
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

        final title = widget.type == FollowListType.following ? 'Following' : 'Followers';

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
              title,
              style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
            ),
          ),
          body: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _users.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.people_outline, size: 64, color: subtitleColor),
                          const SizedBox(height: 16),
                          Text(
                            widget.type == FollowListType.following
                                ? 'Not following anyone'
                                : 'No followers yet',
                            style: TextStyle(color: textColor, fontSize: 18),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadUsers,
                      child: ListView.builder(
                        itemCount: _users.length,
                        itemBuilder: (context, index) {
                          final user = _users[index];
                          final isFollowing = user['isFollowing'] == true;
                          final isCurrentUser =
                              user['id']?.toString() == context.read<AuthProvider>().user?.id;

                          return ListTile(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => UserProfileViewScreen(
                                    userId: user['id'].toString(),
                                    userName: user['name'],
                                    userAvatar: user['avatar'],
                                  ),
                                ),
                              );
                            },
                            leading: CircleAvatar(
                              backgroundColor: cardBgColor,
                              backgroundImage: user['avatar'] != null
                                  ? NetworkImage(user['avatar'])
                                  : null,
                              child: user['avatar'] == null
                                  ? Text(
                                      (user['name'] ?? 'U')[0].toUpperCase(),
                                      style: TextStyle(color: textColor),
                                    )
                                  : null,
                            ),
                            title: Text(
                              user['name'] ?? 'User',
                              style: TextStyle(color: textColor, fontWeight: FontWeight.w600),
                            ),
                            subtitle: user['bio'] != null
                                ? Text(
                                    user['bio'],
                                    style: TextStyle(color: subtitleColor, fontSize: 12),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  )
                                : null,
                            trailing: isCurrentUser
                                ? null
                                : TextButton(
                                    onPressed: () =>
                                        _toggleFollow(user['id'].toString(), isFollowing),
                                    style: TextButton.styleFrom(
                                      backgroundColor:
                                          isFollowing ? cardBgColor : const Color(0xFF3b82f6),
                                      foregroundColor: isFollowing ? textColor : Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                        vertical: 8,
                                      ),
                                    ),
                                    child: Text(isFollowing ? 'Following' : 'Follow'),
                                  ),
                          );
                        },
                      ),
                    ),
        );
      },
    );
  }
}
