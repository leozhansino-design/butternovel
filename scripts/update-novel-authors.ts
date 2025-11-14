/**
 * Script to update novel authorIds to match actual user IDs
 * Run with: npx tsx scripts/update-novel-authors.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateNovelAuthors() {
  try {
    console.log('🔧 Updating novel author IDs...\n')

    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@butternovel.com' },
      select: { id: true, name: true, email: true, role: true }
    })

    let targetUser = adminUser

    if (!adminUser) {
      console.error('❌ Admin user not found!')
      console.log('Please make sure admin@butternovel.com account exists')
      console.log('\nTrying to find any admin user...')

      // Try to find any user with ADMIN role
      const anyAdmin = await prisma.user.findFirst({
        where: {
          OR: [
            { role: { not: 'USER' } },
            { email: { contains: 'admin' } }
          ]
        },
        select: { id: true, name: true, email: true, role: true }
      })

      if (anyAdmin) {
        console.log('\n📋 Found alternative admin user:')
        console.log(`   ID: ${anyAdmin.id}`)
        console.log(`   Name: ${anyAdmin.name}`)
        console.log(`   Email: ${anyAdmin.email}`)
        console.log(`   Role: ${anyAdmin.role}`)
        console.log('\n⚠️  Using this user instead')
        targetUser = anyAdmin
      } else {
        console.log('\n❌ No admin users found at all!')
        console.log('Please create an admin user first or check the email address')
        return
      }
    }

    console.log('📋 Found admin user:')
    console.log(`   ID: ${targetUser.id}`)
    console.log(`   Name: ${targetUser.name}`)
    console.log(`   Email: ${targetUser.email}`)
    console.log(`   Role: ${targetUser.role}\n`)

    // Get all novels with invalid authorIds
    const novels = await prisma.novel.findMany({
      select: {
        id: true,
        title: true,
        authorId: true,
        authorName: true
      }
    })

    let updatedCount = 0
    const needsUpdate: number[] = []

    for (const novel of novels) {
      // Check if authorId is valid
      const userExists = await prisma.user.findUnique({
        where: { id: novel.authorId }
      })

      if (!userExists) {
        needsUpdate.push(novel.id)
        console.log(`⚠️  Novel "${novel.title}" has invalid authorId: ${novel.authorId}`)
      }
    }

    if (needsUpdate.length === 0) {
      console.log('\n✅ All novels already have valid author IDs!')
      return
    }

    console.log(`\n📝 Found ${needsUpdate.length} novels that need updating`)
    console.log(`Will update all to authorId: ${targetUser.id}\n`)

    // Ask for confirmation (in script, we'll just proceed)
    console.log('Updating novels...\n')

    // Update all novels with invalid authorIds
    const result = await prisma.novel.updateMany({
      where: {
        id: {
          in: needsUpdate
        }
      },
      data: {
        authorId: targetUser.id,
        authorName: targetUser.name || 'Admin'
      }
    })

    updatedCount = result.count

    console.log(`✅ Successfully updated ${updatedCount} novels!`)
    console.log(`   All novels now have authorId: ${targetUser.id}`)
    console.log(`   Author name: ${targetUser.name || 'Admin'}\n`)

    // Verify the update
    console.log('🔍 Verifying updates...')
    const remainingIssues = await prisma.novel.findMany({
      where: {
        authorId: {
          not: targetUser.id
        }
      },
      select: {
        id: true,
        title: true,
        authorId: true
      }
    })

    // Check if remaining novels have valid authorIds
    let invalidCount = 0
    for (const novel of remainingIssues) {
      const userExists = await prisma.user.findUnique({
        where: { id: novel.authorId }
      })
      if (!userExists) {
        invalidCount++
        console.log(`   ⚠️  Novel "${novel.title}" still has invalid authorId`)
      }
    }

    if (invalidCount === 0) {
      console.log('   ✅ All novels now have valid author IDs!\n')
    } else {
      console.log(`   ⚠️  ${invalidCount} novels still have invalid author IDs\n`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateNovelAuthors()
  .then(() => {
    console.log('✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
