# Multiple Request Prevention System

## Overview
The app now prevents donors from accepting multiple blood requests simultaneously, ensuring they complete one donation before accepting another. This also prevents requests from being sent to busy donors.

## Key Features

### 1. **Single Active Request Rule**
- Donors can only have ONE accepted request at a time
- Must complete or cancel current request before accepting a new one
- Prevents overbooking and ensures donor commitment

### 2. **Automatic Validation**
When a donor tries to accept a request:
- ✅ Check if donor has existing accepted requests
- ✅ Verify donor is not suspended/banned
- ✅ Confirm donor is eligible (90-day rule)
- ❌ Block if any condition fails

### 3. **Visual Indicators**
- **"Busy" Badge**: Shows on donors who have accepted requests
- Yellow/amber color scheme for busy status
- Visible in both admin panel and user search

### 4. **Admin Protection**
When admins send requests:
- System checks if donor already has accepted request
- Prevents duplicate requests to busy donors
- Shows error message with clear explanation

## User Experience

### For Donors

#### Scenario 1: Accepting First Request
```
1. Donor receives blood request → Status: "Pending"
2. Donor taps "Accept" → Status: "Accepted" ✅
3. Donor profile marked as "Busy"
```

#### Scenario 2: Trying to Accept Multiple
```
1. Donor has accepted request → Status: "Busy"
2. New request arrives → Donor taps "Accept"
3. Error: "You already have an accepted request. 
   Please complete it before accepting another." ❌
4. Request remains "Pending"
```

#### Scenario 3: After Completing Donation
```
1. Admin marks donation as "Completed"
2. Donor's "Busy" status clears automatically
3. 90-day eligibility period begins
4. Donor can accept new requests after 90 days ✅
```

### For Admins

#### Admin Panel - Donors List
```
Donor Card Display:
┌─────────────────────────────┐
│ John Doe                    │
│ john@example.com            │
│ Blood: O+                   │
│ Location: Dhaka             │
│                             │
│ [Active] [Busy] [Verified]  │ ← Busy badge visible
│ Joined Jan 2024             │
└─────────────────────────────┘
```

#### Sending Request to Busy Donor
```
Admin clicks "Send Request" on busy donor:
❌ Error Alert:
"This donor already has an accepted request. 
Please wait until they complete it."
```

## Technical Implementation

### Service Layer Validations

#### DonorService.acceptRequest()
```typescript
// Check 1: Existing accepted requests
const { data: existingAccepted } = await supabase
  .from('blood_requests')
  .select('id, status')
  .eq('donor_id', user.id)
  .eq('status', 'accepted')
  .limit(1);

if (existingAccepted && existingAccepted.length > 0) {
  throw new Error('You already have an accepted request...');
}

// Check 2: Donor status (suspended/banned)
const profile = await this.getProfile();
if (profile.status === 'suspended') {
  throw new Error('Your account is suspended...');
}

// Check 3: 90-day eligibility
if (profile.last_donation_date) {
  const daysSinceLastDonation = ...;
  const daysUntilEligible = 90 - daysSinceLastDonation;
  if (daysUntilEligible > 0) {
    throw new Error(`You are not eligible yet...`);
  }
}
```

#### DonorService.sendBloodRequest()
```typescript
// Check donor status
if (donorRow.status === 'suspended') {
  throw new Error('This donor is currently suspended...');
}

// Check for existing accepted request
const { data: existingAccepted } = await supabase
  .from('blood_requests')
  .select('id, status')
  .eq('donor_id', donorId)
  .eq('status', 'accepted')
  .limit(1);

if (existingAccepted && existingAccepted.length > 0) {
  throw new Error('This donor already has an accepted request...');
}

// Check 90-day eligibility
if (donorRow.last_donation_date) {
  // Calculate and validate
}
```

### Data Fetching with Status

#### AdminService.listDonors()
```typescript
// Fetch donors
const { data } = await query;

// Check accepted requests for all donors
const { data: acceptedRequests } = await supabase
  .from('blood_requests')
  .select('donor_id')
  .in('donor_id', donorIds)
  .eq('status', 'accepted');

// Add hasAcceptedRequest flag
return data.map(donor => ({
  ...donor,
  hasAcceptedRequest: donorsWithAcceptedRequests.has(donor.id)
}));
```

#### DonorService.searchDonors()
```typescript
// Similar pattern: fetch donors, check accepted requests, add flag
```

## Database Schema

### blood_requests Table
```sql
CREATE TABLE blood_requests (
  id UUID PRIMARY KEY,
  donor_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  status TEXT NOT NULL, -- 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX idx_blood_requests_donor_status 
ON blood_requests(donor_id, status);
```

### Query Pattern
```sql
-- Find donors with accepted requests
SELECT donor_id 
FROM blood_requests 
WHERE status = 'accepted';

-- Check specific donor
SELECT COUNT(*) 
FROM blood_requests 
WHERE donor_id = $1 
  AND status = 'accepted';
```

## Request Status Flow

```
┌─────────┐
│ Pending │ ← Admin sends request
└────┬────┘
     │
     ├─→ [Accepted] ─→ Donor marked as "Busy"
     │         │
     │         ├─→ [Completed] ─→ 90-day wait begins
     │         │
     │         └─→ [Cancelled] ─→ Back to available
     │
     ├─→ [Rejected] ─→ Back to available
     │
     └─→ [Cancelled] ─→ Back to available

BUSY = Status "Accepted"
AVAILABLE = No accepted requests + Eligible (90 days passed)
```

