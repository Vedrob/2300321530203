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

export default function NotificationDashboard() {
  const [topNotifications, setTopNotifications] = useState<ScoredNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchAndScore() {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('AUTH_TOKEN');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(NOTIFICATIONS_API, { headers });
        if (!res.ok) {
          // If protected, fallback to mock data and surface message
          setError(`API responded ${res.status}. Using local sample data.`);
          const mock = await loadMock();
          if (!mounted) return;
          setTopNotifications(pickTopN(mock, 10));
          setLoading(false);
          return;
        }

        const payload = await res.json();
        const list: RawNotification[] = (payload.notifications ?? payload) || [];
        if (!mounted) return;
        setTopNotifications(pickTopN(list, 10));
      } catch (err: any) {
        setError('Fetch failed; using sample notifications.');
        const mock = await loadMock();
        if (!mounted) return;
        setTopNotifications(pickTopN(mock, 10));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAndScore();
    const interval = setInterval(fetchAndScore, 60_000); // refresh every minute
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  function pickTopN(list: RawNotification[], n: number): ScoredNotification[] {
    const scored = list.map((it) => ({ ...it, score: computeScore(it) } as ScoredNotification));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, n);
  }

  async function loadMock(): Promise<RawNotification[]> {
    // Minimal sample set if API is inaccessible
    return [
      { ID: '1', Type: 'Placement', Message: 'You were placed in lab A', Timestamp: new Date().toISOString() },
      { ID: '2', Type: 'Result', Message: 'Result: mid-sem declared', Timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
      { ID: '3', Type: 'Event', Message: 'Campus event tomorrow', Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    ];
  }

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