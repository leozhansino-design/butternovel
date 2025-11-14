/**
 * Script to check and update novel authorIds
 * Run with: npx tsx scripts/check-author-ids.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAuthorIds() {
  try {
    console.log('🔍 Checking novel authorIds...\n')

    // Get all novels
    const novels = await prisma.novel.findMany({
      select: {
        id: true,
        title: true,
        authorId: true,
        authorName: true
      }
    })

    console.log(`Found ${novels.length} novels\n`)

    const issues: string[] = []

    // Check each novel's authorId
    for (const novel of novels) {
      // Check if authorId is a valid user ID
      const user = await prisma.user.findUnique({
        where: { id: novel.authorId },
        select: { id: true, name: true, email: true }
      })

      if (!user) {
        issues.push(`❌ Novel "${novel.title}" (ID: ${novel.id}) has invalid authorId: "${novel.authorId}"`)
        console.log(`❌ Novel "${novel.title}" (ID: ${novel.id})`)
        console.log(`   Author ID: ${novel.authorId}`)
        console.log(`   Author Name: ${novel.authorName}`)
        console.log(`   Status: User not found in database\n`)
      } else {
        console.log(`✅ Novel "${novel.title}" (ID: ${novel.id})`)
        console.log(`   Author: ${user.name} (${user.email})`)
        console.log(`   Author ID: ${user.id}\n`)
      }
    }

    if (issues.length > 0) {
      console.log('\n⚠️  Issues found:')
      issues.forEach(issue => console.log(issue))
      console.log('\n💡 To fix: Find the correct user ID for butterpicks and run the update script')
    } else {
      console.log('\n✅ All novels have valid author IDs!')
    }

    // List all users with their IDs for reference
    console.log('\n📋 Available users:')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    users.forEach(user => {
      console.log(`   ${user.name || 'No name'} (${user.email}) - ID: ${user.id} - Role: ${user.role}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkAuthorIds()
  .then(() => {
    console.log('\n✨ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
