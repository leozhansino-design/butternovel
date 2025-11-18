import { novelCreateSchema, chapterCreateSchema } from '@/lib/validators'

describe('Validators', () => {
  describe('novelCreateSchema', () => {
    it('should validate correct novel data', () => {
      const validData = {
        title: 'Test Novel',
        coverImage: 'https://example.com/image.jpg',
        categoryId: 1,
        blurb: 'This is a test novel description',
        status: 'ONGOING',
        isPublished: true,
        chapters: [],
      }

      const result = novelCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        coverImage: 'https://example.com/image.jpg',
        categoryId: 1,
        blurb: 'Description',
        status: 'ONGOING',
        isPublished: true,
        chapters: [],
      }

      const result = novelCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject title that is too long', () => {
      const invalidData = {
        title: 'A'.repeat(201),
        coverImage: 'https://example.com/image.jpg',
        categoryId: 1,
        blurb: 'Description',
        status: 'ONGOING',
        isPublished: true,
        chapters: [],
      }

      const result = novelCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('chapterCreateSchema', () => {
    it('should validate correct chapter data', () => {
      const validData = {
        novelId: 1,
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'This is the chapter content',
        isPublished: true,
      }

      const result = chapterCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty content', () => {
      const invalidData = {
        novelId: 1,
        chapterNumber: 1,
        title: 'Chapter 1',
        content: '',
        isPublished: true,
      }

      const result = chapterCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
