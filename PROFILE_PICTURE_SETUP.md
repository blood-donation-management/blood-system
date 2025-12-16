# Profile Picture Setup Guide

## Overview
Profile picture upload functionality has been implemented. Users can now:
- Take a photo with their camera
- Choose from their photo library
- Upload to Supabase Storage
- See instant updates in their profile

## Required Supabase Setup

### 1. Add Database Column
Execute the SQL script to add the profile picture column to the donors table:

**File:** `sql/add-profile-picture-column.sql`

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `sql/add-profile-picture-column.sql`
3. Run the query
4. Verify the column was created using the verification query included

### 2. Create Storage Bucket
Set up Supabase Storage for profile pictures:

**Steps:**
1. Open Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Bucket name: `avatars`
4. Set as **Public bucket** (required for profile pictures to be viewable)
5. Click "Create bucket"

**Bucket Configuration:**
- Name: `avatars`
- Public: Yes ✓
- File size limit: 5MB (recommended)
- Allowed MIME types: image/jpeg, image/png, image/jpg

### 3. Storage Policies (Optional but Recommended)
Add these policies for better security:

```sql
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all avatars
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Implementation Details

### Upload Flow
1. User taps on their profile avatar
2. Alert shows options: "Take Photo", "Choose from Library", "Cancel"
3. User selects an option and grants permissions
4. Image picker opens with 1:1 aspect ratio editing
5. Image is compressed to 70% quality
6. Image uploads to Supabase Storage: `avatars/profile-pictures/{user_id}-{timestamp}.{ext}`
7. Public URL is retrieved
8. Database profile is updated with the URL
9. UI updates instantly with the new profile picture

### Code Files Modified
- **services/DonorService.ts**: Added `uploadProfilePicture()` method
- **app/(tabs)/profile.tsx**: 
  - Added image picker functions
  - Updated avatar display with TouchableOpacity
  - Added camera button overlay
  - Added loading state during upload

### Key Features
- ✅ Camera capture with permission handling
- ✅ Photo library selection with permission handling
- ✅ 1:1 aspect ratio cropping
- ✅ Image compression (70% quality)
- ✅ Loading indicator during upload
- ✅ Instant database update
- ✅ Instant UI update
- ✅ Success/error alerts
- ✅ File naming with user ID and timestamp
- ✅ Automatic overwrite of previous images (upsert: true)

## Testing Checklist

### Before Testing
- [ ] Execute `sql/add-profile-picture-column.sql` in Supabase
- [ ] Create `avatars` bucket in Supabase Storage (public)
- [ ] Restart Expo app to ensure latest code is loaded

### Test Cases
1. **Camera Capture**
   - [ ] Tap avatar → Select "Take Photo"
   - [ ] Grant camera permission when prompted
   - [ ] Take a photo
   - [ ] Crop to 1:1 aspect ratio
   - [ ] Confirm photo uploads and displays

2. **Photo Library**
   - [ ] Tap avatar → Select "Choose from Library"
   - [ ] Grant photo library permission when prompted
   - [ ] Select an existing photo
   - [ ] Crop to 1:1 aspect ratio
   - [ ] Confirm photo uploads and displays

3. **Upload Process**
   - [ ] Verify loading indicator appears during upload
   - [ ] Verify success alert shows after upload
   - [ ] Verify profile picture updates instantly in UI
   - [ ] Verify avatar shows uploaded image (not User icon)

4. **Database Verification**
   - [ ] Check Supabase Storage → avatars bucket
   - [ ] Verify image file exists in profile-pictures folder
   - [ ] Check donors table → profile_picture_url column
   - [ ] Verify URL matches uploaded file

5. **Error Handling**
   - [ ] Test with no permissions granted (should show alert)
   - [ ] Test with no internet (should show error alert)
   - [ ] Test cancel action (should do nothing)

6. **Persistence**
   - [ ] Close and reopen app
   - [ ] Verify profile picture still displays
   - [ ] Upload new picture
   - [ ] Verify old picture is replaced

## Troubleshooting

### "Permission denied" error
- Check camera/photo library permissions in device settings
- On iOS: Settings → Privacy → Camera/Photos
- On Android: Settings → Apps → Blood Donation App → Permissions

### "Upload failed" error
- Verify Supabase Storage bucket exists and is named `avatars`
- Verify bucket is set to public
- Check Supabase Storage policies allow uploads
- Verify internet connection

### Image not displaying
- Check Supabase Storage URL is public
- Verify profile_picture_url column contains valid URL
- Check Image component has correct style (borderRadius)
- Verify Image source URI is correct

### Camera button not visible
- Check cameraButtonOverlay style positioning
- Verify z-index/elevation for overlay
- Check TouchableOpacity is not disabled

## File Structure
```
profile-pictures/
  ├── {user_id_1}-{timestamp}.jpg
  ├── {user_id_2}-{timestamp}.png
  └── ...
```

## Additional Notes
- Images are automatically compressed to 70% quality to save storage
- File naming includes user ID and timestamp to prevent conflicts
- upsert: true allows replacing old profile pictures
- 1:1 aspect ratio ensures circular display looks good
- Loading state prevents double-uploads
- Alert dialog provides clear user experience
