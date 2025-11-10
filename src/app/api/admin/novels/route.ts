import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { uploadNovelCover, deleteImage } from '@/lib/cloudinary'

// POST /api/admin/novels - 创建小说
export async function POST(request: Request) {
    try {
        console.log('📝 [API] Received upload request')

        // 1. 验证管理员权限
        const session = await getAdminSession()
        if (!session) {
            console.log('❌ [API] Unauthorized - No session')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
        console.log('✅ [API] Session verified:', session.email)

        // 2. 获取表单数据
        const body = await request.json()
        console.log('📦 [API] Request body:', JSON.stringify(body, null, 2))

        const {
            title,
            coverImage,
            categoryId,
            blurb,
            status,
            isPublished,
            chapters
        } = body

        // 3. 验证必填字段
        if (!title || !coverImage || !categoryId || !blurb) {
            console.log('❌ [API] Missing required fields')
            return NextResponse.json(
                { error: 'Missing required fields: title, coverImage, categoryId, blurb' },
                { status: 400 }
            )
        }

        // ⭐ 新增：获取 AdminProfile 的 displayName
        console.log('👤 [API] Fetching admin profile...')
        const adminProfile = await prisma.adminProfile.findUnique({
            where: { email: session.email },
        })

        const authorName = adminProfile?.displayName || 'Admin'
        console.log('✅ [API] Author name:', authorName)

        // 4. 上传封面到 Cloudinary
        console.log('📤 [API] Uploading cover to Cloudinary...')
        let coverResult
        try {
            coverResult = await uploadNovelCover(coverImage, title)
            console.log('✅ [API] Cover uploaded to Cloudinary:', coverResult.url)
        } catch (uploadError: any) {
            console.error('❌ [API] Cloudinary upload failed:', uploadError)
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

        console.log('🔗 [API] Generated slug:', slug)

        // 6. 计算总字数
        const wordCount = chapters?.reduce((total: number, ch: any) => {
            return total + (ch.content?.length || 0)
        }, 0) || 0

        console.log('📊 [API] Total word count:', wordCount)

        // 7. 创建小说（包含章节）
        console.log('💾 [API] Creating novel in database...')

        const novel = await prisma.novel.create({
            data: {
                title,
                slug,
                coverImage: coverResult.url,
                coverImagePublicId: coverResult.publicId,
                categoryId: parseInt(categoryId),
                blurb,
                status: status || 'ONGOING',
                isPublished: isPublished || false,
                isDraft: !isPublished,
                // ⭐ 改这里：使用 AdminProfile 的 displayName
                authorName: authorName,
                authorId: session.email, // 用 email 作为 authorId
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
        })

        console.log('✅ [API] Novel created successfully!')
        console.log('📚 [API] Novel ID:', novel.id)

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
        console.error('❌ [API] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET /api/admin/novels - 获取所有小说
export async function GET(request: Request) {
    try {
        const session = await getAdminSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const search = url.searchParams.get('search') || ''
        const categoryId = url.searchParams.get('categoryId') || ''
        const status = url.searchParams.get('status') || ''
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = 10

        const where: any = {}

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { authorName: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (categoryId) {
            where.categoryId = parseInt(categoryId)
        }

        if (status) {
            where.status = status
        }

        const total = await prisma.novel.count({ where })
        const novels = await prisma.novel.findMany({
            where,
            include: { category: true },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        })

        return NextResponse.json({
            novels,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        })

    } catch (error: any) {
        console.error('❌ [API] GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch novels' },
            { status: 500 }
        )
    }
}