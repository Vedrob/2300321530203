# Campus Notification System

## Project Overview

This is a **Frontend Track** submission implementing a Priority Inbox notification system that intelligently ranks and displays the most important unread notifications based on type priority and recency.

## Architecture

The system is built with the following components:

### Frontend Application (`notification_app_fe/`)
- **Framework:** React 18 + TypeScript + Vite
- **Purpose:** Displays a priority-ranked inbox of notifications
- **Key Feature:** Fetches notifications from a protected API and ranks them by importance

### Logging Middleware (`logging_middleware/`)
- **Language:** TypeScript
- **Purpose:** Provides a reusable logging utility for tracking application events
- **API Integration:** Sends logs to the evaluation service for monitoring

## Priority Ranking Algorithm

Notifications are ranked using a two-factor scoring system:

1. **Type Weight (Primary Factor)**
   - Placement: 3000 points
   - Result: 2000 points
   - Event: 1000 points

2. **Recency Boost (Secondary Factor)**
   - Up to +2000 points for very recent notifications
   - Decays over time (minutes since notification timestamp)

**Formula:** `score = baseWeight × 1000 + freshness_boost`

This ensures type-based priority dominates while still promoting recent items within the same type.

## How to Run

### Prerequisites
- Node.js 18+ and npm

### Installation & Development

```bash
cd notification_app_fe
npm install
npm run dev
```

The frontend will start at `http://localhost:5174/`

### Authentication

The app requires a bearer token to access the notifications API:
1. Set the token in browser localStorage:
   ```js
   localStorage.setItem('AUTH_TOKEN', 'your_bearer_token_here');
   ```
2. Refresh the page

### API Endpoints Used

- **Notifications API:** `GET http://4.224.186.213/evaluation-service/notifications`
  - Protected route (requires bearer token)
  - Returns array of notification objects

- **Logging API:** `POST http://4.224.186.213/evaluation-service/logs`
  - Protected route (requires bearer token)
  - Logs application events

## Project Structure

```
├── logging_middleware/
│   └── logger.ts                 # Reusable logging utility
├── notification_app_fe/
│   ├── src/
│   │   ├── App.tsx              # Main application component
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Styling
│   ├── NotificationDashboard.tsx # Priority inbox component
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── Notification System Design.md # Technical design documentation
└── README.md                      # This file
```

## Key Features

✅ **Real-time Notification Fetching** - Pulls data from protected API with bearer token auth  
✅ **Smart Priority Ranking** - Combines type importance + recency for optimal ordering  
✅ **Top-N Display** - Shows top 10 most important notifications  
✅ **Auto-refresh** - Refreshes every 60 seconds  
✅ **Fallback Support** - Uses mock data if API is unavailable  
✅ **Production-grade Logging** - All events logged via logging middleware  

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Vanilla CSS + Material UI principles
- **HTTP Client:** Fetch API
- **Package Manager:** npm
- **Build Tool:** Vite

## Design Decisions

See [Notification System Design.md](Notification%20System%20Design.md) for detailed technical documentation including:
- Algorithm complexity analysis
- Efficiency considerations for top-K maintenance
- Security recommendations
- Future enhancement strategies

## Development Notes

- Follow production-grade coding standards
- All components are TypeScript for type safety
- Logging is integrated throughout the application
- API integration uses bearer token authentication
- Material UI or Vanilla CSS only for styling
