# Database Initialization Guide

## Problem: Google Sign-In Server Error

**Cause**: Database tables don't exist yet in your Supabase database.

**Solution**: Initialize the database schema.

---

## Quick Fix

### Option 1: Initialize from Vercel (Recommended)

1. **Deploy to Vercel** (if not already deployed)
2. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
3. **Verify DATABASE_URL is set**:
```
DATABASE_URL=postgresql://postgres.shmwmmlmxxnbqohlrfce:5gB%3F8G%25jCmp%26qTX@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require
```

4. **Run database initialization** (in your local terminal):
```bash
# Set environment variable locally (temporary)
export DATABASE_URL="postgresql://postgres.shmwmmlmxxnbqohlrfce:5gB%3F8G%25jCmp%26qTX@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

# Push schema to Supabase
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

5. **Redeploy** Vercel (if needed)

---

### Option 2: Use Supabase Dashboard

1. **Go to** [Supabase Dashboard](https://app.supabase.com)
2. **Select your project**
3. **Go to** SQL Editor
4. **Run this script** to create all tables:

```sql
-- Run the schema creation
-- (Generated from prisma/schema.prisma)

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "avatarPublicId" TEXT,
    "bio" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "googleId" TEXT UNIQUE,
    "facebookId" TEXT UNIQUE,
    "isWriter" BOOLEAN NOT NULL DEFAULT false,
    "writerName" TEXT,
    "writerBio" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "helpedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_isWriter_idx" ON "User"("isWriter");

-- Add other tables from schema.prisma...
-- (See full schema at prisma/schema.prisma)
```

**Easier way**: Just run `npx prisma db push` from your local machine (Option 1).

---

## Verify Database Tables

**Check if tables were created**:

```bash
npx prisma studio
```

This opens a web UI where you can see all your database tables.

**Or check via SQL**:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see tables like:
- User
- Category
- Novel
- Chapter
- NovelLike
- Library
- Rating
- ReadingProgress

---

## Test Google Sign-In Again

1. **Restart your app** (if running locally)
2. **Go to** `/auth/login`
3. **Click** "Sign in with Google"
4. **Should work now!**

---

## Troubleshooting

### Error: "Can't reach database server"

**Solution**: You're in a sandboxed environment. Run `npx prisma db push` from:
- Your local machine
- Vercel deployment environment
- GitHub Codespaces
- Any environment that can connect to Supabase

### Error: "Missing environment variables"

**Solution**: Create `.env` file with:
```bash
DATABASE_URL=postgresql://postgres.shmwmmlmxxnbqohlrfce:5gB%3F8G%25jCmp%26qTX@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<your Google client ID>
GOOGLE_CLIENT_SECRET=<your Google client secret>
```

### Error: "Table 'User' already exists"

**Good news!** Tables already exist. Try signing in again.

---

## What Happens After Initialization?

1. **User signs in with Google**
2. **NextAuth validates OAuth**
3. **System checks if user exists** in `User` table
4. **If new user**: Creates account in database
5. **If existing**: Links Google account
6. **Creates JWT token** and session
7. **Redirects to homepage**

---

## Next Steps

After successful sign-in:

1. **Verify user in database**:
```bash
npx prisma studio
# Check Users table
```

2. **Monitor database queries**:
- Check Vercel logs
- Look for `[Database]` warnings
- Should see 2,000-5,000 queries per 491 visits (not 105,000!)

3. **Add seed data** (optional):
```bash
npx prisma db seed
```

---

## Summary

**Problem**: Database tables not created
**Solution**: Run `npx prisma db push`
**Result**: Google sign-in works, users can register

Now deploy and test! 🚀
