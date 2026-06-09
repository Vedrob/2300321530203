# Stage 1

## Objective
Implement a Priority Inbox that displays the top 10 most important unread notifications, ranked by a combination of type-based weight (Placement > Result > Event) and recency. The system must integrate extensive logging throughout the lifecycle to capture all significant events and state changes.

---

## Architecture Overview

### Components
1. **NotificationDashboard Component** (`src/NotificationDashboard.tsx`)
   - Fetches notifications from protected API
   - Computes priority scores for each notification
   - Ranks and displays top 10
   - Integrates extensive logging via `Log()` middleware
   - Handles API failures with graceful fallback

2. **Logging Middleware** (`logging_middleware/logger.ts`)
   - Sends all application events to the evaluation service
   - Tracks: component lifecycle, API calls, state changes, errors, and user interactions
   - Required parameters: `stack`, `level`, `package`, `message` (all lowercase)

---

## Priority Scoring Algorithm

### Formula
```
score = (baseWeight × 1000) + freshness_boost
```

### Weight System
| Type | Base Weight | Purpose |
|------|-------------|---------|
| Placement | 3000 | Highest priority (job placements) |
| Result | 2000 | Medium priority (exam/project results) |
| Event | 1000 | Lower priority (campus events) |

### Freshness Boost
- **Calculation**: Linear decay based on minutes since notification timestamp
- **Maximum boost**: +2000 points (for notifications < 1 minute old)
- **Decay rate**: Decreases by ~1 point per minute
- **Purpose**: Prioritizes recent notifications within the same type

### Example Scoring
| Notification | Type | Minutes Old | Base Score | Freshness | Total |
|--------------|------|-------------|-----------|-----------|-------|
| Lab placement | Placement | 2 | 3,000,000 | +1,998 | 3,001,998 |
| Mid-sem result | Result | 60 | 2,000,000 | +1,940 | 2,001,940 |
| Campus event | Event | 1440 | 1,000,000 | +560 | 1,000,560 |

---

## Extensive Logging Integration

### Logging Coverage

The implementation logs **ALL** significant application events:

#### 1. **Component Lifecycle Logging**
```typescript
Log('frontend', 'info', 'component', 'NotificationDashboard mounted. Initiating notification fetch.');
Log('frontend', 'debug', 'component', 'Auto-refresh interval triggered. Fetching latest notifications.');
Log('frontend', 'debug', 'component', 'NotificationDashboard unmounted. Cleanup complete.');
```

#### 2. **API Interaction Logging**
```typescript
Log('frontend', 'info', 'api', 'Authorization token found in localStorage...');
Log('frontend', 'debug', 'api', `Initiating fetch request to ${NOTIFICATIONS_API}`);
Log('frontend', 'info', 'api', `API response received with status code: ${res.status}`);
Log('frontend', 'error', 'api', `API request failed with status ${res.status}...`);
Log('frontend', 'fatal', 'api', `Network error during notification fetch: ${errorMsg}`);
```

#### 3. **State Management Logging**
```typescript
Log('frontend', 'info', 'state', `API returned ${list.length} notifications...`);
Log('frontend', 'debug', 'state', `Computing priority scores for ${list.length} notifications.`);
Log('frontend', 'debug', 'state', `Notification "${type}" scored ${score}: "${message}"`);
Log('frontend', 'info', 'state', `Ranked and selected top ${topN.length} of ${list.length} notifications...`);
```

#### 4. **Error & Exception Logging**
```typescript
Log('frontend', 'warn', 'state', 'API returned empty notification list.');
Log('frontend', 'warn', 'api', 'No authorization token found in localStorage...');
Log('frontend', 'warn', 'state', 'Loading mock notification data for demonstration/fallback.');
```

### Log Levels Used
- **debug**: Detailed diagnostic information (loops, calculations)
- **info**: General informational messages (state changes, API responses)
- **warn**: Warning messages (missing tokens, empty responses, fallbacks)
- **error**: Error conditions (API failures, non-critical issues)
- **fatal**: Critical errors (network failures, unexpected exceptions)

### Log Packages Used
- **component**: Component lifecycle events
- **api**: API call attempts and responses
- **state**: State mutations and calculations

---

## Data Flow

### Successful Path (API Available)
```
1. Component mounts → Log: "NotificationDashboard mounted"
2. Token check → Log: "Authorization token found"
3. API fetch initiated → Log: "Initiating fetch request"
4. API response received → Log: "API response received with status 200"
5. Parse notifications → Log: "API returned N notifications"
6. Score & rank → Log: "Computing priority scores"
7. Display top 10 → Log: "Priority Inbox updated. Displaying top N"
```

