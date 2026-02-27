function DashboardPage({ stats, alerts, loading, systemStatus }) {
  const breakdownEntries = Object.entries(stats.attackTypeBreakdown || {}).sort((a, b) => b[1] - a[1]);
  const severityEntries = Object.entries(stats.severityDistribution || {});

  const critical = stats.severityDistribution?.Critical || 0;
  const high = stats.severityDistribution?.High || 0;
  const medium = stats.severityDistribution?.Medium || 0;
  const base = 100;
  const postureScore = Math.max(0, base - (critical * 12 + high * 7 + medium * 3));

  const activeIncidents = [...alerts]
    .filter((item) => item.severity === 'Critical' || item.severity === 'High')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  const liveFeed = [...alerts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  const detectionLatency = alerts.length ? '2.1s' : 'n/a';

  return (
    <main className="soc-content dashboard-grid">
      <section className="panel stat-cards">
        <article className="stat-card"><p>Total Alerts</p><h2>{loading ? '-' : stats.totalAlerts}</h2></article>
        <article className="stat-card"><p>Critical Alerts</p><h2>{stats.severityDistribution?.Critical || 0}</h2></article>
        <article className="stat-card"><p>Active IPs</p><h2>{stats.topIps?.length || 0}</h2></article>
        <article className="stat-card"><p>Alerts (Last 24h)</p><h2>{loading ? '-' : stats.alerts24h}</h2></article>
      </section>

      <section className="panel posture-panel">
        <div className="panel-title-row">
          <h3>Security Posture Score</h3>
          <span className={`status-tag ${postureScore > 75 ? 'tag-good' : postureScore > 50 ? 'tag-mid' : 'tag-bad'}`}>
            {postureScore > 75 ? 'Stable' : postureScore > 50 ? 'Watch' : 'Critical'}
          </span>
        </div>
        <Gauge value={postureScore} />
        <div className="posture-meta">
          <div><span>System Status</span><strong>{systemStatus?.status || 'unknown'}</strong></div>
          <div><span>Detection Latency</span><strong>{detectionLatency}</strong></div>
          <div><span>Rule Coverage</span><strong>{Object.keys(stats.attackTypeBreakdown || {}).length} families</strong></div>
        </div>
      </section>

      <section className="panel panel-wide">
        <div className="panel-title-row">
          <h3>Attack Timeline</h3>
          <span className="live-chip"><i /> Live stream</span>
        </div>
        <LineTimeline points={stats.timeline} />
      </section>

      <section className="panel">
        <div className="panel-title-row"><h3>Attack Type Breakdown</h3></div>
        <div className="stack-list">
          {breakdownEntries.length === 0 ? <p className="muted">No alerts to display.</p> : null}
          {breakdownEntries.map(([type, count]) => (
            <div className="bar-row" key={type}>
              <span>{type}</span><strong>{count}</strong>
              <div className="bar-track"><div style={{ width: `${Math.max(8, (count / Math.max(...breakdownEntries.map(([, c]) => c), 1)) * 100)}%` }} className="bar-fill bar-blue" /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title-row"><h3>Severity Distribution</h3></div>
        <div className="stack-list">
          {severityEntries.map(([severity, count]) => (
            <div className="bar-row" key={severity}>
              <span>{severity}</span><strong>{count}</strong>
              <div className="bar-track"><div style={{ width: `${Math.max(8, (count / Math.max(...severityEntries.map(([, c]) => c), 1)) * 100)}%` }} className={`bar-fill sev-${severity.toLowerCase()}`} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title-row"><h3>Top Attacking IPs</h3></div>
        <div className="ip-list">
          {stats.topIps.length === 0 ? <p className="muted">No IP activity available.</p> : null}
          {stats.topIps.map((item) => (
            <div className="ip-item" key={item.ip}><code>{item.ip}</code><span>{item.count} alerts</span></div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title-row">
          <h3>Live Alert Feed</h3>
          <span className="live-chip"><i /> ONLINE</span>
        </div>
        <div className="feed-list">
          {liveFeed.length === 0 ? <p className="muted">No live feed activity.</p> : null}
          {liveFeed.map((item, idx) => {
            const isNew = Date.now() - new Date(item.timestamp).getTime() < 8 * 60 * 1000;
            return (
              <a key={item.id} href={`#/alerts/${encodeURIComponent(item.id)}`} className="feed-item" style={{ animationDelay: `${idx * 60}ms` }}>
                <div>
                  <strong>{item.attackType}</strong>
                  <p>{item.sourceIp}  {item.urlPath}</p>
                </div>
                <span className={`severity-pill sev-${item.severity.toLowerCase()}`}>{isNew ? 'NEW ' : ''}{item.severity}</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="panel panel-wide">
        <div className="panel-title-row"><h3>Detailed Alert Queue</h3><a href="#/alerts">Open full queue</a></div>
        {activeIncidents.length === 0 ? <p className="muted">No high-priority incidents currently.</p> : null}
        {activeIncidents.length > 0 ? (
          <div className="table-wrap">
            <table className="soc-table">
              <thead><tr><th>Timestamp</th><th>IP</th><th>Attack</th><th>Path</th><th>Severity</th><th>Risk</th></tr></thead>
              <tbody>
                {activeIncidents.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                    <td><code>{item.sourceIp}</code></td>
                    <td>{item.attackType}</td>
                    <td className="url-col"><a href={`#/alerts/${encodeURIComponent(item.id)}`}>{item.urlPath}</a></td>
                    <td><span className={`severity-pill sev-${item.severity.toLowerCase()}`}>{item.severity}</span></td>
                    <td>{item.riskScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Gauge({ value }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, value));
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div className="gauge-wrap">
      <svg width="150" height="150" viewBox="0 0 150 150" className="gauge-svg">
        <circle cx="75" cy="75" r={radius} className="gauge-bg" />
        <circle cx="75" cy="75" r={radius} className="gauge-fill" style={{ strokeDasharray: circumference, strokeDashoffset: offset }} />
      </svg>
      <div className="gauge-value"><strong>{safe}</strong><span>Posture Score</span></div>
    </div>
  );
}

function LineTimeline({ points }) {
  if (!points || points.length === 0) return <p className="muted">No timeline points available.</p>;

  const max = Math.max(...points.map((p) => p.count), 1);
  const width = 860;
  const height = 220;
  const pad = 18;
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = pad + i * step;
    const y = height - pad - (p.count / max) * (height - pad * 2);
    return { x, y, p };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <div className="line-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="line-chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00f5ff" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <polyline className="timeline-line" points={polyline} />
        {coords.map((c) => (
          <circle key={c.p.bucket} cx={c.x} cy={c.y} r="3.5" className="timeline-dot" />
        ))}
      </svg>
      <div className="timeline-labels">
        {points.map((point) => (
          <span key={point.bucket}>{new Date(point.bucket).getHours().toString().padStart(2, '0')}</span>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;
