import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // ✅ 从数据库查找管理员（不再使用硬编码）
    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
      }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, admin.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // ✅ 创建 JWT Token - 移除默认值，强制要求环境变量
    const jwtSecret = process.env.ADMIN_JWT_SECRET
    if (!jwtSecret) {
      console.error('ADMIN_JWT_SECRET is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const secret = new TextEncoder().encode(jwtSecret)

    const token = await new SignJWT({
      email: admin.email,
      name: admin.name,
      role: admin.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // 7天过期
      .sign(secret)

    // 设置 Cookie
    const response = NextResponse.json({ 
      success: true,
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}