/**
 * Diagnostic script to check user and novel data
 * Run with: npx tsx scripts/diagnose-profile-404.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnose() {
  try {
    console.log('🔍 Diagnosing Profile 404 Issues\n')
    console.log('=' .repeat(60))

    // 1. Check all users
    console.log('\n📋 ALL USERS IN DATABASE:')
    console.log('-'.repeat(60))
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (users.length === 0) {
      console.log('   ⚠️  No users found in database!')
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name || 'No Name'}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Created: ${user.createdAt.toISOString()}`)
      })
    }

    // 2. Check admin user specifically
    console.log('\n\n📋 ADMIN USER (admin@butternovel.com):')
    console.log('-'.repeat(60))
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@butternovel.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    if (adminUser) {
      console.log(`   ✅ Found admin user`)
      console.log(`   ID: ${adminUser.id}`)
      console.log(`   Name: ${adminUser.name}`)
      console.log(`   Email: ${adminUser.email}`)
      console.log(`   Role: ${adminUser.role}`)
    } else {
      console.log('   ❌ Admin user not found!')
    }

    // 3. Check all novels and their authorIds
    console.log('\n\n📚 ALL NOVELS AND THEIR AUTHORS:')
    console.log('-'.repeat(60))
    const novels = await prisma.novel.findMany({
      select: {
        id: true,
        title: true,
        authorId: true,
        authorName: true
      },
      take: 10
    })

    if (novels.length === 0) {
      console.log('   ⚠️  No novels found in database!')
    } else {
      for (const novel of novels) {
        console.log(`\n📖 "${novel.title}" (ID: ${novel.id})`)
        console.log(`   Author ID: ${novel.authorId}`)
        console.log(`   Author Name: ${novel.authorName}`)

        // Check if authorId is valid
        const author = await prisma.user.findUnique({
          where: { id: novel.authorId },
          select: {
            id: true,
            name: true,
            email: true
          }
        })

        if (author) {
          console.log(`   ✅ Valid Author: ${author.name} (${author.email})`)
          if (author.name !== novel.authorName) {
            console.log(`   ⚠️  Name mismatch! DB has "${author.name}" but novel has "${novel.authorName}"`)
          }
        } else {
          console.log(`   ❌ INVALID Author ID - User not found in database!`)
          console.log(`   🔧 This novel needs to be fixed!`)
        }
      }
    }

    // 4. Check for novels with invalid authorIds
    console.log('\n\n⚠️  NOVELS WITH INVALID AUTHOR IDS:')
    console.log('-'.repeat(60))

    let invalidCount = 0
    for (const novel of novels) {
      const userExists = await prisma.user.findUnique({
        where: { id: novel.authorId }
      })
      if (!userExists) {
        invalidCount++
        console.log(`   ❌ Novel "${novel.title}" - authorId: ${novel.authorId}`)
      }
    }

    if (invalidCount === 0) {
      console.log('   ✅ All novels have valid author IDs!')
    } else {
      console.log(`\n   ⚠️  Found ${invalidCount} novels with invalid author IDs`)
      console.log(`   💡 Run: npm run db:fix-authors`)
    }

    // 5. Summary
    console.log('\n\n📊 SUMMARY:')
    console.log('='.repeat(60))
    console.log(`   Total Users: ${users.length}`)
    console.log(`   Total Novels: ${novels.length}`)
    console.log(`   Invalid Author IDs: ${invalidCount}`)
    console.log(`   Admin User Exists: ${adminUser ? 'Yes' : 'No'}`)

    if (invalidCount > 0) {
      console.log('\n💡 RECOMMENDED ACTIONS:')
      console.log('   1. Run: npm run db:fix-authors')
      console.log('   2. Or manually update novels in Prisma Studio')
      console.log('   3. Make sure admin@butternovel.com user exists')
    }

  } catch (error) {
    console.error('\n❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

diagnose()
  .then(() => {
    console.log('\n\n✨ Diagnosis complete\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nDiagnosis failed:', error)
    process.exit(1)
  })
