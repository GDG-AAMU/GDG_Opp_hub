# Comprehensive Testing Checklist - User Engagement Features

## Pre-Testing Setup

- [ ] Database migration `004_user_opportunities.sql` has been run successfully
- [ ] Development server is running (`npm run dev`)
- [ ] You are logged in as a test user
- [ ] Browser console is open (F12) to check for errors
- [ ] Network tab is open to monitor API calls

---

## Feature 1: Infinite Scroll

### Test Cases

#### TC-IS-1: Basic Infinite Scroll
- [ ] Navigate to `/dashboard`
- [ ] Scroll down to the bottom of the page
- [ ] Verify "Loading more opportunities..." appears
- [ ] Verify new opportunities load automatically
- [ ] Verify no page refresh occurs
- [ ] Verify opportunities are appended (not replaced)

#### TC-IS-2: End of List Detection
- [ ] Scroll until all opportunities are loaded
- [ ] Verify "You've reached the end of the list" message appears
- [ ] Verify no more loading attempts occur

#### TC-IS-3: Loading State
- [ ] Verify loading spinner appears while fetching
- [ ] Verify loading state doesn't block user interaction
- [ ] Verify smooth scrolling experience

#### TC-IS-4: With Filters Applied
- [ ] Apply a filter (e.g., filter by "Internship")
- [ ] Scroll to bottom
- [ ] Verify infinite scroll works with filters
- [ ] Verify only filtered opportunities load

#### TC-IS-5: Error Handling
- [ ] Simulate network error (disable network in DevTools)
- [ ] Scroll to trigger load
- [ ] Verify error is handled gracefully
- [ ] Re-enable network and verify recovery

---

## Feature 2: Save/Applied Opportunities

### Test Cases

#### TC-SA-1: Save Functionality
- [ ] Navigate to `/dashboard`
- [ ] Click "Save" button on an opportunity card
- [ ] Verify button changes to filled purple "Saved" state
- [ ] Verify toast notification appears: "Saved for later"
- [ ] Verify button text changes to "Saved"
- [ ] Refresh page and verify status persists

#### TC-SA-2: Un-Save Functionality
- [ ] Click "Save" button again on a saved opportunity
- [ ] Verify button returns to outline state
- [ ] Verify toast notification: "Removed from saved"
- [ ] Refresh page and verify status is removed

#### TC-SA-3: Mark as Applied
- [ ] Click "Apply" button on an opportunity card
- [ ] Verify button changes to filled green "Applied" state
- [ ] Verify toast notification: "Marked as applied"
- [ ] Verify opportunity disappears from dashboard (hidden by default)
- [ ] Refresh page and verify opportunity is still hidden

#### TC-SA-4: Un-Apply Functionality
- [ ] Navigate to `/my-applications`
- [ ] Go to "Applied" tab
- [ ] Click "Apply" button again on an applied opportunity
- [ ] Verify button returns to outline state
- [ ] Verify toast notification: "Removed from applied"
- [ ] Verify opportunity can now appear on dashboard again

#### TC-SA-5: My Applications Page - Saved Tab
- [ ] Navigate to `/my-applications`
- [ ] Verify "Saved" tab is selected by default
- [ ] Verify saved opportunities are displayed
- [ ] Verify count badge shows correct number
- [ ] Verify opportunity cards show "Saved" status
- [ ] Verify you can un-save from this page

#### TC-SA-6: My Applications Page - Applied Tab
- [ ] Click "Applied" tab
- [ ] Verify applied opportunities are displayed
- [ ] Verify count badge shows correct number
- [ ] Verify opportunity cards show "Applied" status
- [ ] Verify you can un-apply from this page

#### TC-SA-7: Applied Opportunities Hidden on Dashboard
- [ ] Mark an opportunity as "Applied"
- [ ] Navigate to `/dashboard`
- [ ] Verify applied opportunity does NOT appear
- [ ] Navigate to `/my-applications` → "Applied" tab
- [ ] Verify applied opportunity appears there

#### TC-SA-8: Status Persistence
- [ ] Save an opportunity
- [ ] Mark another as applied
- [ ] Log out and log back in
- [ ] Verify saved/applied statuses persist
- [ ] Verify counts are correct

#### TC-SA-9: Multiple Opportunities
- [ ] Save 3 different opportunities
- [ ] Apply to 2 different opportunities
- [ ] Verify all appear in correct tabs
- [ ] Verify counts are accurate
- [ ] Verify dashboard only shows non-applied opportunities

