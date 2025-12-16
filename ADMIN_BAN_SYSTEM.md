# Admin Ban System - User Guide

## Overview
The admin panel now supports comprehensive user banning with temporary and permanent options, plus the ability to unban users.

## Features

### 1. **Temporary Ban**
- Ban users for a specific number of days (e.g., 7 days, 30 days)
- System automatically tracks when the ban expires
- User account is restored after the ban period
- Useful for minor infractions or warnings

### 2. **Permanent Ban**
- Ban users indefinitely
- No automatic restoration
- Can be manually unbanned by admin
- Useful for serious violations

### 3. **Unban Users**
- Restore access to previously banned accounts
- Works for both temporary and permanent bans
- One-click restoration

## How to Use

### Banning a User

1. **From Reports Tab:**
   - View the reported user's information
   - Click the **"Ban"** button (red)
   - Choose ban type:
     - **Temporary:** Enter number of days (e.g., 7, 30, 90)
     - **Permanent:** Click "Ban Permanently"

2. **Ban Options Modal:**
   ```
   ┌─────────────────────────────────┐
   │ Temporary Ban (Days):           │
   │ [Enter number of days]          │
   │ [Ban Temporarily] (Orange)      │
   │                                 │
   │          OR                     │
   │                                 │
   │ [Ban Permanently] (Red)         │
   └─────────────────────────────────┘
   ```

### Unbanning a User

1. **From Reports Tab:**
   - Banned users show a **green "Unban"** button
   - Ban status is displayed: "User is banned until [date]" or "User is banned"
   - Click **"Unban"** button
   - Confirm the action
   - User account is immediately restored

### Ban Status Display

The system displays ban information clearly:
- **Active Ban:** Red banner showing "User is banned"
- **Temporary Ban:** Includes expiry date
- **Permanent Ban:** No expiry date shown

## Technical Details

### Database Updates Required

Run this SQL script in your Supabase SQL editor:

```sql
-- File: sql/add-ban-expiry-column.sql
ALTER TABLE donors 
ADD COLUMN IF NOT EXISTS ban_expiry TIMESTAMPTZ;
```

This adds the `ban_expiry` column to track temporary ban durations.

### Button States

- **Not Banned:** Shows red "Ban" button
- **Banned:** Shows green "Unban" button
- Status changes immediately upon action

### Contact Options

Even for banned users, admins can:
- Contact the reporter (who filed the report)
- Contact the reported user (banned user)
- Both via WhatsApp integration

## Best Practices

1. **Use Temporary Bans First**
   - Start with 7-14 days for first offenses
   - Escalate to longer periods for repeat offenders
   - Reserve permanent bans for serious violations

2. **Document Actions**
   - Use admin notes in the report details
   - Record the reason for ban
   - Track pattern of violations

3. **Communication**
   - Contact users via WhatsApp before banning (optional)
   - Explain the reason for the ban
   - Provide clear expectations for account restoration

4. **Review Regularly**
   - Check expired bans periodically
   - Consider unbanning reformed users
   - Monitor for repeat offenders

## Examples

### Example 1: First-Time Offender
- **Situation:** User posted misleading information
- **Action:** Temporary ban for 7 days
- **Process:** 
  1. Click "Ban" button
  2. Enter "7" in days field
  3. Click "Ban Temporarily"
  4. User can access account after 7 days

### Example 2: Repeat Offender
- **Situation:** User harassed multiple donors
- **Action:** Permanent ban
- **Process:**
  1. Click "Ban" button
  2. Click "Ban Permanently"
  3. User account suspended indefinitely
  4. Admin can unban if circumstances change

### Example 3: Reformed User
- **Situation:** User completed ban period but still shows as banned
- **Action:** Manual unban
- **Process:**
  1. Click "Unban" button
  2. Confirm action
  3. User regains full access

## Automatic Features

### Expired Bans
The system includes an optional auto-unban function. To enable:

```sql
-- Run periodically (e.g., via cron job)
SELECT auto_unban_expired_users();
```

This automatically restores access to users whose temporary bans have expired.

## Notes

- Banned users cannot access their accounts
- All ban actions are logged with timestamps
- Ban history can be tracked via database
- Admins can reverse bans at any time
- System prevents banned users from using the app

## Troubleshooting

**Q: User is still banned after expiry date**
- A: Manually click "Unban" or run the auto-unban function

**Q: Can't unban a user**
- A: Check database permissions and ensure the user ID is correct

**Q: Ban expiry not showing**
- A: Verify the SQL migration was run successfully

## Support

For technical issues or questions:
- Check the database schema
- Verify RLS policies allow admin updates
- Review AdminService.ts for ban logic
