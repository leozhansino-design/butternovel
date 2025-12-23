import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/mobile/shorts - Get list of short novels for mobile app
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const genre = searchParams.get("genre");

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      isShortNovel: true,
      isPublished: true,
      isBanned: false,
      ...(genre && { shortNovelGenre: genre }),
    };

    // Fetch short novels
    const [shorts, total] = await Promise.all([
      prisma.novel.findMany({
        where,
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
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [
          { likeCount: "desc" },
          { viewCount: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.novel.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: shorts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching shorts for mobile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch short novels",
      },
      { status: 500 }
    );
  }
}
