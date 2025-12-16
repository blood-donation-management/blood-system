# Donor Availability System - 90-Day Enforcement

## Overview
The donor availability system ensures that donors cannot be requested within 90 days of their last donation. This is automatically enforced throughout the app.

## How It Works

### 1. **Donation Completion Flow**
When a blood request is marked as complete:
- `DonorService.completeRequest()` is called with the request ID and rating
- The donor's `last_donation_date` is **automatically updated** to the current date
- The request status is changed to `'completed'`
- Database field: `donors.last_donation_date` (ISO 8601 format)

### 2. **Availability Calculation**
The `calculateAvailability()` function (in `app/(tabs)/search.tsx`) checks:
- **No last donation date** → `available: true` (green "Available")
- **Days since last donation < 90** → `available: false` (yellow "Available in X days")
- **Days since last donation ≥ 90** → `available: true` (green "Available")

Formula:
```
daysSinceDonation = (now - lastDonationDate) / (1000 * 60 * 60 * 24)
if daysSinceDonation >= 90: available = true
else: available = false, daysUntilEligible = 90 - daysSinceDonation
```

### 3. **Search Results Display**
In the search screen, each donor card shows:
- **Green badge** "Available" (if `available: true`)
- **Yellow badge** "Available in X days" (if `available: false`) with last donation date
- **Request button**: 
  - **Enabled** (green) when `available: true`
  - **Disabled** (gray, 40% opacity) when `available: false`
- Alert message when trying to request: "This donor is not eligible to donate yet. They will be available in X days (Y months after last donation)."

### 4. **Real-Time Updates**
- Search results refresh every **5 seconds** to update availability status
- When user marks a request as complete, the donor immediately becomes unavailable
- Next time the donor appears in search (after 5-second refresh), they will show "Available in 90 days"

### 5. **Database Integration**
```sql
-- donors table
ALTER TABLE donors ADD COLUMN last_donation_date TIMESTAMP WITH TIME ZONE;

-- When completeRequest() is called:
UPDATE donors 
SET last_donation_date = NOW()
WHERE id = donor_id;

-- SearchDonors fetches this field:
SELECT *, last_donation_date FROM donors WHERE status = 'active' AND id != current_user_id;
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `calculateAvailability()` | `app/(tabs)/search.tsx` | Calculate donor eligibility |
| `searchDonors()` | `services/DonorService.ts` | Fetch donors with last_donation_date |
| `completeRequest()` | `services/DonorService.ts` | Update donor's last_donation_date |
| `5-second refresh interval` | `app/(tabs)/search.tsx` useEffect | Keep availability status current |
| `disabledRequestButton` style | `app/(tabs)/search.tsx` | Visual feedback (gray, 40% opacity) |

## User Experience Flow

1. **User searches for donors** → All active donors are shown
2. **Recently-donated donor appears** → Shows yellow "Available in X days" badge
3. **Request button is disabled** → Gray button with reduced opacity
4. **User tries to tap button** → Button doesn't respond, alert shows why
5. **After 90 days** → Badge turns green "Available", button becomes active

## Testing Checklist

- [x] Donor completes donation (last_donation_date updated)
- [x] Search results show "Available in 90 days"
- [x] Request button is disabled and grayed out
- [x] Alert explains why donor isn't available
- [x] Real-time refresh updates the display
- [x] After 90 days, donor shows as "Available" again

## Troubleshooting

**Donor still shows as "Available" after completing donation:**
1. Check if `last_donation_date` was updated in database
2. Verify `completeRequest()` was called with correct request ID
3. Wait for 5-second refresh interval
4. Force app refresh (pull-down on Android, swipe down on iOS)

**Button still active for unavailable donor:**
1. Check browser cache and clear if needed
2. Verify `calculateAvailability()` returns `available: false`
3. Ensure `lastDonationDate` is being passed to the function
4. Check network timing - wait for fresh data from server

## Database Schema

```sql
CREATE TABLE donors (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  blood_group VARCHAR(3) NOT NULL,
  location TEXT NOT NULL,
  phone_number VARCHAR(11) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  avg_rating DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  last_donation_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Performance Notes

- Availability calculation is instant (no database calls)
- Search refreshes every 5 seconds (configurable in useEffect)
- `last_donation_date` is stored once when donation completes
- No continuous background processes, only refresh on search screen

## Related Features

- ✅ **Donation Completion**: `app/(tabs)/requests.tsx` - "Mark Complete - Rate Donor" button
- ✅ **Request Status**: Shows when request is `'accepted'` (allows marking complete)
- ✅ **Admin Dashboard**: `app/admin/index.tsx` - Can see all blood requests with statuses
- ✅ **Real-time Notifications**: Dashboard badge shows pending requests
