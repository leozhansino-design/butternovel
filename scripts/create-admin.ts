// scripts/create-admin.ts
// Script to create the first admin account
// Run with: npx tsx scripts/create-admin.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function createAdmin() {
  console.log('\n🔐 Admin Account Creation\n')

  const email = await question('Admin Email: ')
  const name = await question('Admin Name: ')
  const password = await question('Admin Password: ')
  const confirmPassword = await question('Confirm Password: ')

  if (password !== confirmPassword) {
    console.error('❌ Passwords do not match!')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long!')
    process.exit(1)
  }

  try {
    // Check if admin already exists
    const existing = await prisma.admin.findUnique({
      where: { email }
    })

    if (existing) {
      console.error(`❌ Admin with email ${email} already exists!`)
      process.exit(1)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'super_admin'
      }
    })

    console.log('\n✅ Admin account created successfully!')
    console.log(`   Email: ${admin.email}`)
    console.log(`   Name: ${admin.name}`)
    console.log(`   Role: ${admin.role}\n`)

  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    rl.close()
  }
}

createAdmin()
