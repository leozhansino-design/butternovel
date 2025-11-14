/**
 * Script to update novel authorIds to match actual user IDs
 * Run with: npx tsx scripts/update-novel-authors.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateNovelAuthors() {
  try {
    console.log('🔧 Updating novel author IDs...\n')

    // Find butterpicks user
    const butterpicksUser = await prisma.user.findUnique({
      where: { email: 'butterpicks@gmail.com' },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!butterpicksUser) {
      console.error('❌ Butterpicks user not found!')
      console.log('Please make sure butterpicks@gmail.com account exists')
      return
    }

    console.log('📋 Found butterpicks user:')
    console.log(`   ID: ${butterpicksUser.id}`)
    console.log(`   Name: ${butterpicksUser.name}`)
    console.log(`   Email: ${butterpicksUser.email}`)
    console.log(`   Role: ${butterpicksUser.role}\n`)

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
    console.log(`Will update all to authorId: ${butterpicksUser.id}\n`)

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
        authorId: butterpicksUser.id,
        authorName: butterpicksUser.name || 'ButterPicks'
      }
    })

    updatedCount = result.count

    console.log(`✅ Successfully updated ${updatedCount} novels!`)
    console.log(`   All novels now have authorId: ${butterpicksUser.id}`)
    console.log(`   Author name: ${butterpicksUser.name || 'ButterPicks'}\n`)

    // Verify the update
    console.log('🔍 Verifying updates...')
    const remainingIssues = await prisma.novel.findMany({
      where: {
        authorId: {
          not: butterpicksUser.id
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
