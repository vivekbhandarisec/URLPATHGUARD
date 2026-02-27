import { useState } from 'react';

function TrialPage({ stats, onUpload, uploading, uploadError, uploadProgress, lastUploadedFile }) {
  const [file, setFile] = useState(null);

  return (
    <main className="soc-content trial-page">
      <section className="panel trial-hero">
        <div>
          <p className="hero-kicker">FREE TRIAL TOOL</p>
          <h2>Upload Access Logs. Watch Threat Intelligence Emerge.</h2>
          <p>
            Run a full SOC-grade analysis pipeline instantly. No setup friction, no dummy dashboards.
          </p>
        </div>
        <div className="trial-metrics">
          <article><span>Total Alerts</span><strong>{stats.totalAlerts}</strong></article>
          <article><span>24h Alerts</span><strong>{stats.alerts24h}</strong></article>
          <article><span>Top Risk Family</span><strong>{Object.entries(stats.attackTypeBreakdown || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'n/a'}</strong></article>
        </div>
      </section>

      <section className="panel upload-experience">
        <div className="panel-title-row">
          <h3>Log Ingestion Console</h3>
          <p>Upload `.log` / `.txt` and trigger real-time analysis</p>
        </div>

        <label className="drop-zone">
          <input type="file" accept=".log,.txt" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          <span>{file ? file.name : 'Drop log file here or click to browse'}</span>
        </label>

        <div className="upload-row">
          <button type="button" onClick={() => onUpload(file)} disabled={!file || uploading}>
            {uploading ? 'Analyzing Threats...' : 'Analyze Now'}
          </button>
          <span className="muted">Last Uploaded: {lastUploadedFile || 'None'}</span>
        </div>

        {uploading ? (
          <div className="loading-block">
            <div className="loading-scan" />
            <div className="progress-wrap">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p>Decoding payloads, matching signatures, building incident graph... {uploadProgress}%</p>
          </div>
        ) : null}

        {uploadError ? <p className="global-error">{uploadError}</p> : null}
      </section>
    </main>
  );
}

export default TrialPage;
