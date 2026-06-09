# Stage 1

## Objective
Implement a Priority Inbox that returns the top `n` (10) unread notifications ordered by a combination of type-based weight and recency.

## Approach
- Fetch notifications from the provided API: `http://4.224.186.213/evaluation-service/notifications`.
- If the API is protected or unavailable, the frontend falls back to a small local sample so the UI remains testable.
- Compute a priority score per notification using a weighted scheme where type matters most and recency is secondary.

## Scoring algorithm
- Type weights (higher = more important):
  - `Placement`: 3000
  - `Result`: 2000
  - `Event`: 1000
- Freshness adds up to +2000 points for very recent notifications and decays with time (minutes since timestamp).
- Final score formula used in code: `score = baseWeight * 1000 + Math.round(freshness)`.

This ensures type dominates ordering (placement > result > event), while still promoting recent items among those with the same type.

## Complexity
- Computing scores and sorting: O(m log m) where m is the number of notifications returned by the API. We then slice the top `n` items.

## Files changed
- `notification_app_fe/NotificationDashboard.tsx`: fetch + scoring + UI for Priority Inbox.

## How to run / test
1. In the frontend workspace run your usual dev server (e.g. `npm run dev` inside `notification_app_fe`).
2. If the API requires authorization, set an auth token in browser `localStorage` as `AUTH_TOKEN` (Bearer token will be included automatically).
3. Open the dashboard — it will attempt to fetch the notifications and display the top 10. If the API is inaccessible, sample notifications are used.

## Notes and next steps
- For production, secure the token handling and avoid storing long-lived secrets in `localStorage`.
- Consider implementing a server-side ranking endpoint to move heavy sorting off the client for large datasets, and to respect user-specific unread-state and paging.
- To maintain top-K efficiently as notifications stream in, use a min-heap (size K) or server-side incremental ranking.

--
Created as part of Stage 1 deliverable.
