# Author ID Fix Guide

## Problem

If you're seeing these issues:
- Clicking author name shows 404 error
- Follow button shows "user not found"
- Cannot follow/unfollow authors
- After changing user name, profile becomes inaccessible

This means the `authorId` field in the Novel table doesn't match any real user ID in the database.

## Quick Diagnosis

First, run the diagnostic script to see the exact problem:

```bash
npm run db:diagnose
```

This will show you:
- All users in the database with their IDs and emails
- All novels with their author IDs
- Which novels have invalid author IDs
- Name mismatches between User and Novel tables

## Solution

Follow these steps to fix the issue:

### Step 1: Check Current State

Run this command to see which novels have invalid author IDs:

```bash
npm run db:check-authors
```

This will show you:
- Which novels have invalid author IDs
- All available users in the database
- The correct user ID for butterpicks

### Step 2: Fix Author IDs

Run this command to automatically update all invalid author IDs to the admin account:

```bash
npm run db:fix-authors
```

This will:
- Find the admin user (admin@butternovel.com)
- If not found, will look for any user with admin role
- Update all novels with invalid author IDs to use the admin's real user ID
- Update the author name to match the admin account name

### Step 3: Verify the Fix

After running the fix script:

1. Refresh your browser
2. Visit any novel page
3. Try clicking the author name - it should open butterpicks' profile
4. The Follow button should work (unless you're logged in as butterpicks)

## Important Notes

### Self-Follow Prevention

The system automatically prevents users from following themselves:
- If you're logged in as the author, the Follow button won't appear
- This applies to all users, including butterpicks

### Author Name vs User Name

- `authorName` in Novel table: Display name shown on the novel page
- `name` in User table: The user's actual profile name
- After running the fix script, both will be synced to match

## Troubleshooting

### "Admin user not found"

If the fix script says admin user is not found:

1. Make sure you've created the admin account (admin@butternovel.com)
2. Check the User table in Prisma Studio:
   ```bash
   npm run db:studio
   ```
3. Look for a user with email `admin@butternovel.com`
4. The script will automatically try to find any admin user as fallback

### Still seeing 404

If you still see 404 after running the fix:

1. Clear your browser cache
2. Check Redis cache:
   ```bash
   npm run cache:clear
   ```
3. Restart the dev server:
   ```bash
   npm run dev
   ```

### Multiple Authors

If you have novels from different authors in the future:

1. Each author should be a real User account
2. When creating a novel, set `authorId` to the actual user's ID
3. Never use fake or placeholder IDs

## Manual Fix (Alternative)

If the scripts don't work, you can fix manually using Prisma Studio:

1. Open Prisma Studio:
   ```bash
   npm run db:studio
   ```

2. In the User table, find butterpicks and copy the `id`

3. In the Novel table, update all novels:
   - Set `authorId` to the copied ID
   - Set `authorName` to "ButterPicks" (or desired name)

4. Save changes

## Prevention

To prevent this issue in the future:

- Always use valid user IDs when creating novels
- Test the author link before publishing
- Consider adding a foreign key constraint (requires schema migration)
