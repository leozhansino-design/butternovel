import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding categories...')

  const categories = [
    { name: 'Fantasy', slug: 'fantasy', order: 1 },
    { name: 'Urban', slug: 'urban', order: 2 },
    { name: 'Romance', slug: 'romance', order: 3 },
    { name: 'Sci-Fi', slug: 'sci-fi', order: 4 },
    { name: 'Mystery', slug: 'mystery', order: 5 },
    { name: 'Action', slug: 'action', order: 6 },
    { name: 'Adventure', slug: 'adventure', order: 7 },
    { name: 'Horror', slug: 'horror', order: 8 },
  ]

  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
    console.log(`✅ ${result.name}`)
  }

  console.log('🎉 Done!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })