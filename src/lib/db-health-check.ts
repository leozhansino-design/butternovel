// src/lib/db-health-check.ts
// 🔧 Database health check and configuration diagnostics

import { prisma } from './prisma'

/**
 * Check database connection health and configuration
 *
 * Run this to diagnose connection pool issues:
 * ```bash
 * npm run db:health
 * ```
 */
export async function checkDatabaseHealth() {
  console.log('🔍 Checking database health...\n')

  // 1. Check DATABASE_URL configuration
  const dbUrl = process.env.DATABASE_URL || ''
  const url = new URL(dbUrl.replace(/^["']|["']$/g, ''))

  console.log('📊 DATABASE_URL Configuration:')
  console.log('  Host:', url.hostname)
  console.log('  Port:', url.port || '5432')
  console.log('  Database:', url.pathname.slice(1))

  const params = Object.fromEntries(url.searchParams.entries())
  console.log('  Parameters:', params)

  // 2. Check for critical parameters
  console.log('\n✅ Critical Parameters Check:')
  const hasConnectionLimit = params.connection_limit !== undefined
  const hasPgBouncer = params.pgbouncer === 'true'
  const hasPoolTimeout = params.pool_timeout !== undefined

  if (hasConnectionLimit) {
    console.log(`  ✓ connection_limit: ${params.connection_limit}`)
  } else {
    console.warn('  ✗ connection_limit: NOT SET (should be 1)')
  }

  if (hasPgBouncer) {
    console.log(`  ✓ pgbouncer: ${params.pgbouncer}`)
  } else {
    console.warn('  ✗ pgbouncer: NOT SET (should be true for serverless)')
  }

  if (hasPoolTimeout) {
    console.log(`  ✓ pool_timeout: ${params.pool_timeout}s`)
  } else {
    console.warn('  ✗ pool_timeout: NOT SET (should be 10)')
  }

  // 3. Check if using connection pooler
  console.log('\n🔌 Connection Pooler Detection:')
  const isSupabasePooler = url.port === '6543' || url.hostname.includes('pooler')
  const isNeonPooler = url.hostname.includes('pooler.neon')
  const isPgBouncerPort = url.port === '6432'

  if (isSupabasePooler) {
    console.log('  ✓ Detected: Supabase Pooler (Transaction Mode)')
  } else if (isNeonPooler) {
    console.log('  ✓ Detected: Neon Serverless Pooler')
  } else if (isPgBouncerPort) {
    console.log('  ✓ Detected: PgBouncer (port 6432)')
  } else {
    console.warn('  ⚠️  No connection pooler detected')
    console.warn('     Consider using Supabase pooler (port 6543) for serverless')
  }

  // 4. Test database connection
  console.log('\n🔗 Testing Database Connection:')
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const duration = Date.now() - start
    console.log(`  ✓ Connection successful (${duration}ms)`)
  } catch (error: any) {
    console.error('  ✗ Connection failed:', error.message)
    return false
  }

  // 5. Check connection pool status
  console.log('\n📈 Checking Connection Pool:')
  try {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `
    const activeConnections = Number(result[0].count)
    console.log(`  Active connections: ${activeConnections}`)

    // Get max connections
    const maxResult = await prisma.$queryRaw<Array<{ max_connections: string }>>`
      SHOW max_connections
    `
    const maxConnections = parseInt(maxResult[0].max_connections)
    console.log(`  Max connections: ${maxConnections}`)
    console.log(`  Usage: ${((activeConnections / maxConnections) * 100).toFixed(1)}%`)

    if (activeConnections / maxConnections > 0.8) {
      console.warn('  ⚠️  WARNING: Connection pool > 80% full!')
    }
  } catch (error: any) {
    console.warn('  ⚠️  Could not check connection pool:', error.message)
  }

  // 6. Recommendations
  console.log('\n💡 Recommendations:')

  if (!hasPgBouncer) {
    console.log('  1. Add pgbouncer=true to DATABASE_URL')
  }

  if (!isSupabasePooler && !isNeonPooler && !isPgBouncerPort) {
    console.log('  2. Use a connection pooler:')
    console.log('     - Supabase: Use pooler URL (port 6543)')
    console.log('     - Neon: Use pooler endpoint')
    console.log('     - Self-hosted: Set up PgBouncer')
  }

  if (params.connection_limit !== '1') {
    console.log('  3. Set connection_limit=1 for serverless')
  }

  console.log('\n✅ Health check complete!\n')
  return true
}

// Allow running as standalone script
if (require.main === module) {
  checkDatabaseHealth()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Health check failed:', error)
      process.exit(1)
    })
}
