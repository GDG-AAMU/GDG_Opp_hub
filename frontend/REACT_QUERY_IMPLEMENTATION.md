# React Query Implementation Guide

## Overview

This project now uses **React Query (TanStack Query)** for efficient data caching, automatic refetching, and optimistic updates. This implementation dramatically improves performance by:

- Caching opportunity data for instant page loads
- Reducing unnecessary API calls
- Providing optimistic UI updates for admin actions
- Automatic background refetching to keep data fresh
- Better error handling with automatic retries

## Architecture

### Core Files

1. **[providers/QueryProvider.tsx](./providers/QueryProvider.tsx)** - Query client provider wrapper
2. **[hooks/useOpportunities.ts](./hooks/useOpportunities.ts)** - Main hook for fetching opportunities
3. **[hooks/useOpportunityMutations.ts](./hooks/useOpportunityMutations.ts)** - Mutation hooks for create/update/delete

### Configuration

The QueryClient is configured with the following settings in [QueryProvider.tsx](./providers/QueryProvider.tsx):

```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000,        // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000,          // Cache kept for 10 minutes
    refetchOnWindowFocus: false,      // Don't refetch on window focus
    refetchOnMount: false,            // Don't refetch on mount if data is fresh
    retry: 3,                         // Retry failed requests 3 times
    retryDelay: (attemptIndex) =>    // Exponential backoff
      Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  mutations: {
    retry: 1,                         // Retry mutations once on failure
  }
}
```

## Usage

### Fetching Opportunities

The `useOpportunities` hook maintains the same API as before but now uses React Query internally:

```typescript
import { useOpportunities } from '@/hooks/useOpportunities'

function MyComponent() {
  const {
    opportunities,
    loading,
    error,
    pagination,
    refetch,
    fetchMore
  } = useOpportunities({
    types: ['internship', 'full_time'],
    majors: ['Computer Science'],
    status: 'active',
    sort: 'deadline-asc',
    limit: 20,
    autoFetch: true
  })

  // Use opportunities data...
}
```

### Invalidating Cache

To invalidate the opportunities cache (e.g., after creating a new opportunity):

```typescript
import { useInvalidateOpportunities } from '@/hooks/useOpportunities'

function SubmitModal() {
  const invalidateOpportunities = useInvalidateOpportunities()

  const onSuccess = () => {
    // This will refetch all opportunities queries
    invalidateOpportunities()
  }
}
```

### Optimistic Updates (Admin Actions)

For admin actions like editing and deleting opportunities, use the mutation hooks:

#### Update Opportunity

```typescript
import { useUpdateOpportunity } from '@/hooks/useOpportunityMutations'

function EditModal() {
  const updateOpportunity = useUpdateOpportunity()

  const onSubmit = async (data) => {
    try {
      const updated = await updateOpportunity.mutateAsync({
        id: opportunityId,
        data: formData
      })
      // Success! UI already updated optimistically
    } catch (error) {
      // Error handling done in mutation hook
      // UI automatically rolled back on error
    }
  }

  const isSubmitting = updateOpportunity.isPending
}
```

#### Delete Opportunity

```typescript
import { useDeleteOpportunity } from '@/hooks/useOpportunityMutations'

function AdminPanel() {
  const deleteOpportunity = useDeleteOpportunity()

  const handleDelete = async (id) => {
    try {
      await deleteOpportunity.mutateAsync(id)
      // Success! Item removed from UI immediately
    } catch (error) {
      // Error handled in mutation hook
      // UI automatically rolled back
    }
  }

  const isDeleting = deleteOpportunity.isPending
}
```

## How It Works

### Query Keys

Opportunities are cached using structured query keys that include all filter parameters:

```typescript
[
  'opportunities',
  {
    types: ['internship'],
    majors: ['Computer Science'],
    roles: ['Software Engineering'],
    status: 'active',
    sort: 'deadline-asc',
    limit: 20,
    offset: 0
  }
]
```