#### TC-SA-10: Navigation Links
- [ ] Verify "My Applications" link appears in navbar (desktop)
- [ ] Verify "My Applications" link appears in mobile menu
- [ ] Click link and verify navigation works
- [ ] Verify link is accessible when logged in

#### TC-SA-11: Empty States
- [ ] Navigate to `/my-applications` with no saved opportunities
- [ ] Verify empty state message appears
- [ ] Switch to "Applied" tab with no applied opportunities
- [ ] Verify empty state message appears

#### TC-SA-12: API Error Handling
- [ ] Disable network in DevTools
- [ ] Try to save an opportunity
- [ ] Verify error toast appears
- [ ] Re-enable network
- [ ] Verify functionality recovers

---

## Feature 3: Calendar Integration

### Test Cases

#### TC-CAL-1: Add to Calendar Button Visibility
- [ ] Navigate to `/dashboard`
- [ ] Verify "Add to Calendar" button appears on cards with deadlines
- [ ] Verify button does NOT appear on cards without deadlines
- [ ] Open opportunity details page
- [ ] Verify "Add to Calendar" button appears in header (if deadline exists)

#### TC-CAL-2: Calendar File Download
- [ ] Click "Add to Calendar" on an opportunity with deadline
- [ ] Verify `.ics` file downloads
- [ ] Verify filename format: `CompanyName-deadline.ics`
- [ ] Verify toast notification: "Calendar event added!"

#### TC-CAL-3: Calendar File Content
- [ ] Open downloaded `.ics` file in a text editor
- [ ] Verify file contains:
  - [ ] BEGIN:VCALENDAR
  - [ ] Company name and job title in SUMMARY
  - [ ] Correct deadline date/time
  - [ ] Location information
  - [ ] Application URL (if available)
  - [ ] END:VCALENDAR

#### TC-CAL-4: Import to Calendar App
- [ ] Double-click downloaded `.ics` file
- [ ] Verify calendar app opens (Google Calendar, Apple Calendar, etc.)
- [ ] Verify event details are correct:
  - [ ] Title: "Job Title - Company Name"
  - [ ] Date: Matches opportunity deadline
  - [ ] Location: Matches opportunity location
  - [ ] Description: Contains application URL

#### TC-CAL-5: Responsive Design
- [ ] Test on mobile viewport (< 640px)
- [ ] Verify button shows only icon (no text)
- [ ] Test on desktop viewport (> 640px)
- [ ] Verify button shows "Add to Calendar" text
- [ ] Verify button is properly sized and aligned

#### TC-CAL-6: Multiple Opportunities
- [ ] Add multiple opportunities to calendar
- [ ] Verify each creates a separate event
- [ ] Verify no conflicts or duplicates

#### TC-CAL-7: Error Handling
- [ ] Test with opportunity that has invalid deadline format
- [ ] Verify error is handled gracefully
- [ ] Verify error toast appears if download fails

---

## Feature 4: Social Sharing

### Test Cases

#### TC-SH-1: Share Button Visibility
- [ ] Navigate to `/dashboard`
- [ ] Verify "Share" button appears on opportunity cards
- [ ] Open opportunity details page
- [ ] Verify "Share" button appears in header

#### TC-SH-2: Desktop Sharing (LinkedIn)
- [ ] On desktop (> 768px), click "Share" button
- [ ] Verify LinkedIn share dialog opens in new window
- [ ] Verify window size is appropriate (600x400)
- [ ] Verify URL is pre-filled in LinkedIn share dialog
- [ ] Close dialog and verify no errors

#### TC-SH-3: Mobile Sharing (Web Share API)
- [ ] On mobile device or mobile viewport (< 768px)
- [ ] Click "Share" button
- [ ] Verify native share sheet appears (iOS/Android)
- [ ] Verify share options include:
  - [ ] Copy link
  - [ ] Messages/WhatsApp/etc.
  - [ ] Other apps
- [ ] Test sharing to a messaging app
- [ ] Verify shared content includes opportunity details

#### TC-SH-4: Share Content
- [ ] Share an opportunity
- [ ] Verify shared text includes:
  - [ ] Opportunity type
  - [ ] Job title
  - [ ] Company name
- [ ] Verify shared URL is correct

#### TC-SH-5: Responsive Design
- [ ] Test on mobile viewport
- [ ] Verify button shows only icon
- [ ] Test on desktop viewport
- [ ] Verify button shows "Share" text
- [ ] Verify button is properly sized

#### TC-SH-6: Error Handling
- [ ] Test when Web Share API is not available
- [ ] Verify fallback to LinkedIn works
- [ ] Test with network disabled
- [ ] Verify error is handled gracefully

---

## Cross-Feature Integration Tests

### Test Cases