### Fallback Path (API Unavailable)
```
1. API call fails → Log: "API request failed with status 401"
2. Load mock data → Log: "Loading mock notification data"
3. Score & rank → Log: "Computing priority scores for mock data"
4. Display fallback → Log: "Fallback: Loaded N mock notifications"
```

---

## Complexity Analysis

| Operation | Time | Space | Notes |
|-----------|------|-------|-------|
| Fetch notifications | O(1) network | O(n) | n = total notifications |
| Score computation | O(n) | O(n) | Linear pass through data |
| Sorting | O(n log n) | O(1) | Quicksort/Timsort |
| **Total** | **O(n log n)** | **O(n)** | Dominated by sort |

For the frontend-only approach (top-10 on client), sorting all notifications is acceptable since:
- Most campus systems have < 10K notifications
- Refresh interval is 60 seconds (batched operations)
- Top-K extraction is O(n) after sort (slice operation)

---

## Efficiency: Maintaining Top-10

### Current Approach (Sufficient for Stage 1)
- **Fetch all notifications**: Simple, transparent
- **Sort all**: O(n log n)
- **Slice top 10**: O(1)
- **Refresh**: Every 60 seconds

### Future Optimization (For Streaming/High Volume)
- **Min-heap on client**: Keep only top 10 as notifications stream
- **Server-side filtering**: Return pre-ranked top-N from API
- **Incremental updates**: Only re-rank on new notifications
- **Pagination**: Load notifications in batches

---

## Files and Structure

```
notification_app_fe/
├── src/
│   ├── App.tsx                    # Main app component (renders NotificationDashboard)
│   ├── NotificationDashboard.tsx  # Priority inbox with logging
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Styling
├── package.json                   # Dependencies
└── vite.config.ts                 # Build config

logging_middleware/
└── logger.ts                      # Reusable logging function with API integration
```

---

## How to Run & Test

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
cd notification_app_fe
npm install
npm run dev
```

### Access
- URL: `http://localhost:5175/` (or next available port)
- Automatically loads from `localStorage.AUTH_TOKEN` if present

### Testing with API
```javascript
// In browser console:
localStorage.setItem('AUTH_TOKEN', 'your_bearer_token_here');
// Page will auto-refresh and fetch from API
```

### Testing Fallback
- Leave token unset or invalid
- App automatically loads mock data (3 sample notifications)
- Displays: "API responded 401. Using local sample data."

---

## Logging Middleware API

### Function Signature
```typescript
Log(stack: string, level: string, package: string, message: string): Promise<void>
```

### Parameters
| Parameter | Values | Example |
|-----------|--------|---------|
| `stack` | "frontend" | "frontend" |
| `level` | "debug", "info", "warn", "error", "fatal" | "info" |
| `package` | "component", "api", "state", etc. | "api" |
| `message` | Descriptive string | "API response received with status 200" |

### Example Usage
```typescript
Log('frontend', 'info', 'component', 'Priority Inbox loaded successfully');
Log('frontend', 'error', 'api', 'Failed to fetch notifications: Network timeout');
```

---

## Security & Best Practices

### Current Implementation
- ✅ Bearer token authentication
- ✅ HTTPS ready (API uses https URL)
- ✅ Extensive audit logging
- ⚠️ localStorage token storage (acceptable for evaluation)

### Production Recommendations
- Move authentication to backend (no client-side token storage)
- Implement token refresh mechanism
- Add request signing for additional security
- Use IndexedDB for sensitive data instead of localStorage
- Implement rate limiting on logging calls
- Add data sanitization for log messages

---

## Assumptions & Constraints

### API Assumptions
- Notifications endpoint returns: `{ "notifications": [...] }`
- Notifications have fields: `ID`, `Type`, `Message`, `Timestamp`
- API is protected (requires Bearer token)
- API may be temporarily unavailable

### Frontend Assumptions
- Users have localStorage enabled
- No database required (fetch-and-rank approach)
- Sorting thousands of notifications on client is acceptable
- 60-second refresh interval is sufficient

### Evaluation Constraints
- No external algorithm libraries for ranking
- Custom scoring algorithm implemented
- Extensive logging required throughout
- Must handle API failures gracefully

---

## Stage 1 Deliverables Checklist

- ✅ Priority ranking algorithm (type weight + recency)
- ✅ Top-10 display UI (React + TypeScript)
- ✅ API integration with bearer token auth
- ✅ Extensive logging throughout component lifecycle
- ✅ Graceful fallback to mock data
- ✅ Auto-refresh every 60 seconds
- ✅ Screenshots of working application
- ✅ Code pushed to GitHub with clear commits
- ✅ Technical documentation (this file)

---

**Stage 1 Status**: ✅ **COMPLETE**  
**Date Completed**: June 9, 2026  
**Repository**: https://github.com/Vedrob/2300321530203

