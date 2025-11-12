#!/usr/bin/env node

/**
 * 快速迁移脚本 - 添加评分系统和标签功能
 * 使用方法：node quick-migrate.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function main() {
  console.log('🔄 开始应用数据库迁移...\n')

  // 检查环境变量
  if (!process.env.DATABASE_URL) {
    console.error('❌ 错误：DATABASE_URL 环境变量未设置')
    console.log('\n请设置 DATABASE_URL 后再运行：')
    console.log('  export DATABASE_URL="postgresql://..."')
    console.log('  node quick-migrate.js')
    console.log('\n或者参考 MIGRATION_GUIDE.md 手动执行 SQL\n')
    process.exit(1)
  }

  const prisma = new PrismaClient()

  try {
    // 读取迁移 SQL
    const migrationPath = path.join(__dirname, 'prisma/migrations/20251112_add_rating_and_tags/migration.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📝 执行迁移 SQL...')

    // 分割并执行每条 SQL 语句
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`   [${i + 1}/${statements.length}] 执行中...`)

      try {
        await prisma.$executeRawUnsafe(statement)
      } catch (err) {
        // 忽略 "already exists" 错误
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log(`   ⚠️  跳过（已存在）`)
        } else {
          throw err
        }
      }
    }

    console.log('\n✅ 迁移成功完成！\n')
    console.log('📋 已添加的功能：')
    console.log('  ✓ Novel.averageRating - 平均评分')
    console.log('  ✓ Novel.totalRatings - 评分总数')
    console.log('  ✓ Novel.tags - 标签数组')
    console.log('  ✓ Rating 表 - 用户评分和评论\n')

    // 验证迁移
    console.log('🔍 验证迁移结果...')

    const novelCheck = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Novel'
      AND column_name IN ('averageRating', 'totalRatings', 'tags')
    `

    const ratingCheck = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'Rating'
    `

    if (novelCheck.length === 3 && ratingCheck.length === 1) {
      console.log('✅ 所有字段和表已成功创建\n')
      console.log('🎉 迁移验证通过！应用已准备就绪。\n')
      console.log('💡 提示：')
      console.log('  - 重启开发服务器：npm run dev')
      console.log('  - 查看数据库：npx prisma studio\n')
    } else {
      console.log('⚠️  警告：部分字段可能未创建，请检查数据库\n')
    }

  } catch (error) {
    console.error('\n❌ 迁移失败：', error.message)
    console.log('\n💡 如果遇到权限或连接问题，请尝试：')
    console.log('  1. 手动执行 SQL（参考 MIGRATION_GUIDE.md）')
    console.log('  2. 使用 Prisma Migrate：npx prisma migrate deploy\n')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
