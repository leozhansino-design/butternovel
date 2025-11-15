import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'
import { uploadNovelCover, deleteImage } from '@/lib/cloudinary'
import { validateWithSchema, novelCreateSchema, countWords } from '@/lib/validators'
import { parsePaginationParams, createPaginationResponse } from '@/lib/pagination'
import { successResponse, handleApiError } from '@/lib/api-response'
import { invalidateNovelRelatedCache } from '@/lib/cache'

// POST /api/admin/novels - 创建小说
export const POST = withAdminAuth(async (session, request: Request) => {
    try {
        // 2. 获取并验证表单数据
        const body = await request.json()

        // ✅ 使用 Zod 验证
        const validation = validateWithSchema(novelCreateSchema, body)
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error, details: validation.details },
                { status: 400 }
            )
        }

        const {
            title,
            coverImage,
            categoryId,
            blurb,
            status,
            isPublished,
            chapters
        } = validation.data

        // ⭐ 新增：获取 AdminProfile 的 displayName
        // 🔄 添加数据库重试机制，解决连接超时问题
        const adminProfile = await withRetry(
            () => prisma.adminProfile.findUnique({
                where: { email: session.email },
            }),
            { operationName: 'Get admin profile' }
        )

        const authorName = adminProfile?.displayName || 'Admin'

        // 🔧 CRITICAL FIX: Get User.id from email
        // Problem: Previously used session.email as authorId, causing 404 and "user not found" errors
        // Solution: Query User table to get the actual user ID
        const user = await withRetry(
            () => prisma.user.findUnique({
                where: { email: session.email },
                select: { id: true }
            }),
            { operationName: 'Get user ID from email' }
        )

        if (!user) {
            return NextResponse.json(
                { error: 'User account not found. Admin must have a user account to create novels.' },
                { status: 404 }
            )
        }

        // 4. 上传封面到 Cloudinary
        let coverResult
        try {
            coverResult = await uploadNovelCover(coverImage, title)
        } catch (uploadError: any) {
            return NextResponse.json(
                { error: `Failed to upload cover to Cloudinary: ${uploadError.message}` },
                { status: 500 }
            )
        }

        // 5. 生成 slug（URL友好的标题）
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
            .replace(/(^-|-$)/g, '') + '-' + Date.now()

        // 6. 计算总字数（字符数）
        const wordCount = chapters?.reduce((total: number, ch: any) => {
            return total + (ch.content?.length || 0)
        }, 0) || 0

        // 7. 创建小说（包含章节）

        // 🔄 添加数据库重试机制，解决连接超时问题
        const novel = await withRetry(
            () => prisma.novel.create({
                data: {
                    title,
                    slug,
                    coverImage: coverResult.url,
                    coverImagePublicId: coverResult.publicId,
                    categoryId,  // ✅ Zod 已经验证为 number 类型，不需要 parseInt
                    blurb,
                    status: status || 'ONGOING',
                    isPublished: isPublished || false,
                    isDraft: !isPublished,
                    // ⭐ FIXED: Use User.id instead of email
                    authorName: authorName,
                    authorId: user.id, // ✅ Use User.id (not email!) - Fixes 404 and follow errors
                    totalChapters: chapters?.length || 0,
                    wordCount,

                    chapters: chapters && chapters.length > 0 ? {
                        create: chapters.map((chapter: any, index: number) => ({
                            title: chapter.title,
                            slug: `chapter-${index + 1}`,
                            content: chapter.content || '',
                            chapterNumber: index + 1,
                            wordCount: chapter.content?.length || 0,
                            isPublished: isPublished || false,
                        }))
                    } : undefined
                },
                include: {
                    category: true,
                    chapters: true,
                }
            }),
            { operationName: 'Create novel in database' }
        )

        // ⚡ 清除缓存：首页、分类页、小说详情
        await invalidateNovelRelatedCache(novel.slug, novel.category?.slug)

        return NextResponse.json({
            success: true,
            message: 'Novel uploaded successfully',
            novel: {
                id: novel.id,
                title: novel.title,
                authorName: novel.authorName,
                totalChapters: novel.totalChapters,
                wordCount: novel.wordCount
            }
        })

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
})

// GET /api/admin/novels - Get all novels with filters
export const GET = withAdminAuth(async (session, request: Request) => {
    try {
        // ✅ Use pagination utility
        const { page, limit, offset } = parsePaginationParams(request.url, {
            defaultLimit: 10,
            maxLimit: 50,
        })

        const url = new URL(request.url)
        const search = url.searchParams.get('search') || ''
        const categoryId = url.searchParams.get('categoryId') || ''
        const status = url.searchParams.get('status') || ''

        const where: any = {}

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { authorName: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (categoryId) {
            const parsed = parseInt(categoryId)
            if (isNaN(parsed)) {
                return NextResponse.json(
                    { error: 'Invalid category ID' },
                    { status: 400 }
                )
            }
            where.categoryId = parsed
        }

        if (status) {
            where.status = status
        }

        // Get novels with retry mechanism
        const total = await withRetry(
            () => prisma.novel.count({ where }),
            { operationName: 'Count novels' }
        )

        const novels = await withRetry(
            () => prisma.novel.findMany({
                where,
                include: { category: true },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit
            }),
            { operationName: 'Get novels list' }
        )

        // ✅ Create standardized pagination response
        const pagination = createPaginationResponse({ page, limit, offset }, total)

        return successResponse({
            novels,
            pagination,
        })

    } catch (error: any) {
        return handleApiError(error, 'Failed to fetch novels')
    }
})