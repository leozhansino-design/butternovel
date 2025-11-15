/**
 * Set Official Account Flag for ButterPicks
 *
 * This script marks the admin@butternovel.com account as an official account
 * Run with: npx tsx scripts/set-official-account.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking for admin@butternovel.com account...\n')

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: 'admin@butternovel.com' },
    select: {
      id: true,
      email: true,
      name: true,
      isOfficial: true,
      role: true,
    }
  })

  if (!user) {
    console.log('❌ User not found with email admin@butternovel.com')
    console.log('   Please create the account first')
    return
  }

  console.log('✅ Found user:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Name: ${user.name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   Is Official: ${user.isOfficial}\n`)

  if (user.isOfficial) {
    console.log('✅ Account is already marked as official!')
    console.log('   No changes needed.')
    return
  }

  // Update the user
  console.log('🔄 Updating account to official...\n')

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      isOfficial: true,
      role: 'ADMIN', // Also ensure role is ADMIN
      name: user.name || 'ButterPicks', // Ensure name is set
    },
    select: {
      id: true,
      email: true,
      name: true,
      isOfficial: true,
      role: true,
    }
  })

  console.log('✅ Successfully updated account!')
  console.log(`   ID: ${updated.id}`)
  console.log(`   Name: ${updated.name}`)
  console.log(`   Email: ${updated.email}`)
  console.log(`   Role: ${updated.role}`)
  console.log(`   Is Official: ${updated.isOfficial}`)
  console.log('\n🎉 Done! ButterPicks is now an official account.')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
