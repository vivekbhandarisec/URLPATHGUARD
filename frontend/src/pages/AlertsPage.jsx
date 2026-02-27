import { useMemo, useState } from 'react';

const PAGE_SIZE = 12;

function severityClass(severity) {
  const value = String(severity || 'Low').toLowerCase();
  if (value === 'critical') return 'sev-critical';
  if (value === 'high') return 'sev-high';
  if (value === 'medium') return 'sev-medium';
  return 'sev-low';
}

function toCsv(rows) {
  const headers = ['timestamp', 'sourceIp', 'country', 'method', 'urlPath', 'attackType', 'severity', 'statusCode', 'riskScore'];
  const lines = [headers.join(',')];

  rows.forEach((row) => {
    const values = headers.map((key) => {
      const raw = row[key] ?? '';
      const safe = String(raw).replaceAll('"', '""');
      return `"${safe}"`;
    });
    lines.push(values.join(','));
  });

  return lines.join('\n');
}

function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AlertsPage({ alerts, loading, onUpload, uploading, uploadError, lastUploadedFile }) {
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [attackType, setAttackType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);

  const attackTypes = useMemo(() => {
    return [...new Set(alerts.map((item) => item.attackType))].sort();
  }, [alerts]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    const result = alerts.filter((alert) => {
      const ts = new Date(alert.timestamp).getTime();
      const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
      const to = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;

      const dateOk = ts >= from && ts <= to;
      const severityOk = severity === 'all' || alert.severity === severity;
      const typeOk = attackType === 'all' || alert.attackType === attackType;
      const textOk =
        needle.length === 0 ||
        alert.sourceIp.toLowerCase().includes(needle) ||
        alert.urlPath.toLowerCase().includes(needle) ||
        alert.attackType.toLowerCase().includes(needle) ||
        String(alert.statusCode).toLowerCase().includes(needle);

      return dateOk && severityOk && typeOk && textOk;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      if (sortField === 'timestamp') {
        return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * dir;
      }
      if (sortField === 'riskScore') {
        return ((a.riskScore || 0) - (b.riskScore || 0)) * dir;
      }
      return String(a[sortField] || '').localeCompare(String(b[sortField] || '')) * dir;
    });

    return result;
  }, [alerts, attackType, fromDate, search, severity, sortDir, sortField, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const rows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const selectedRows = filtered.filter((item) => selectedIds.includes(item.id));

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDir('desc');
  }

  function toggleSelection(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function toggleAllCurrentPage() {
    const ids = rows.map((item) => item.id);
    const allSelected = ids.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      return;
    }
    setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
  }

  return (
    <main className="soc-content">
      <section className="panel upload-panel-compact">
        <div className="panel-title-row">
          <h3>File Upload</h3>
          <p>Ingest a new log snapshot</p>
        </div>
        <div className="upload-row">
          <input
            type="file"
            accept=".log,.txt"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          <button type="button" onClick={() => onUpload(file)} disabled={!file || uploading}>
            {uploading ? 'Analyzing...' : 'Upload & Detect'}
          </button>
        </div>
        <div className="upload-meta-pro">
          <span>Selected: <strong>{file?.name || 'None'}</strong></span>
          <span>Last Uploaded: <strong>{lastUploadedFile || 'None'}</strong></span>
        </div>
        {uploadError ? <p className="global-error">{uploadError}</p> : null}
      </section>

      <section className="panel">
        <div className="panel-title-row">
          <h3>Alerts</h3>
          <p>{filtered.length} matching events</p>
        </div>

        <div className="quick-actions">
          <button type="button" onClick={() => setSeverity('Critical')}>Critical Only</button>
          <button type="button" onClick={() => setSeverity('High')}>High Only</button>
          <button type="button" onClick={() => { setSeverity('all'); setAttackType('all'); setFromDate(''); setToDate(''); setSearch(''); }}>Reset Filters</button>
          <button type="button" onClick={() => downloadCsv('alerts-export.csv', toCsv(selectedRows.length ? selectedRows : filtered))}>Export CSV</button>
          <span className="muted">Selected: {selectedIds.length}</span>
        </div>

        <div className="filters-grid">
          <input
            type="search"
            placeholder="Search IP, URL, attack type, status..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          <select value={severity} onChange={(event) => { setSeverity(event.target.value); setPage(1); }}>
            <option value="all">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select value={attackType} onChange={(event) => { setAttackType(event.target.value); setPage(1); }}>
            <option value="all">All Attack Types</option>
            {attackTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1); }} />
          <input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1); }} />
        </div>

        {loading ? <p className="muted">Loading alerts...</p> : null}
        {!loading && rows.length === 0 ? <p className="muted">No alerts for the selected filters.</p> : null}

        {!loading && rows.length > 0 ? (
          <div className="table-wrap">
            <table className="soc-table">
              <thead>
                <tr>
                  <th><input type="checkbox" onChange={toggleAllCurrentPage} checked={rows.every((r) => selectedIds.includes(r.id))} /></th>
                  <th><button type="button" className="th-btn" onClick={() => toggleSort('timestamp')}>Timestamp</button></th>
                  <th><button type="button" className="th-btn" onClick={() => toggleSort('sourceIp')}>Source IP</button></th>
                  <th>Country</th>
                  <th>Method</th>
                  <th>URL Path</th>
                  <th><button type="button" className="th-btn" onClick={() => toggleSort('attackType')}>Attack Type</button></th>
                  <th><button type="button" className="th-btn" onClick={() => toggleSort('severity')}>Severity</button></th>
                  <th>Status</th>
                  <th><button type="button" className="th-btn" onClick={() => toggleSort('riskScore')}>Risk</button></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((alert) => (
                  <tr key={alert.id} className={selectedIds.includes(alert.id) ? 'row-selected' : ''}>
                    <td><input type="checkbox" checked={selectedIds.includes(alert.id)} onChange={() => toggleSelection(alert.id)} /></td>
                    <td>{new Date(alert.timestamp).toLocaleString()}</td>
                    <td><code>{alert.sourceIp}</code></td>
                    <td>{alert.country}</td>
                    <td>{alert.method}</td>
                    <td className="url-col"><a href={`#/alerts/${encodeURIComponent(alert.id)}`}>{alert.urlPath}</a></td>
                    <td>{alert.attackType}</td>
                    <td><span className={`severity-pill ${severityClass(alert.severity)}`}>{alert.severity}</span></td>
                    <td>{alert.statusCode}</td>
                    <td>{alert.riskScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="pager">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1}>Prev</button>
          <span>Page {pageSafe} / {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}>Next</button>
        </div>
      </section>
    </main>
  );
}

export default AlertsPage;
