# Notification Tracking System

## Overview
The admin notifications tab now features intelligent tracking that shows only **unseen/new** notifications in the badge counter, improving notification management and reducing confusion.

## Features

### 1. **Unseen Count Badge**
- Badge shows only notifications the admin hasn't seen yet
- Automatically decreases when notifications are viewed
- Shows "99+" for counts over 99
- Badge disappears when all notifications are seen

### 2. **Visual Indicators**
- **Blue left border**: Unseen notifications have a blue accent
- **Blue dot**: Small indicator in top-left corner of unseen cards
- Indicators disappear when notification is tapped

### 3. **Persistent Tracking**
- Seen notification IDs stored in AsyncStorage
- Tracking persists across app restarts
- Storage key: `@admin_seen_notifications`

### 4. **Mark as Seen**
- Tap any notification card to mark it as seen
- Automatically updates badge count in real-time
- Seen status saved immediately to storage

## User Experience

### Before (Old System)
```
Badge: "15 pending requests"
Problem: Shows ALL pending requests, even if admin has seen them
```

### After (New System)
```
Badge: "3 new notifications"
Benefit: Shows only UNSEEN notifications
- Tap notification → Badge decreases
- All seen → Badge disappears
- New request arrives → Badge shows "1 new notification"
```

## Technical Implementation

### State Management
```typescript
const [unseenCount, setUnseenCount] = useState(0);
const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
```

### Storage Functions
```typescript
// Load seen IDs from AsyncStorage on mount
const loadSeenIds = async () => {
  const stored = await AsyncStorage.getItem('@admin_seen_notifications');
  if (stored) {
    setSeenIds(new Set(JSON.parse(stored)));
  }
};

// Save seen IDs to AsyncStorage
const saveSeenIds = async (ids: Set<string>) => {
  await AsyncStorage.setItem('@admin_seen_notifications', 
    JSON.stringify(Array.from(ids)));
};
```

### Mark as Seen Logic
```typescript
const markNotificationsAsSeen = useCallback(async (notificationIds: string[]) => {
  const newSeenIds = new Set(seenIds);
  notificationIds.forEach(id => newSeenIds.add(id));
  setSeenIds(newSeenIds);
  await saveSeenIds(newSeenIds);
}, [seenIds]);
```

### Unseen Count Calculation
```typescript
// In loadNotifications()
const unseen = sortedRequests.filter((r: any) => {
  const id = r.id || r._id;
  return !seenIds.has(id);
}).length;
setUnseenCount(unseen);
```

### Notification Card
```typescript
const renderNotification = ({ item }: { item: BloodRequest }) => {
  const itemId = (item as any).id || (item as any)._id;
  const isUnseen = itemId && !seenIds.has(itemId);
  
  return (
    <TouchableOpacity 
      style={[styles.notificationCard, isUnseen && styles.unseenCard]}
      onPress={() => {
        if (itemId && !seenIds.has(itemId)) {
          markNotificationsAsSeen([itemId]);
        }
      }}
    >
      {isUnseen && <View style={styles.unseenIndicator} />}
      {/* notification content */}
    </TouchableOpacity>
  );
};
```

## Styling

### Unseen Card Style
```typescript
unseenCard: {
  borderLeftWidth: 4,
  borderLeftColor: '#2563EB',  // Blue accent
}
```

### Unseen Indicator Style
```typescript
unseenIndicator: {
  position: 'absolute',
  top: 12,
  left: 12,
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: '#2563EB',  // Blue dot
  zIndex: 10,
  shadowColor: '#2563EB',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 4,
  elevation: 3,
}
```

## Real-time Updates
- Auto-refresh continues every 3 seconds
- New notifications automatically detected
- Badge updates instantly when new requests arrive
- Seen notifications remain marked even after refresh

## Data Flow

```
1. App starts → Load seen IDs from AsyncStorage
2. Load notifications → Calculate unseen count
3. User taps notification → Mark as seen
4. Save to AsyncStorage → Update badge
5. Auto-refresh (3s) → Recalculate unseen count
6. New request arrives → Badge shows updated count
```

## Storage Management

### AsyncStorage Key
```typescript
const SEEN_NOTIFICATIONS_KEY = '@admin_seen_notifications';
```

### Data Format
```json
["abc123", "def456", "ghi789"]
```

### Storage Size
- Each notification ID: ~24 characters
- 1000 seen notifications: ~24 KB
- Minimal storage footprint

## Benefits

1. **Reduced Confusion**: Badge shows only what's new
2. **Better Awareness**: Clear visual indicators
3. **Persistent State**: Works across app restarts
4. **Real-time**: Immediate updates
5. **Intuitive**: Tap to mark as seen
6. **Visual Feedback**: Blue accent for unseen items

## Future Enhancements

### Potential Features
- [ ] "Mark all as read" button
- [ ] Clear old seen IDs (cleanup after 30 days)
- [ ] Notification sounds/vibrations
- [ ] Push notifications integration
- [ ] Seen timestamp tracking
- [ ] Notification categories

### Performance Considerations
- AsyncStorage operations are fast (<10ms)
- Set lookups are O(1)
- No impact on real-time updates
- Minimal memory overhead

## Testing

### Test Cases
1. **Initial Load**: Badge shows all notifications as unseen
2. **Tap Notification**: Badge decreases by 1
3. **App Restart**: Seen notifications remain marked
4. **New Request**: Badge increases for new items only
5. **All Seen**: Badge disappears
6. **Auto-refresh**: Unseen count updates correctly

### Manual Testing
```bash
# Test 1: Mark as seen
1. Open notifications tab
2. Note badge count (e.g., "5 new notifications")
3. Tap any notification card
4. Verify badge decreases to 4
5. Blue border/dot disappears from tapped card

# Test 2: Persistence
1. Mark some notifications as seen
2. Close and reopen app
3. Verify same notifications still marked as seen
4. Badge shows correct unseen count

# Test 3: Real-time
1. Open notifications tab
2. Have another user create blood request
3. Wait 3 seconds (auto-refresh)
4. Verify new notification appears with blue indicator
5. Badge count increases
```

## Troubleshooting

### Badge Not Updating
- Check AsyncStorage permissions
- Verify notification IDs are consistent
- Check console for errors

### Seen State Lost
- AsyncStorage might be cleared
- Check app data permissions
- Verify key name matches: `@admin_seen_notifications`

### Performance Issues
- If seen IDs exceed 10,000, consider cleanup
- Implement periodic pruning of old IDs
- Monitor AsyncStorage size

## Related Files
- `app/admin/notifications.tsx` - Main implementation
- `services/AdminService.ts` - Notification fetching
- `ADMIN_BAN_SYSTEM.md` - Related admin features

## Version History
- **v2.0** - Intelligent unseen tracking system
- **v1.0** - Basic pending count only
