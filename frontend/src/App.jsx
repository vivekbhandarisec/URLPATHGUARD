import { useEffect, useMemo, useState } from 'react';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import AlertDetailsPage from './pages/AlertDetailsPage';
import TrialPage from './pages/TrialPage';
import MarketingPage from './pages/MarketingPage';

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

function readRoute() {
  const raw = (window.location.hash || '#/').replace(/^#/, '');
  const parts = raw.split('/').filter(Boolean);

  if (parts[0] === 'alerts' && parts[1]) {
    return { page: 'details', alertId: decodeURIComponent(parts[1]) };
  }

  if (parts[0] === 'alerts') return { page: 'alerts', alertId: null };
  if (parts[0] === 'dashboard') return { page: 'dashboard', alertId: null };
  if (parts[0] === 'trial') return { page: 'trial', alertId: null };

  return { page: 'marketing', alertId: null };
}

function formatTimestamp(value) {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function multiDecode(input) {
  if (!input) return '';
  let decoded = input;
  for (let i = 0; i < 2; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function severityFromRisk(risk) {
  if (risk >= 90) return 'Critical';
  if (risk >= 70) return 'High';
  if (risk >= 40) return 'Medium';
  return 'Low';
}

function seedRisk(row) {
  if (typeof row.risk_score === 'number') return row.risk_score;
  const sev = (row.severity || '').toLowerCase();
  if (sev === 'critical') return 95;
  if (sev === 'high') return 78;
  if (sev === 'medium') return 52;
  return 22;
}

function normalizeAlert(row, index) {
  const riskScore = seedRisk(row);
  const id = row.id ?? row.alert_id ?? `${row.ip || 'unknown'}-${index}-${Date.now()}`;
  const severity = row.severity || severityFromRisk(riskScore);

  return {
    id: String(id),
    timestamp: formatTimestamp(row.timestamp || row.created_at),
    sourceIp: row.source_ip || row.ip || '-',
    country: row.country || row.geo?.country || 'Unknown',
    method: (row.method || row.http_method || 'GET').toUpperCase(),
    urlPath: row.url_path || row.url || row.path || '/',
    decodedUrl: row.decoded_url || multiDecode(row.url_path || row.url || row.path || '/'),
    attackType: row.attack_type || row.rule_name || 'Unknown',
    severity: SEVERITY_LEVELS.includes(severity) ? severity : 'Low',
    statusCode: row.status_code || row.status || '-',
    riskScore,
    fullRequest: row.full_http_request || row.request || `${row.method || 'GET'} ${row.url || row.path || '/'} HTTP/1.1`,
    triggeredRule: row.triggered_rule || row.rule || row.attack_type || 'n/a',
    rawPayload: row.raw_payload || row.payload || row.url || row.path || '',
    previousActivity: Array.isArray(row.previous_activity) ? row.previous_activity : [],
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} failed with status ${response.status}`);
  return response.json();
}

function last24HoursCount(alerts) {
  const threshold = Date.now() - 24 * 60 * 60 * 1000;
  return alerts.filter((item) => new Date(item.timestamp).getTime() >= threshold).length;
}

function buildStats(alerts, statsApi) {
  const severityDistribution = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  const attackTypeBreakdown = {};
  const ipCounts = {};

  alerts.forEach((alert) => {
    severityDistribution[alert.severity] += 1;
    attackTypeBreakdown[alert.attackType] = (attackTypeBreakdown[alert.attackType] || 0) + 1;
    ipCounts[alert.sourceIp] = (ipCounts[alert.sourceIp] || 0) + 1;
  });

  const timelineMap = {};
  alerts.forEach((alert) => {
    const stamp = new Date(alert.timestamp);
    const bucket = new Date(stamp.getFullYear(), stamp.getMonth(), stamp.getDate(), stamp.getHours()).toISOString();
    timelineMap[bucket] = (timelineMap[bucket] || 0) + 1;
  });

  const timeline = Object.entries(timelineMap)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-24)
    .map(([bucket, count]) => ({ bucket, count }));

  const topIps = Object.entries(ipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));

  return {
    totalAlerts: statsApi?.total_alerts ?? alerts.length,
    alerts24h: statsApi?.alerts_last_24h ?? last24HoursCount(alerts),
    attackTypeBreakdown,
    severityDistribution,
    topIps,
    timeline,
  };
}

function App() {
  const [route, setRoute] = useState(readRoute);
  const [alerts, setAlerts] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [statsApi, setStatsApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [lastUploadedFile, setLastUploadedFile] = useState('');

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [alertsRes, statsRes, statusRes] = await Promise.allSettled([
          fetchJson('/api/alerts'),
          fetchJson('/api/stats'),
          fetchJson('/api/system-status'),
        ]);

        if (!active) return;

        const alertsPayload = alertsRes.status === 'fulfilled' ? alertsRes.value : [];
        const normalized = (Array.isArray(alertsPayload) ? alertsPayload : alertsPayload.alerts || []).map(normalizeAlert);
        setAlerts(normalized);

        setStatsApi(statsRes.status === 'fulfilled' ? statsRes.value : null);
        setSystemStatus(statusRes.status === 'fulfilled' ? statusRes.value : { status: 'degraded' });

        if (alertsRes.status === 'rejected' && statsRes.status === 'rejected' && statusRes.status === 'rejected') {
          setError('Unable to reach backend APIs. Dashboard is showing empty data.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    const intervalId = window.setInterval(loadData, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  async function handleUpload(file) {
    if (!file) return false;

    setUploading(true);
    setUploadError('');
    setUploadProgress(4);

    const timer = window.setInterval(() => {
      setUploadProgress((prev) => (prev >= 92 ? prev : prev + 7));
    }, 180);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-log', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Upload failed (${response.status})`);

      const payload = await response.json();
      const events = Array.isArray(payload.events) ? payload.events : [];
      setAlerts(events.map(normalizeAlert));
      setLastUploadedFile(file.name);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
      window.location.hash = '#/dashboard';
      return true;
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
      return false;
    } finally {
      window.clearInterval(timer);
      setUploading(false);
    }
  }

  const stats = useMemo(() => buildStats(alerts, statsApi), [alerts, statsApi]);
  const selectedAlert = alerts.find((item) => item.id === route.alertId) || null;

  const statusText = (systemStatus?.status || 'unknown').toString();
  const statusClass = statusText === 'ok' || statusText === 'healthy' ? 'health-ok' : 'health-degraded';

  const inToolMode = route.page !== 'marketing';

  return (
    <div className={inToolMode ? 'soc-shell' : 'site-shell'}>
      {route.page === 'marketing' ? (
        <MarketingPage onGetStarted={() => { window.location.hash = '#/trial'; }} />
      ) : (
        <>
          <header className="soc-header cyber-topbar">
            <div className="topbar-left">
              <p className="soc-eyebrow">URLPathGuard ?</p>
              <h1>CyberPulse SOC Interface</h1>
            </div>
            <div className={`health-pill ${statusClass}`}>
              <span className="health-dot" />
              <span>STATUS: {statusText.toUpperCase()}</span>
            </div>
          </header>

          <nav className="soc-nav">
            <a href="#/dashboard" className={route.page === 'dashboard' ? 'active' : ''}>Dashboard</a>
            <a href="#/alerts" className={route.page === 'alerts' ? 'active' : ''}>Alerts</a>
            <a href="#/trial" className={route.page === 'trial' ? 'active' : ''}>System</a>
            <a href="#/" >Website</a>
            <a href={route.page === 'details' && route.alertId ? `#/alerts/${encodeURIComponent(route.alertId)}` : '#/alerts'} className={route.page === 'details' ? 'active' : ''}>Details</a>
          </nav>

          {error ? <div className="global-error">{error}</div> : null}

          {route.page === 'trial' ? (
            <TrialPage
              stats={stats}
              onUpload={handleUpload}
              uploading={uploading}
              uploadError={uploadError}
              uploadProgress={uploadProgress}
              lastUploadedFile={lastUploadedFile}
            />
          ) : null}
          {route.page === 'dashboard' ? <DashboardPage stats={stats} alerts={alerts} loading={loading} systemStatus={systemStatus} /> : null}
          {route.page === 'alerts' ? (
            <AlertsPage
              alerts={alerts}
              loading={loading}
              onUpload={handleUpload}
              uploading={uploading}
              uploadError={uploadError}
              lastUploadedFile={lastUploadedFile}
            />
          ) : null}
          {route.page === 'details' ? (
            <AlertDetailsPage selectedAlert={selectedAlert} allAlerts={alerts} loading={loading} />
          ) : null}
        </>
      )}
    </div>
  );
}

export default App;
