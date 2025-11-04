import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'

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

        // 4. 生成 slug（URL友好的标题）
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-') // 支持中文
            .replace(/(^-|-$)/g, '') + '-' + Date.now()

        console.log('🔗 [API] Generated slug:', slug)

        // 5. 计算总字数
        const wordCount = chapters?.reduce((total: number, ch: any) => {
            return total + (ch.content?.length || 0)
        }, 0) || 0

        console.log('📊 [API] Total word count:', wordCount)

        // 6. 创建小说（包含章节）
        console.log('💾 [API] Creating novel in database...')

        const novel = await prisma.novel.create({
            data: {
                title,
                slug,
                coverImage,
                categoryId: parseInt(categoryId),
                blurb,
                status: status || 'ONGOING',
                isPublished: isPublished || false,
                isDraft: !isPublished,
                authorId: 'cabbas3241000p4604q7h7ft8',  // ⭐ 改这里
                authorName: session.name || 'Admin',
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
        console.log('📚 [API] Novel Title:', novel.title)
        console.log('📚 [API] Chapters:', novel.chapters.length)

        return NextResponse.json({
            success: true,
            novel: {
                id: novel.id,
                title: novel.title,
                slug: novel.slug,
                totalChapters: novel.totalChapters,
                wordCount: novel.wordCount,
            }
        })

    } catch (error: any) {
        console.error('❌ [API] Error creating novel:', error)
        console.error('❌ [API] Error stack:', error.stack)

        return NextResponse.json(
            { error: error.message || 'Failed to create novel' },
            { status: 500 }
        )
    }
}

// GET /api/admin/novels - 获取所有小说
export async function GET(request: Request) {
    try {
        const session = await getAdminSession()
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const novels = await prisma.novel.findMany({
            include: {
                category: true,
                _count: {
                    select: {
                        chapters: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            novels,
            total: novels.length
        })

    } catch (error: any) {
        console.error('Error fetching novels:', error)
        return NextResponse.json(
            { error: 'Failed to fetch novels' },
            { status: 500 }
        )
    }
}