import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/short_novel.dart';
import 'short_detail_screen.dart';
import 'follow_list_screen.dart';
import 'login_screen.dart';

class UserProfileViewScreen extends StatefulWidget {
  final String userId;
  final String? userName;
  final String? userAvatar;

  const UserProfileViewScreen({
    super.key,
    required this.userId,
    this.userName,
    this.userAvatar,
  });

  @override
  State<UserProfileViewScreen> createState() => _UserProfileViewScreenState();
}

class _UserProfileViewScreenState extends State<UserProfileViewScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  Map<String, dynamic>? _userInfo;
  Map<String, dynamic>? _stats;
  List<ShortNovel> _stories = [];
  List<ShortNovel> _bookshelf = [];
  bool _isLoading = true;
  bool _isFollowing = false;
  bool _isFollowLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadUserData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    final token = context.read<AuthProvider>().token;

    // Load user info, stats, stories in parallel
    final results = await Future.wait([
      ApiService.getUserInfo(widget.userId),
      ApiService.getUserStats(widget.userId, token: token),
      ApiService.getUserStories(widget.userId, token: token),
      ApiService.getUserBookshelf(widget.userId, token: token),
    ]);

    if (mounted) {
      setState(() {
        _userInfo = results[0] as Map<String, dynamic>?;
        _stats = results[1] as Map<String, dynamic>;
        _stories = results[2] as List<ShortNovel>;
        _bookshelf = results[3] as List<ShortNovel>;
        _isFollowing = _stats?['isFollowing'] == true;
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleFollow() async {
    final authProvider = context.read<AuthProvider>();

    if (!authProvider.isLoggedIn) {
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      if (result != true) return;
    }

    final token = authProvider.token;
    if (token == null) return;

    setState(() => _isFollowLoading = true);

    bool success;
    if (_isFollowing) {
      success = await ApiService.unfollowUser(widget.userId, token: token);
    } else {
      success = await ApiService.followUser(widget.userId, token: token);
    }

    if (success && mounted) {
      setState(() {
        _isFollowing = !_isFollowing;
        if (_stats != null) {
          final currentFollowers = _stats!['followers'] ?? 0;
          _stats!['followers'] = _isFollowing ? currentFollowers + 1 : currentFollowers - 1;
        }
      });
    }

    if (mounted) {
      setState(() => _isFollowLoading = false);
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
        final avatarBgColor = isDark ? Colors.grey[700]! : Colors.grey[300]!;

        final currentUserId = context.read<AuthProvider>().user?.id;
        final isOwnProfile = currentUserId == widget.userId;

        final userName = _userInfo?['name'] ?? widget.userName ?? 'User';
        final userAvatar = _userInfo?['avatar'] ?? widget.userAvatar;
        final userBio = _userInfo?['bio'];

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
              userName,
              style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
            ),
          ),
          body: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _loadUserData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: [
                        // Profile Header
                        Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            children: [
                              // Avatar
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF3b82f6),
                                  shape: BoxShape.circle,
                                  image: userAvatar != null
                                      ? DecorationImage(
                                          image: NetworkImage(userAvatar),
                                          fit: BoxFit.cover,
                                        )
                                      : null,
                                ),
                                child: userAvatar == null
                                    ? Center(
                                        child: Text(
                                          userName.isNotEmpty
                                              ? userName[0].toUpperCase()
                                              : 'U',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 32,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      )
                                    : null,
                              ),
                              const SizedBox(height: 12),
                              // Username
                              Text(
                                userName,
                                style: TextStyle(
                                  color: textColor,
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              // Bio
                              if (userBio != null && userBio.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Text(
                                  userBio,
                                  style: TextStyle(
                                    color: subtitleColor,
                                    fontSize: 14,
                                  ),
                                  textAlign: TextAlign.center,
                                  maxLines: 3,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                              const SizedBox(height: 16),
                              // Follow Button (if not own profile)
                              if (!isOwnProfile)
                                SizedBox(
                                  width: 140,
                                  child: ElevatedButton(
                                    onPressed: _isFollowLoading ? null : _toggleFollow,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: _isFollowing
                                          ? cardBgColor
                                          : const Color(0xFF3b82f6),
                                      foregroundColor:
                                          _isFollowing ? textColor : Colors.white,
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(20),
                                        side: _isFollowing
                                            ? BorderSide(color: subtitleColor)
                                            : BorderSide.none,
                                      ),
                                    ),
                                    child: _isFollowLoading
                                        ? const SizedBox(
                                            width: 16,
                                            height: 16,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Colors.white,
                                            ),
                                          )
                                        : Text(
                                            _isFollowing ? 'Following' : 'Follow',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        // Stats Row
                        Container(
                          margin: const EdgeInsets.symmetric(horizontal: 20),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: cardBgColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildStatItem(
                                '${_stories.length}',
                                'Stories',
                                textColor,
                                subtitleColor,
                              ),
                              _buildStatItem(
                                '${_stats?['following'] ?? 0}',
                                'Following',
                                textColor,
                                subtitleColor,
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => FollowListScreen(
                                        type: FollowListType.following,
                                        userId: widget.userId,
                                      ),
                                    ),
                                  );
                                },
                              ),
                              _buildStatItem(
                                '${_stats?['followers'] ?? 0}',
                                'Followers',
                                textColor,
                                subtitleColor,
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => FollowListScreen(
                                        type: FollowListType.followers,
                                        userId: widget.userId,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                        // Tab Bar
                        Container(
                          margin: const EdgeInsets.symmetric(horizontal: 20),
                          decoration: BoxDecoration(
                            color: cardBgColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: TabBar(
                            controller: _tabController,
                            labelColor: textColor,
                            unselectedLabelColor: subtitleColor,
                            indicatorColor: const Color(0xFF3b82f6),
                            indicatorSize: TabBarIndicatorSize.tab,
                            dividerColor: Colors.transparent,
                            tabs: const [
                              Tab(text: 'Stories'),
                              Tab(text: 'Bookshelf'),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Tab Content
                        SizedBox(
                          height: 400, // Fixed height for tab content
                          child: TabBarView(
                            controller: _tabController,
                            children: [
                              // Stories Tab
                              _buildStoriesGrid(_stories, textColor, subtitleColor, cardBgColor),
                              // Bookshelf Tab
                              _buildStoriesGrid(_bookshelf, textColor, subtitleColor, cardBgColor),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
        );
      },
    );
  }

  Widget _buildStatItem(
    String value,
    String label,
    Color textColor,
    Color subtitleColor, {
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: textColor,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: subtitleColor,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStoriesGrid(
    List<ShortNovel> stories,
    Color textColor,
    Color subtitleColor,
    Color cardBgColor,
  ) {
    if (stories.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.book_outlined, size: 48, color: subtitleColor),
            const SizedBox(height: 12),
            Text(
              'No stories yet',
              style: TextStyle(color: subtitleColor, fontSize: 16),
            ),
          ],
        ),
      );
    }

    // Use compact list view instead of grid
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: stories.length,
      itemBuilder: (context, index) {
        final novel = stories[index];
        return _buildStoryCard(novel, textColor, subtitleColor, cardBgColor);
      },
    );
  }

  Widget _buildStoryCard(
    ShortNovel novel,
    Color textColor,
    Color subtitleColor,
    Color cardBgColor,
  ) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ShortDetailScreen(novel: novel),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: cardBgColor,
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Genre tag
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3b82f6).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      novel.displayGenre,
                      style: const TextStyle(
                        color: Color(0xFF3b82f6),
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Title
                  Text(
                    novel.title,
                    style: TextStyle(
                      color: textColor,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  // Stats row
                  Row(
                    children: [
                      if (novel.averageRating != null && novel.averageRating! > 0) ...[
                        Icon(Icons.star, size: 12, color: Colors.amber[400]),
                        const SizedBox(width: 2),
                        Text(
                          novel.averageRating!.toStringAsFixed(1),
                          style: TextStyle(
                            color: Colors.amber[400],
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Icon(Icons.visibility_outlined, size: 12, color: subtitleColor),
                      const SizedBox(width: 2),
                      Text(
                        _formatCount(novel.viewCount),
                        style: TextStyle(color: subtitleColor, fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Arrow
            Padding(
              padding: const EdgeInsets.only(left: 8),
              child: Icon(
                Icons.chevron_right,
                color: subtitleColor,
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    }
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}