This ensures that different filter combinations are cached separately.

### Optimistic Updates Flow

1. **User Action**: User clicks "Edit" or "Delete"
2. **Optimistic Update**: UI immediately updates to show the change
3. **API Request**: Request sent to backend
4. **On Success**: Cache invalidated, fresh data fetched in background
5. **On Error**: UI automatically rolled back to previous state, error toast shown

### Cache Invalidation

Cache is invalidated in these scenarios:

1. **After Submission**: When a new opportunity is submitted
2. **After Edit**: When an opportunity is updated
3. **After Delete**: When an opportunity is deleted
4. **Manual Refetch**: When user manually refreshes data
5. **Stale Data**: Automatically after 5 minutes (background refetch)

## Benefits

### Performance

- **Instant Navigation**: Returning to dashboard shows cached data immediately
- **Reduced API Calls**: Data is reused across components
- **Background Updates**: Stale data refreshed in background without blocking UI

### User Experience

- **Optimistic UI**: Changes appear instantly before API confirmation
- **Automatic Rollback**: Failed requests automatically revert UI changes
- **Loading States**: Built-in loading and error states
- **Retry Logic**: Failed requests automatically retried with exponential backoff

### Developer Experience

- **Same API**: Existing components work without changes
- **DevTools**: React Query DevTools available in development
- **Type Safety**: Full TypeScript support
- **Error Handling**: Centralized error handling in mutation hooks

## Testing

### Verify Caching Works

1. Load the dashboard with opportunities
2. Navigate to a different page
3. Return to dashboard - should load instantly with cached data
4. Wait 5 minutes - data should refetch in background

### Verify Optimistic Updates

1. **Edit Test**:
   - Edit an opportunity
   - Watch it update immediately in the list
   - If edit fails, it should revert automatically

2. **Delete Test**:
   - Delete an opportunity
   - Watch it disappear immediately
   - If delete fails, it should reappear with error message

### DevTools

In development, press the React Query DevTools button (bottom-right) to:
- View all cached queries
- See query states (fresh, stale, fetching)
- Manually invalidate queries
- View mutation status

## Troubleshooting

### Data Not Updating

If data doesn't update after mutations:
1. Check that `invalidateOpportunities()` is called after success
2. Verify query keys match between fetch and invalidation
3. Check React Query DevTools to see cache state

### Optimistic Updates Not Working

If optimistic updates don't show:
1. Ensure mutation hooks are used (not direct fetch)
2. Check browser console for errors
3. Verify mutation's `onMutate` is executing

### Cache Persisting Too Long

If stale data shows for too long:
1. Check `staleTime` configuration in QueryProvider
2. Manually call `invalidateOpportunities()` if needed
3. Use `refetch()` for immediate updates

## Migration Notes

The following components were updated to use React Query:

- ✅ [app/layout.tsx](./app/layout.tsx) - Added QueryProvider wrapper
- ✅ [hooks/useOpportunities.ts](./hooks/useOpportunities.ts) - Refactored to use React Query
- ✅ [components/opportunities/SubmitModal.tsx](./components/opportunities/SubmitModal.tsx) - Added cache invalidation
- ✅ [components/admin/EditOpportunityModal.tsx](./components/admin/EditOpportunityModal.tsx) - Uses optimistic updates
- ✅ [components/admin/AdminPanel.tsx](./components/admin/AdminPanel.tsx) - Uses optimistic delete

All existing functionality remains unchanged - the API surface is the same.

## Future Improvements

Potential enhancements to consider:

1. **Infinite Scroll**: Use `useInfiniteQuery` for better pagination
2. **Prefetching**: Prefetch next page on hover
3. **Persistence**: Persist cache to localStorage for offline support
4. **SSR**: Server-side rendering with hydration
5. **Real-time**: Add WebSocket support with automatic cache updates

## Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [Next.js + React Query Guide](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [Optimistic Updates Guide](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
