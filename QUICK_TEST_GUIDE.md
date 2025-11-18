# Quick Testing Guide

## Step-by-Step Testing Process

### 1. Start Your Dev Server

```bash
cd frontend
npm run dev
```

Open browser to: `http://localhost:3000`

---

### 2. Test Infinite Scroll (5 minutes)

1. **Login** to your account
2. Go to **Dashboard** (`/dashboard`)
3. **Scroll down** slowly
4. ✅ **Expected**: More opportunities load automatically
5. ✅ **Expected**: "Loading more opportunities..." appears while loading
6. ✅ **Expected**: At the end, see "You've reached the end of the list"

**Quick Check:**
- Open browser DevTools → Network tab
- Scroll to bottom
- Watch for API calls to `/api/opportunities?offset=...`
- Verify offset increases (0, 20, 40, etc.)

---

### 3. Test Save/Applied (10 minutes)

#### Part A: Save Functionality
1. On dashboard, find an opportunity card
2. Click **"Save"** button (bookmark icon)
3. ✅ **Expected**: Button turns purple, shows "Saved"
4. ✅ **Expected**: Toast notification: "Saved for later"
5. Refresh page → ✅ Status should persist

#### Part B: Applied Functionality
1. Click **"Apply"** button (checkmark icon) on a different opportunity
2. ✅ **Expected**: Button turns green, shows "Applied"
3. ✅ **Expected**: Toast notification: "Marked as applied"
4. ✅ **Expected**: Opportunity **disappears** from dashboard
5. Refresh page → ✅ Opportunity still hidden

#### Part C: My Applications Page
1. Click **"My Applications"** in navbar
2. ✅ **Expected**: "Saved" tab shows your saved opportunities
3. ✅ **Expected**: Count badge shows correct number
4. Click **"Applied"** tab
5. ✅ **Expected**: Shows your applied opportunities
6. ✅ **Expected**: Count badge shows correct number

#### Part D: Un-Save/Un-Apply
1. In "Saved" tab, click "Save" again
2. ✅ **Expected**: Button returns to outline, toast: "Removed from saved"
3. In "Applied" tab, click "Apply" again
4. ✅ **Expected**: Button returns to outline, toast: "Removed from applied"
5. Go back to dashboard → ✅ Opportunity should appear again

**Quick Check:**
- Open DevTools → Network tab
- Watch for API calls to `/api/user-opportunities`
- Verify POST requests when saving/applying
- Verify DELETE requests when un-saving/un-applying

---

### 4. Test Calendar Integration (5 minutes)

#### Part A: Button Visibility
1. Find an opportunity **with a deadline**
2. ✅ **Expected**: "Add to Calendar" button visible
3. Find an opportunity **without a deadline**
4. ✅ **Expected**: "Add to Calendar" button NOT visible

#### Part B: Download & Import
1. Click **"Add to Calendar"** on an opportunity with deadline
2. ✅ **Expected**: `.ics` file downloads
3. ✅ **Expected**: Toast: "Calendar event added!"
4. Open the downloaded file
5. ✅ **Expected**: Calendar app opens (Google Calendar, Apple Calendar, etc.)
6. ✅ **Expected**: Event shows:
   - Title: "Job Title - Company Name"
   - Date: Matches opportunity deadline
   - Location: Matches opportunity location

**Quick Check:**
- File should be named: `CompanyName-deadline.ics`
- Open file in text editor to verify ICS format

---

### 5. Test Social Sharing (5 minutes)

#### Part A: Desktop (LinkedIn)
1. On desktop browser, click **"Share"** button
2. ✅ **Expected**: LinkedIn share dialog opens in new window
3. ✅ **Expected**: URL is pre-filled
4. Close dialog

#### Part B: Mobile (Web Share API)
1. Open browser DevTools → Toggle device toolbar (mobile view)
2. Click **"Share"** button
3. ✅ **Expected**: Native share sheet appears (or LinkedIn if Web Share not supported)
4. Test sharing to a messaging app

**Quick Check:**
- Desktop: Should open `linkedin.com/sharing/share-offsite/`
- Mobile: Should trigger `navigator.share()` API

---

### 6. Test Integration (5 minutes)

1. **Save** an opportunity
2. **Apply** to another opportunity
3. **Add to Calendar** a third opportunity
4. **Share** a fourth opportunity
5. ✅ **Expected**: All features work together without conflicts
6. Navigate between Dashboard and My Applications
7. ✅ **Expected**: All states persist correctly

---

## Common Issues & Solutions

### Issue: "Save" button doesn't work
**Solution:**
- Check browser console for errors
- Verify database migration ran successfully
- Check Network tab for API errors

### Issue: Applied opportunities still show on dashboard
**Solution:**
- Verify `hideApplied` defaults to `true` in API
- Check that user_opportunities table exists
- Verify RLS policies are set up

### Issue: Calendar file doesn't download
**Solution:**
- Check browser console for errors
- Verify opportunity has a deadline
- Check browser download settings

### Issue: Share button doesn't work on mobile
**Solution:**
- Web Share API requires HTTPS (or localhost)
- Some browsers don't support it
- Should fallback to LinkedIn

### Issue: Infinite scroll doesn't trigger
**Solution:**
- Check browser console for errors
- Verify `pagination.hasMore` is true
- Check Network tab for API calls

---

## Browser Console Checks

Open DevTools Console and verify:
- ✅ No red errors
- ✅ API calls return 200 status
- ✅ No CORS errors
- ✅ No authentication errors

---

## Network Tab Checks

Open DevTools Network tab and verify:
- ✅ `/api/opportunities` calls succeed
- ✅ `/api/user-opportunities` calls succeed
- ✅ No 401 (Unauthorized) errors
- ✅ No 500 (Server Error) errors

---

## Quick Verification Commands

```bash
# Check if all files exist
ls frontend/components/opportunities/SaveAppliedButtons.tsx
ls frontend/components/opportunities/AddToCalendarButton.tsx
ls frontend/components/opportunities/SocialShareButton.tsx
ls frontend/hooks/useIntersectionObserver.ts
ls frontend/app/(dashboard)/my-applications/page.tsx

# Check for TypeScript errors
cd frontend
npm run build
```

---

## Test Results Template

```
Date: ___________
Tester: ___________

✅ Infinite Scroll: PASS / FAIL
✅ Save Functionality: PASS / FAIL
✅ Applied Functionality: PASS / FAIL
✅ My Applications Page: PASS / FAIL
✅ Calendar Integration: PASS / FAIL
✅ Social Sharing: PASS / FAIL
✅ Integration Tests: PASS / FAIL

Issues Found:
1. 
2. 
3. 

Notes:
```

---

## Next Steps

After testing:
1. Document any bugs found
2. Fix critical issues
3. Test again after fixes
4. Deploy to production
5. Monitor for issues

