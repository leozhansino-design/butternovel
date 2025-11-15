// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validateWithSchema, registerSchema } from '@/lib/validators'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // ✅ 使用 Zod 验证
    const validation = validateWithSchema(registerSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { name, email, password } = validation.data

    // ⚠️ CRITICAL: Reserve "butterpicks" name for admin/official accounts only
    if (name) {
      const normalizedName = name.trim().toLowerCase()
      const isReservedName = normalizedName === 'butterpicks' || normalizedName.includes('butterpicks')

      if (isReservedName) {
        return NextResponse.json(
          { error: 'This name is reserved for official accounts. Please choose a different name.' },
          { status: 400 }
        )
      }
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name: name ? name.trim() : 'User',
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}