# Admin Account Setup Guide

## Setting Admin Role for ButterPicks

To set the admin role for the `butterpicks@gmail.com` account, you have two options:

### Option 1: Using the npm script (Recommended)

```bash
npm run db:set-admin
```

### Option 2: Using Prisma Studio (GUI)

1. Run Prisma Studio:
   ```bash
   npm run db:studio
   ```

2. Open the User table

3. Find the user with email `butterpicks@gmail.com`

4. Change the `role` field from `"USER"` to `"ADMIN"`

5. Click "Save 1 change"

### Option 3: Direct SQL (If other methods don't work)

Connect to your PostgreSQL database and run:

```sql
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'butterpicks@gmail.com';
```

## Verify the Change

After updating the role, the butterpicks profile should:
- Show "Official Account" badge instead of stats
- Only display the "Novels" tab
- Not show Follow button
- Not be followable by other users

## Admin Features

Accounts with `role != 'USER'` (ADMIN, MODERATOR, etc.) have a special profile view:

- **Tabs**: Only "Novels" tab is shown (no Library, History, or Reviews)
- **Stats**: Shows "Official Account" badge instead of user stats
- **Social**: Cannot be followed by users
- **Display**: No follower/following counts

## Troubleshooting

### If the butterpicks account doesn't exist

First create the account by:
1. Signing in with Google using `butterpicks@gmail.com`
2. Then run the admin setup script or SQL

### If you see "user not found" errors

Make sure the `butterpicks@gmail.com` account exists in the User table and has a valid `id`.

## Google Avatar Issues

If Google user avatars are not displaying correctly:

1. **Check Database**: Verify the `avatar` field in the User table contains the Google photo URL
   ```sql
   SELECT email, avatar FROM "User" WHERE email = 'your-google-email@gmail.com';
   ```

2. **Re-authenticate**: Sign out and sign back in with Google to refresh the avatar

3. **Image Component**: The UserBadge component now:
   - Has error handling for failed image loads
   - Falls back to initials if image fails
   - Uses `unoptimized` flag for Google images

4. **Check Console**: Look for image loading errors in browser console

## Notes

- Only butterpicks and other officially designated admin accounts should have non-USER roles
- All other users (including Google users) should remain as regular users with role="USER"
- Regular users see all tabs (Novels, Library, History, Reviews) on their profiles
- Privacy settings for Library still work for regular users
