import 'package:flutter/material.dart';

import 'genre_detail_screen.dart';

class GenreScreen extends StatelessWidget {
  const GenreScreen({super.key});

  // Genre data matching web version
  static const List<Map<String, dynamic>> genres = [
    {'slug': 'sweet-romance', 'name': 'Sweet Romance', 'color': 0xFFec4899},
    {'slug': 'billionaire-romance', 'name': 'Billionaire Romance', 'color': 0xFFeab308},
    {'slug': 'face-slapping', 'name': 'Face-Slapping', 'color': 0xFFf97316},
    {'slug': 'revenge', 'name': 'Revenge', 'color': 0xFFef4444},
    {'slug': 'rebirth', 'name': 'Rebirth', 'color': 0xFF8b5cf6},
    {'slug': 'regret', 'name': 'Regret', 'color': 0xFF6366f1},
    {'slug': 'healing-redemption', 'name': 'Healing/Redemption', 'color': 0xFF22c55e},
    {'slug': 'true-fake-identity', 'name': 'True/Fake Identity', 'color': 0xFF06b6d4},
    {'slug': 'substitute', 'name': 'Substitute', 'color': 0xFFa855f7},
    {'slug': 'age-gap', 'name': 'Age Gap', 'color': 0xFFec4899},
    {'slug': 'entertainment-circle', 'name': 'Entertainment Circle', 'color': 0xFFf59e0b},
    {'slug': 'group-pet', 'name': 'Group Pet', 'color': 0xFFfb7185},
    {'slug': 'lgbtq', 'name': 'LGBTQ+', 'color': 0xFF7c3aed},
    {'slug': 'quick-transmigration', 'name': 'Quick Transmigration', 'color': 0xFF0ea5e9},
    {'slug': 'survival-apocalypse', 'name': 'Survival/Apocalypse', 'color': 0xFF991b1b},
    {'slug': 'system', 'name': 'System', 'color': 0xFF14b8a6},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Genres',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 2.2,
          ),
          itemCount: genres.length,
          itemBuilder: (context, index) {
            final genre = genres[index];
            return _buildGenreCard(context, genre);
          },
        ),
      ),
    );
  }

  Widget _buildGenreCard(BuildContext context, Map<String, dynamic> genre) {
    final color = Color(genre['color'] as int);

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => GenreDetailScreen(
              genreSlug: genre['slug'] as String,
              genreName: genre['name'] as String,
              genreColor: color,
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              color.withOpacity(0.8),
              color.withOpacity(0.4),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              genre['name'] as String,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
      ),
    );
  }
}
