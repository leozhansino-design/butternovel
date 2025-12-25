import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// CORS headers for mobile app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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

    // Fetch short novels with first chapter content for preview
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
          // Include first chapter for longer preview
          chapters: {
            select: {
              content: true,
            },
            orderBy: {
              chapterNumber: "asc",
            },
            take: 1,
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

    // Transform data to include extended preview (up to 3000 chars)
    const transformedShorts = shorts.map((short) => {
      const firstChapterContent = short.chapters?.[0]?.content || "";
      const extendedPreview =
        firstChapterContent.length > 3000
          ? firstChapterContent.substring(0, 3000)
          : firstChapterContent;

      return {
        ...short,
        // Use first chapter content as extended preview, fallback to readingPreview
        readingPreview: extendedPreview || short.readingPreview || short.blurb,
        chapters: undefined, // Don't send raw chapters to reduce payload
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: transformedShorts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching shorts for mobile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch short novels",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
