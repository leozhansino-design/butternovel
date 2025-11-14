# Follow System Deployment Guide

This guide explains how to deploy the new Follow system to your database.

## What's New

The Follow system allows users to:
- Follow/unfollow other users
- View their following and followers lists
- Click on Following/Followers stats to see the lists
- Navigate to other users' profiles from the lists
- See real-time following/followers counts

## Database Changes

A new `Follow` model has been added to the Prisma schema:

```prisma
model Follow {
  id String @id @default(cuid())

  followerId  String
  follower    User   @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)

  followingId String
  following   User   @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

The `User` model has been updated with:
- `following Follow[] @relation("UserFollowing")`
- `followers Follow[] @relation("UserFollowers")`

## Deployment Steps

### 1. Run Database Migration

In your project directory, run:

```bash
# Generate and apply the migration
npx prisma migrate dev --name add_follow_system

# Or for production
npx prisma migrate deploy
```

Alternatively, if you want to push the schema without creating a migration file:

```bash
npx prisma db push
```

### 2. Regenerate Prisma Client

The migration command automatically regenerates the Prisma Client. If needed, you can manually regenerate:

```bash
npx prisma generate
```

### 3. Verify the Changes

Check that the Follow table was created:

```bash
# Connect to your database and run
SELECT * FROM "Follow";
```

### 4. Restart Your Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

The following new API endpoints have been added:

### Follow a User
```
POST /api/user/follow
Body: { userId: string }
```

### Unfollow a User
```
DELETE /api/user/follow
Body: { userId: string }
```

### Check Follow Status
```
GET /api/user/follow-status?userId={userId}
Response: { isFollowing: boolean }
```

### Get Following List
```
GET /api/user/{userId}/following
Response: { following: User[] }
```

### Get Followers List
```
GET /api/user/{userId}/followers
Response: { followers: User[] }
```

## Features

### Public Profile Pages
- View any user's profile at `/profile/{userId}`
- Follow/unfollow button (only shown for other users' profiles)
- Click on Following/Followers stats to view lists
- Navigate to other profiles from the lists

### Library Modal
- Click on Following/Followers in your own profile
- View and navigate to profiles from the lists

### Stats
- Books Read: Counts unique novels from ReadingHistory
- Following: Number of users you follow
- Followers: Number of users following you
- Reviews: Total number of ratings

## Testing

1. **Test Follow/Unfollow**:
   - Visit another user's profile page
   - Click the "Follow" button
   - Verify the followers count increases
   - Click "Following" to unfollow
   - Verify the followers count decreases

2. **Test Following/Followers Lists**:
   - Click on "Following" or "Followers" stats
   - Verify the modal shows correct users
   - Click on a user in the list
   - Verify you navigate to their profile

3. **Test Navigation**:
   - From your profile modal, click Following
   - Click on a user to visit their profile
   - Follow them
   - Go back to your profile and verify Following count increased

## Troubleshooting

### Migration Failed
If the migration fails with a connection error, check your `.env` file:
```
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"
```

### TypeScript Errors
If you see TypeScript errors after migration, restart your development server:
```bash
# Kill the dev server and restart
npm run dev
```

### Prisma Client Out of Sync
If you see "Prisma Client out of sync" errors:
```bash
npx prisma generate
```

## Rollback (if needed)

If you need to rollback the migration:

1. Find the migration name:
```bash
ls -la prisma/migrations/
```

2. Revert the migration:
```bash
npx prisma migrate resolve --rolled-back {migration_name}
```

3. Manually drop the Follow table:
```sql
DROP TABLE "Follow";
```

4. Update the schema to remove Follow model and relations
5. Run `npx prisma generate`
