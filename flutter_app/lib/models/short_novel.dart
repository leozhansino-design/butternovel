class ShortNovel {
  final int id;
  final String title;
  final String slug;
  final String blurb;
  final String? coverImage;
  final String authorName;
  final String? shortNovelGenre;
  final String? readingPreview;
  final int viewCount;
  final int likeCount;
  final int wordCount;
  final double? averageRating;
  final Category category;
  final List<Tag>? tags;
  final List<Chapter>? chapters;

  ShortNovel({
    required this.id,
    required this.title,
    required this.slug,
    required this.blurb,
    this.coverImage,
    required this.authorName,
    this.shortNovelGenre,
    this.readingPreview,
    required this.viewCount,
    required this.likeCount,
    required this.wordCount,
    this.averageRating,
    required this.category,
    this.tags,
    this.chapters,
  });

  factory ShortNovel.fromJson(Map<String, dynamic> json) {
    // Safely parse category
    Category category;
    if (json['category'] != null && json['category'] is Map<String, dynamic>) {
      category = Category.fromJson(json['category']);
    } else {
      category = Category(id: 0, name: 'Unknown', slug: 'unknown');
    }

    // Safely parse averageRating
    double? averageRating;
    if (json['averageRating'] != null) {
      if (json['averageRating'] is num) {
        averageRating = (json['averageRating'] as num).toDouble();
      } else if (json['averageRating'] is String) {
        averageRating = double.tryParse(json['averageRating']);
      }
    }

    return ShortNovel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      title: json['title']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      blurb: json['blurb']?.toString() ?? '',
      coverImage: json['coverImage']?.toString(),
      authorName: json['authorName']?.toString() ?? 'Unknown',
      shortNovelGenre: json['shortNovelGenre']?.toString(),
      readingPreview: json['readingPreview']?.toString(),
      viewCount: json['viewCount'] is int ? json['viewCount'] : int.tryParse(json['viewCount']?.toString() ?? '0') ?? 0,
      likeCount: json['likeCount'] is int ? json['likeCount'] : int.tryParse(json['likeCount']?.toString() ?? '0') ?? 0,
      wordCount: json['wordCount'] is int ? json['wordCount'] : int.tryParse(json['wordCount']?.toString() ?? '0') ?? 0,
      averageRating: averageRating,
      category: category,
      tags: json['tags'] != null && json['tags'] is List
          ? (json['tags'] as List)
              .where((t) => t != null && t is Map<String, dynamic>)
              .map((t) => Tag.fromJson(t as Map<String, dynamic>))
              .toList()
          : null,
      chapters: json['chapters'] != null && json['chapters'] is List
          ? (json['chapters'] as List)
              .where((c) => c != null && c is Map<String, dynamic>)
              .map((c) => Chapter.fromJson(c as Map<String, dynamic>))
              .toList()
          : null,
    );
  }

  String get displayGenre => shortNovelGenre ?? category.name;
  String get previewText => readingPreview ?? blurb;

  // Get full content from chapters for preview display
  String get fullContent {
    if (chapters != null && chapters!.isNotEmpty) {
      // Combine all chapter content
      return chapters!.map((c) => c.content).join('\n\n');
    }
    return readingPreview ?? blurb;
  }
}

class Category {
  final int id;
  final String name;
  final String slug;

  Category({
    required this.id,
    required this.name,
    required this.slug,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      name: json['name'],
      slug: json['slug'],
    );
  }
}

class Tag {
  final String id;
  final String name;
  final String slug;

  Tag({
    required this.id,
    required this.name,
    required this.slug,
  });

  factory Tag.fromJson(Map<String, dynamic> json) {
    return Tag(
      id: json['id'],
      name: json['name'],
      slug: json['slug'],
    );
  }
}

class Chapter {
  final int id;
  final String title;
  final int chapterNumber;
  final String content;
  final int wordCount;

  Chapter({
    required this.id,
    required this.title,
    required this.chapterNumber,
    required this.content,
    required this.wordCount,
  });

  factory Chapter.fromJson(Map<String, dynamic> json) {
    return Chapter(
      id: json['id'],
      title: json['title'],
      chapterNumber: json['chapterNumber'],
      content: json['content'],
      wordCount: json['wordCount'] ?? 0,
    );
  }
}