## UI Components

### Busy Badge Style
```typescript
{
  backgroundColor: '#FEF3C7', // Light yellow
  borderColor: '#F59E0B',     // Amber border
}

Dot: { backgroundColor: '#F59E0B' }
Text: { color: '#D97706' } // Dark amber
```

### Badge Placement

#### Admin Donors List
```
Status Row: [Active] [Busy] [Verified] [Joined Date]
```

#### User Search Results
```
Availability Row: [Available/Not Eligible] [Busy] [Last Donation]
```

## Error Messages

### Donor Attempting Multiple Accepts
```
❌ "You already have an accepted request. 
   Please complete it before accepting another."
```

### Admin Sending to Busy Donor
```
❌ "This donor already has an accepted request. 
   Please wait until they complete it."
```

### Donor Not Eligible (90-day rule)
```
❌ "You are not eligible to donate yet. 
   Please wait X more days (Y months after last donation)."
```

### Donor Suspended
```
❌ "Your account is suspended. 
   You cannot accept requests."

❌ "This donor is currently suspended and 
   cannot receive requests."
```

## Testing Checklist

### Donor Tests
- [ ] Donor can accept first request successfully
- [ ] Donor blocked from accepting second request while one is accepted
- [ ] Error message displays correctly
- [ ] Donor can accept new request after completing/cancelling previous
- [ ] Suspended donor cannot accept requests
- [ ] Ineligible donor (< 90 days) cannot accept

### Admin Tests
- [ ] Admin can send request to available donor
- [ ] Admin blocked from sending to busy donor
- [ ] Busy badge shows correctly in donors list
- [ ] Busy badge updates in real-time after donor accepts
- [ ] Admin cannot send to suspended donor
- [ ] Admin cannot send to ineligible donor

### UI Tests
- [ ] Busy badge appears when donor accepts request
- [ ] Busy badge disappears when request completed
- [ ] Badge colors are correct (yellow/amber)
- [ ] Badge visible in both admin panel and user search
- [ ] Multiple badges display correctly together

## Integration Points

### Related Systems
- **Availability System** (`AVAILABILITY_SYSTEM.md`)
  - 90-day eligibility rule
  - Last donation date tracking
  
- **Ban System** (`ADMIN_BAN_SYSTEM.md`)
  - Suspended status checking
  - Ban enforcement
  
- **Notification System** (`NOTIFICATION_TRACKING.md`)
  - Request notifications
  - Status updates

### Files Modified
- `services/DonorService.ts` - acceptRequest, sendBloodRequest, searchDonors
- `services/AdminService.ts` - listDonors
- `app/admin/donors/index.tsx` - Busy badge in admin list
- `app/(tabs)/search.tsx` - Busy badge in user search
- `app/(tabs)/requests.tsx` - Accept button handler

## Performance Considerations

### Database Queries
- **Single query** to check all donors' accepted requests
- Uses `IN` clause for batch checking
- Indexed on `(donor_id, status)` for fast lookups

### Optimization
```typescript
// Good: Batch query for multiple donors
const { data } = await supabase
  .from('blood_requests')
  .select('donor_id')
  .in('donor_id', donorIds)      // Check all at once
  .eq('status', 'accepted');

// Bad: Individual queries per donor
for (const donor of donors) {
  const { data } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('donor_id', donor.id)
    .eq('status', 'accepted');
}
```

### Caching Strategy
- Busy status computed on-demand
- No caching needed (status changes infrequently)
- Real-time accuracy prioritized over performance

## Future Enhancements

### Potential Features
- [ ] Request queue system (accept multiple, fulfill in order)
- [ ] Priority levels for urgent requests
- [ ] Auto-cancel pending requests after X hours
- [ ] Notification when donor becomes available again
- [ ] Admin override for emergency situations
- [ ] Request scheduling (future date acceptance)

### Advanced Validations
- [ ] Maximum requests per month limit
- [ ] Minimum days between donations
- [ ] Health screening before acceptance
- [ ] Location-based request filtering
- [ ] Blood type compatibility checking

## Troubleshooting

### Donor Can't Accept Request
1. Check if they have existing accepted request
2. Verify account not suspended
3. Confirm 90-day eligibility passed
4. Check database for orphaned 'accepted' records

### Busy Badge Not Showing
1. Verify `hasAcceptedRequest` flag in API response
2. Check blood_requests table for accepted status
3. Ensure donor_id matches correctly
4. Refresh admin/search lists

### Admin Can Send to Busy Donor
1. Check validation in `sendBloodRequest()`
2. Verify database query returning results
3. Ensure error is not being caught/suppressed
4. Check Supabase RLS policies

## Related Documentation
- `AVAILABILITY_SYSTEM.md` - 90-day eligibility
- `ADMIN_BAN_SYSTEM.md` - Suspension system
- `ADMIN_PANEL_STATUS_UPDATE.md` - Request status flow
- `NOTIFICATION_TRACKING.md` - Request notifications

## Version History
- **v1.0** - Initial implementation
  - Single request rule
  - Busy badge in UI
  - Admin/donor validations
