# Official Account Setup Guide

This document explains how to set up the ButterPicks official account with proper badges and styling.

## Overview

Official accounts (like ButterPicks) have special UI treatment:
- ✅ Blue/gold gradient avatar border with glow effect
- ✅ Verification checkmark badge instead of level number
- ✅ "Official Account" badge displayed below avatar
- ✅ "Official" badge shown inline next to author name on novel pages
- ✅ Simplified profile showing only Followers count (hides Following, Books Read, Library, History tabs)
- ✅ Special blue gradient styling throughout the profile

## Setting the Official Flag

### Option 1: Using the Setup Script (Recommended)

Run the setup script in your production environment:

```bash
npx tsx scripts/set-official-account.ts
```

This script will:
1. Check if admin@butternovel.com exists
2. Display current status
3. Update `isOfficial` to `true` if not already set
4. Ensure role is set to `ADMIN`

### Option 2: Direct Database Update

Run this SQL in your production database:

```sql
-- Mark ButterPicks as official account
UPDATE "User"
SET "isOfficial" = true
WHERE email = 'admin@butternovel.com';

-- Verify the update
SELECT id, email, name, "isOfficial", role
FROM "User"
WHERE email = 'admin@butternovel.com';
```

## Verification Checklist

After setting the flag, verify these features work:

### Novel Detail Page
- [ ] Author name shows "Official" badge inline
- [ ] Clicking author name opens profile modal
- [ ] Profile modal shows official styling (blue/gold borders, checkmark)

### Profile/Modal Display
- [ ] Avatar has blue/gold gradient border and glow effect
- [ ] Checkmark icon appears instead of level number
- [ ] "Official Account" badge shows below avatar (blue gradient)
- [ ] Only shows "Followers" stat (hides Following, Books Read)
- [ ] Only shows "Novels" tab (hides Library, History, Reviews tabs)

### Public Profile Page
- [ ] Same official styling as modal
- [ ] Special blue gradient theme
- [ ] Limited tabs and stats as above

## Troubleshooting

### Badge Not Showing

1. **Check database flag:**
   ```sql
   SELECT "isOfficial" FROM "User" WHERE email = 'admin@butternovel.com';
   ```

2. **Clear cache:**
   - Redis cache might be serving old data
   - Wait for TTL to expire or manually invalidate:
   ```bash
   # Clear user cache in Redis
   redis-cli DEL "user:${userId}"
   ```

3. **Check API response:**
   ```bash
   curl https://your-domain.com/api/user/${userId}
   ```
   Should include: `"isOfficial": true`

### Official Account Not Created

If the admin@butternovel.com account doesn't exist:

1. Create it via the auth system (register or admin panel)
2. Run the setup script to mark it as official
3. Alternatively, use Prisma Studio to manually create/update:
   ```bash
   npx prisma studio
   ```

## Code References

Official account logic is implemented in:

- **API**: `src/app/api/user/[userId]/route.ts` - Returns `isOfficial` flag
- **Avatar Badge**: `src/components/badge/UserBadge.tsx` - Special border/glow/checkmark
- **Profile Modal**: `src/components/profile/PublicUserProfile.tsx` - Limited tabs/stats
- **Author Name**: `src/components/novel/AuthorNameButton.tsx` - Inline official badge
- **Library Modal**: `src/components/shared/LibraryModal.tsx` - Fetches and displays profile

## Notes

- The `isOfficial` flag is stored in the `User` table
- API automatically creates User record from AdminProfile if needed
- All official account styling is handled client-side based on the flag
- No special caching logic needed - uses standard TTL
