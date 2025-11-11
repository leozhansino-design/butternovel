// src/lib/validate-env.ts
// ✅ 修复: 启动时验证所有必需的环境变量

const requiredEnvVars = {
  // 数据库
  DATABASE_URL: process.env.DATABASE_URL,
  
  // NextAuth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  // Admin
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET,
}

export function validateEnv() {
  const missing: string[] = []
  
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      missing.push(key)
    }
  })
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(key => {
      console.error(`   - ${key}`)
    })
    console.error('\n💡 Add them to your .env.local file')
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
  
  console.log('✅ All required environment variables are set')
}

// 自动验证（只在服务端）
if (typeof window === 'undefined') {
  validateEnv()
}