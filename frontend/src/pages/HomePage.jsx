import { useState } from 'react';

function HomePage({ stats, alerts, systemStatus, onUpload, uploading, uploadError, lastUploadedFile }) {
  const [file, setFile] = useState(null);
  const criticalOpen = alerts.filter((a) => a.severity === 'Critical').length;

  return (
    <main className="soc-content">
      <section className="hero-panel panel">
        <div>
          <p className="hero-kicker">SOC-FIRST URL ATTACK ANALYTICS</p>
          <h2>Enterprise-grade threat intelligence console for web attack surfaces.</h2>
          <p className="hero-sub">
            Designed for SOC teams to triage high-volume URL attacks with rapid scoring, deep request forensics, and incident queue workflows.
          </p>
          <div className="hero-actions">
            <a className="cta-primary" href="#/dashboard">Open Command Center</a>
            <a className="cta-ghost" href="#/alerts">Review Incident Queue</a>
          </div>
        </div>
        <div className="hero-stats">
          <article>
            <span>Total Alerts</span>
            <strong>{stats.totalAlerts}</strong>
          </article>
          <article>
            <span>Critical Open</span>
            <strong>{criticalOpen}</strong>
          </article>
          <article>
            <span>System Health</span>
            <strong>{(systemStatus?.status || 'unknown').toUpperCase()}</strong>
          </article>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel feature-card">
          <h3>Detection Engine</h3>
          <p>SQLi, XSS, traversal, brute force, command injection, scanner fingerprinting.</p>
        </article>
        <article className="panel feature-card">
          <h3>Analyst Workflow</h3>
          <p>Sort, filter, bulk-select, export CSV, and drill into request-level evidence fast.</p>
        </article>
        <article className="panel feature-card">
          <h3>Incident Visibility</h3>
          <p>Severity-aware timeline, posture scoring, top threat sources, active incident queue.</p>
        </article>
      </section>

      <section className="panel upload-panel-pro">
        <div className="panel-title-row">
          <h3>Ingestion Pipeline</h3>
          <p>Upload `.log` / `.txt` and run immediate threat scoring</p>
        </div>
        <div className="upload-row">
          <input
            type="file"
            accept=".log,.txt"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          <button type="button" onClick={() => onUpload(file)} disabled={!file || uploading}>
            {uploading ? 'Analyzing...' : 'Analyze Log File'}
          </button>
        </div>
        <div className="upload-meta-pro">
          <span>Selected: <strong>{file?.name || 'None'}</strong></span>
          <span>Last Uploaded: <strong>{lastUploadedFile || 'None'}</strong></span>
        </div>
        {uploadError ? <p className="global-error">{uploadError}</p> : null}
      </section>
    </main>
  );
}

export default HomePage;
