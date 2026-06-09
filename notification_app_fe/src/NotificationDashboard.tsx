import React, { useEffect, useState } from 'react';
import { Log } from '../../logging_middleware/logger';

type RawNotification = {
  ID: string;
  Type: string; // e.g. "Result", "Placement", "Event"
  Message: string;
  Timestamp: string; // ISO string
  [key: string]: any;
};

type ScoredNotification = RawNotification & { score: number };

const NOTIFICATIONS_API = 'http://4.224.186.213/evaluation-service/notifications';

function computeScore(n: RawNotification): number {
  const type = (n.Type || '').toLowerCase();
  // Base weights: placement > result > event
  const typeWeights: Record<string, number> = {
    placement: 3000,
    result: 2000,
    event: 1000,
  };

  const base = typeWeights[type] ?? 500;

  let freshness = 0;
  try {
    const ts = new Date(n.Timestamp).getTime();
    const now = Date.now();
    const minutes = Math.max(0, (now - ts) / 60000);
    // fresher = higher value; give up to +2000 for very recent ones, decay with time
    freshness = Math.max(0, 2000 - minutes);
  } catch {
    freshness = 0;
  }

  return base * 1000 + Math.round(freshness);
}

// Helper function to rank notifications
function pickTopN(list: RawNotification[], n: number): ScoredNotification[] {
  Log('frontend', 'debug', 'state', `Computing priority scores for ${list.length} notifications.`);
  
  const scored = list.map((it) => {
    const score = computeScore(it);
    return { ...it, score } as ScoredNotification;
  });
  
  // Log scoring details
  scored.forEach((notif) => {
    Log('frontend', 'debug', 'state', `Notification "${notif.Type}" scored ${notif.score}: "${notif.Message.substring(0, 50)}..."`);
  });
  
  scored.sort((a, b) => b.score - a.score);
  const topN = scored.slice(0, n);
  
  Log('frontend', 'info', 'state', `Ranked and selected top ${topN.length} of ${list.length} notifications for display.`);
  return topN;
}

// Helper function to load mock notifications
function loadMock(): RawNotification[] {
  Log('frontend', 'warn', 'state', 'Loading mock notification data for demonstration/fallback.');
  
  const mockData = [
    { ID: '1', Type: 'Placement', Message: 'You were placed in lab A', Timestamp: new Date().toISOString() },
    { ID: '2', Type: 'Result', Message: 'Result: mid-sem declared', Timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { ID: '3', Type: 'Event', Message: 'Campus event tomorrow', Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  ];
  
  Log('frontend', 'debug', 'state', `Mock data initialized with ${mockData.length} sample notifications.`);
  return mockData;
}

export default function NotificationDashboard() {
  const [topNotifications, setTopNotifications] = useState<ScoredNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchAndScore = async () => {
      setLoading(true);
      setError(null);
      
      // Log component initialization
      Log('frontend', 'info', 'component', 'NotificationDashboard mounted. Initiating notification fetch.');
      
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('AUTH_TOKEN');
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          Log('frontend', 'info', 'api', 'Authorization token found in localStorage. Preparing authenticated API request.');
        } else {
          Log('frontend', 'warn', 'api', 'No authorization token found in localStorage. API request may be rejected.');
        }

        // Log API call attempt
        Log('frontend', 'debug', 'api', `Initiating fetch request to ${NOTIFICATIONS_API}`);
        const res = await fetch(NOTIFICATIONS_API, { headers });
        Log('frontend', 'info', 'api', `API response received with status code: ${res.status}`);
        
        if (!res.ok) {
          // Log API error and fallback strategy
          Log('frontend', 'error', 'api', `API request failed with status ${res.status}. Falling back to mock data for demonstration.`);
          setError(`API responded ${res.status}. Using local sample data.`);
          if (!mounted) return;
          const mock = loadMock();
          const rankedNotifications = pickTopN(mock, 10);
          setTopNotifications(rankedNotifications);
          Log('frontend', 'info', 'state', `Fallback: Loaded ${mock.length} mock notifications, ranked to top ${rankedNotifications.length}.`);
          setLoading(false);
          return;
        }

        const payload = await res.json();
        const list: RawNotification[] = (payload.notifications ?? payload) || [];
        
        if (list.length === 0) {
          Log('frontend', 'warn', 'state', 'API returned empty notification list.');
        } else {
          Log('frontend', 'info', 'state', `API returned ${list.length} notifications. Computing priority scores for ranking.`);
        }
        
        if (!mounted) return;
        const rankedNotifications = pickTopN(list, 10);
        setTopNotifications(rankedNotifications);
        
        // Log successful completion
        Log('frontend', 'info', 'component', `Priority Inbox updated. Displaying top ${rankedNotifications.length} notifications to user.`);
      } catch (err: any) {
        // Log exceptions
        const errorMsg = err instanceof Error ? err.message : String(err);
        Log('frontend', 'fatal', 'api', `Network error during notification fetch: ${errorMsg}`);
        setError('Fetch failed; using sample notifications.');
        if (!mounted) return;
        const mock = loadMock();
        const rankedNotifications = pickTopN(mock, 10);
        setTopNotifications(rankedNotifications);
        Log('frontend', 'info', 'state', `Exception handled. Loaded ${rankedNotifications.length} mock notifications as fallback.`);
      } finally {
        if (mounted) {
          setLoading(false);
          Log('frontend', 'debug', 'component', 'Notification fetch cycle completed. Loading state reset.');
        }
      }
    };

    // Initial fetch
    fetchAndScore();
    
    // Set up auto-refresh interval
    const interval = setInterval(() => {
      Log('frontend', 'debug', 'component', 'Auto-refresh interval triggered. Fetching latest notifications.');
      fetchAndScore();
    }, 60_000); // refresh every minute
    
    return () => {
      mounted = false;
      clearInterval(interval);
      Log('frontend', 'debug', 'component', 'NotificationDashboard unmounted. Cleanup complete.');
    };
  }, []);

  return (
    <div className="dashboard-container">
      <header className="app-header">
        <h2>Priority Inbox (Top 10)</h2>
        <p>Notifications are ranked by type priority (Placement &gt; Result &gt; Event) and recency.</p>
      </header>

      <main className="notifications-list">
        {loading && <p>Loading notifications…</p>}
        {error && <p style={{ color: 'orange' }}>{error}</p>}

        {!loading && topNotifications.length === 0 && (
          <p>No unread notifications found.</p>
        )}

        <ol>
          {topNotifications.map((n) => (
            <li key={n.ID} style={{ textAlign: 'left', margin: '8px 0' }}>
              <div style={{ fontWeight: 600 }}>{n.Type} — {n.Message}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{new Date(n.Timestamp).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#666' }}>priority score: {n.score}</div>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}