import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

// 管理员账号配置
const ADMIN_ACCOUNTS = [
  {
    email: 'admin@butternovel.com',
    // 你生成的密码哈希 - 密码: mySecretPassword123
    password: '$2b$10$97gcStAx/C8eaoM25YTwo.tP9v9kkz1XXp0ouI.fad0Uq9WtpMsK2',
    name: 'Admin',
    role: 'super_admin'
  },
]

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 查找管理员
    const admin = ADMIN_ACCOUNTS.find(a => a.email === email)
    
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

    // 创建 JWT Token
    const secret = new TextEncoder().encode(
      process.env.ADMIN_JWT_SECRET || 'butternovel-super-secret-key-min-32-characters-long-change-in-production'
    )

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