#### TC-INT-1: All Features Together
- [ ] Save an opportunity
- [ ] Mark another as applied
- [ ] Add a deadline to calendar
- [ ] Share an opportunity
- [ ] Verify all features work simultaneously
- [ ] Verify no conflicts or errors

#### TC-INT-2: Infinite Scroll + Save/Applied
- [ ] Apply filters
- [ ] Scroll to load more opportunities
- [ ] Save some opportunities while scrolling
- [ ] Verify saved status persists after new load
- [ ] Verify applied opportunities stay hidden

#### TC-INT-3: My Applications + Infinite Scroll
- [ ] Navigate to `/my-applications`
- [ ] If you have many saved/applied opportunities
- [ ] Verify infinite scroll works on this page (if implemented)
- [ ] Verify status changes update the list

#### TC-INT-4: Navigation Flow
- [ ] Start on dashboard
- [ ] Save an opportunity
- [ ] Navigate to My Applications
- [ ] Verify saved opportunity appears
- [ ] Navigate back to dashboard
- [ ] Verify applied opportunities are still hidden

---

## Performance Tests

### Test Cases

#### TC-PERF-1: Infinite Scroll Performance
- [ ] Load dashboard with many opportunities
- [ ] Scroll quickly to bottom
- [ ] Verify no lag or stuttering
- [ ] Verify smooth loading experience
- [ ] Check network tab for efficient API calls

#### TC-PERF-2: Save/Applied Performance
- [ ] Save/apply multiple opportunities rapidly
- [ ] Verify no duplicate API calls
- [ ] Verify UI updates quickly
- [ ] Verify no race conditions

#### TC-PERF-3: Calendar Download Performance
- [ ] Click "Add to Calendar" multiple times
- [ ] Verify downloads are instant
- [ ] Verify no browser blocking

---

## Browser Compatibility Tests

### Test Cases

#### TC-BROWSER-1: Chrome/Edge
- [ ] Test all features in Chrome
- [ ] Test all features in Edge
- [ ] Verify no console errors

#### TC-BROWSER-2: Firefox
- [ ] Test all features in Firefox
- [ ] Verify Web Share API works (if supported)
- [ ] Verify calendar download works

#### TC-BROWSER-3: Safari
- [ ] Test all features in Safari
- [ ] Verify Web Share API works
- [ ] Verify calendar download works

#### TC-BROWSER-4: Mobile Browsers
- [ ] Test on iOS Safari
- [ ] Test on Chrome Mobile
- [ ] Verify touch interactions work
- [ ] Verify responsive design

---

## Accessibility Tests

### Test Cases

#### TC-A11Y-1: Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Verify all buttons are keyboard accessible
- [ ] Verify Enter/Space activates buttons

#### TC-A11Y-2: Screen Reader
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify button labels are announced
- [ ] Verify status changes are announced
- [ ] Verify navigation is clear

#### TC-A11Y-3: ARIA Labels
- [ ] Verify all buttons have proper labels
- [ ] Verify status changes are announced
- [ ] Verify loading states are announced

---

## Edge Cases

### Test Cases

#### TC-EDGE-1: No Opportunities
- [ ] Test dashboard with no opportunities
- [ ] Verify empty state appears
- [ ] Verify infinite scroll doesn't trigger

#### TC-EDGE-2: Single Opportunity
- [ ] Test with only one opportunity
- [ ] Verify all features work
- [ ] Verify no errors

#### TC-EDGE-3: Very Long Text
- [ ] Test with opportunity with very long company name
- [ ] Verify UI doesn't break
- [ ] Verify calendar file handles long text

#### TC-EDGE-4: Special Characters
- [ ] Test with opportunities containing special characters
- [ ] Verify calendar file handles special characters
- [ ] Verify sharing handles special characters

---

## Security Tests

### Test Cases

#### TC-SEC-1: RLS Policies
- [ ] Verify users can only see their own saved/applied opportunities
- [ ] Try to access another user's data via API
- [ ] Verify access is denied

#### TC-SEC-2: Authentication
- [ ] Test features while logged out
- [ ] Verify proper redirect to login
- [ ] Verify no data leakage

---

## Test Results Summary

### Pass/Fail Tracking
- Total Test Cases: ___
- Passed: ___
- Failed: ___
- Skipped: ___

### Critical Issues Found
1. 
2. 
3. 

### Minor Issues Found
1. 
2. 
3. 

### Notes
- 

---

## Next Steps After Testing

1. Fix any critical issues found
2. Document any known limitations
3. Update user documentation if needed
4. Deploy to staging/production
5. Monitor for issues in production

