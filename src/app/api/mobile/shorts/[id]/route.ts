import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/mobile/shorts/[id] - Get short novel details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const novelId = parseInt(id, 10);

    if (isNaN(novelId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid novel ID",
        },
        { status: 400 }
      );
    }

    // Fetch short novel with full details
    const novel = await prisma.novel.findFirst({
      where: {
        id: novelId,
        isShortNovel: true,
        isPublished: true,
        isBanned: false,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        blurb: true,
        coverImage: true,
        authorName: true,
        authorId: true,
        shortNovelGenre: true,
        readingPreview: true,
        viewCount: true,
        likeCount: true,
        wordCount: true,
        createdAt: true,
        averageRating: true,
        totalRatings: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        chapters: {
          where: {
            isPublished: true,
          },
          orderBy: {
            chapterNumber: "asc",
          },
          select: {
            id: true,
            title: true,
            chapterNumber: true,
            content: true,
            wordCount: true,
          },
        },
      },
    });

    if (!novel) {
      return NextResponse.json(
        {
          success: false,
          error: "Short novel not found",
        },
        { status: 404 }
      );
    }

    // Increment view count asynchronously
    prisma.novel
      .update({
        where: { id: novelId },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err) => console.error("Failed to increment view count:", err));

    return NextResponse.json({
      success: true,
      data: novel,
    });
  } catch (error) {
    console.error("Error fetching short novel details:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch short novel details",
      },
      { status: 500 }
    );
  }
}
