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
    required this.category,
    this.tags,
    this.chapters,
  });

  factory ShortNovel.fromJson(Map<String, dynamic> json) {
    return ShortNovel(
      id: json['id'],
      title: json['title'],
      slug: json['slug'],
      blurb: json['blurb'],
      coverImage: json['coverImage'],
      authorName: json['authorName'],
      shortNovelGenre: json['shortNovelGenre'],
      readingPreview: json['readingPreview'],
      viewCount: json['viewCount'] ?? 0,
      likeCount: json['likeCount'] ?? 0,
      wordCount: json['wordCount'] ?? 0,
      category: Category.fromJson(json['category']),
      tags: json['tags'] != null
          ? (json['tags'] as List).map((t) => Tag.fromJson(t)).toList()
          : null,
      chapters: json['chapters'] != null
          ? (json['chapters'] as List).map((c) => Chapter.fromJson(c)).toList()
          : null,
    );
  }

  String get displayGenre => shortNovelGenre ?? category.name;
  String get previewText => readingPreview ?? blurb;
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
