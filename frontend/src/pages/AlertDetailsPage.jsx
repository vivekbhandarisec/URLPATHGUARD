import { useEffect, useMemo, useState } from 'react';

function severityClass(severity) {
  const value = String(severity || 'Low').toLowerCase();
  if (value === 'critical') return 'sev-critical';
  if (value === 'high') return 'sev-high';
  if (value === 'medium') return 'sev-medium';
  return 'sev-low';
}

async function fetchAlertDetails(id) {
  try {
    const response = await fetch(`/api/alerts/${encodeURIComponent(id)}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function AlertDetailsPage({ selectedAlert, allAlerts, loading }) {
  const [liveDetails, setLiveDetails] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!selectedAlert) {
        setLiveDetails(null);
        return;
      }
      const result = await fetchAlertDetails(selectedAlert.id);
      if (mounted && result) setLiveDetails(result);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [selectedAlert]);

  useEffect(() => {
    if (!selectedAlert) return;
    const saved = localStorage.getItem(`note-${selectedAlert.id}`) || '';
    setNote(saved);
  }, [selectedAlert]);

  const previousFromSameIp = useMemo(() => {
    if (!selectedAlert) return [];

    return allAlerts
      .filter((item) => item.sourceIp === selectedAlert.sourceIp && item.id !== selectedAlert.id)
      .slice(0, 10);
  }, [allAlerts, selectedAlert]);

  if (loading) {
    return (
      <main className="soc-content">
        <section className="panel"><p className="muted">Loading alert details...</p></section>
      </main>
    );
  }

  if (!selectedAlert) {
    return (
      <main className="soc-content">
        <section className="panel">
          <h3>Alert Details</h3>
          <p className="muted">Select an alert from the Alerts page.</p>
          <a href="#/alerts">Open Alerts</a>
        </section>
      </main>
    );
  }

  const details = liveDetails || selectedAlert;

  return (
    <main className="soc-content details-grid">
      <section className="panel panel-wide">
        <div className="panel-title-row">
          <h3>Alert Details</h3>
          <span className={`severity-pill ${severityClass(details.severity || selectedAlert.severity)}`}>
            {details.severity || selectedAlert.severity}
          </span>
        </div>

        <div className="kv-grid">
          <div><span>Timestamp</span><strong>{new Date(selectedAlert.timestamp).toLocaleString()}</strong></div>
          <div><span>Source IP</span><strong>{selectedAlert.sourceIp}</strong></div>
          <div><span>Attack Type</span><strong>{details.attack_type || selectedAlert.attackType}</strong></div>
          <div><span>Status Code</span><strong>{details.status_code || selectedAlert.statusCode}</strong></div>
          <div><span>Risk Score</span><strong>{details.risk_score ?? selectedAlert.riskScore}</strong></div>
          <div><span>Triggered Rule</span><strong>{details.triggered_rule || selectedAlert.triggeredRule}</strong></div>
        </div>
      </section>

      <section className="panel panel-wide">
        <div className="panel-title-row">
          <h3>Full HTTP Request</h3>
          <button type="button" onClick={() => navigator.clipboard.writeText(details.full_http_request || selectedAlert.fullRequest)}>Copy</button>
        </div>
        <pre>{details.full_http_request || selectedAlert.fullRequest}</pre>
      </section>

      <section className="panel">
        <div className="panel-title-row">
          <h3>Decoded URL</h3>
          <button type="button" onClick={() => navigator.clipboard.writeText(details.decoded_url || selectedAlert.decodedUrl)}>Copy</button>
        </div>
        <pre>{details.decoded_url || selectedAlert.decodedUrl}</pre>
      </section>

      <section className="panel">
        <h3>Raw Payload</h3>
        <pre>{details.raw_payload || selectedAlert.rawPayload}</pre>
      </section>

      <section className="panel panel-wide">
        <div className="panel-title-row">
          <h3>Analyst Notes</h3>
          <button type="button" onClick={() => localStorage.setItem(`note-${selectedAlert.id}`, note)}>Save Note</button>
        </div>
        <textarea
          className="analyst-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add investigation notes, hypotheses, and response actions..."
        />
      </section>

      <section className="panel panel-wide">
        <h3>Previous Activity from Same IP</h3>
        {previousFromSameIp.length === 0 ? <p className="muted">No previous alerts for this IP.</p> : null}
        {previousFromSameIp.length > 0 ? (
          <div className="table-wrap">
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>URL Path</th>
                  <th>Attack Type</th>
                  <th>Severity</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {previousFromSameIp.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                    <td>{item.urlPath}</td>
                    <td>{item.attackType}</td>
                    <td><span className={`severity-pill ${severityClass(item.severity)}`}>{item.severity}</span></td>
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

export default AlertDetailsPage;
