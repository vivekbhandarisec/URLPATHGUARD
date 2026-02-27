import React from "react";

function severityClass(severity) {
  if (severity === "High") return "sev-high";
  if (severity === "Medium") return "sev-medium";
  return "sev-low";
}

function AlertsTable({ events, loading }) {
  return (
    <div className="panel-content">
      <h2>Threat Events</h2>
      <p className="panel-subtitle">Detected attacks from parsed request paths.</p>

      {loading ? <p>Running detection pipeline...</p> : null}

      {!loading && (!events || events.length === 0) ? (
        <p className="empty-state">No attacks detected in current dataset.</p>
      ) : null}

      {!loading && events && events.length > 0 ? (
        <div className="table-wrap">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Source IP</th>
                <th>Request URL</th>
                <th>Attack Type</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={`${event.ip}-${event.url}-${index}`}>
                  <td>{event.ip}</td>
                  <td className="url-cell">{event.url}</td>
                  <td>{event.attack_type}</td>
                  <td>
                    <span className={`severity-pill ${severityClass(event.severity)}`}>
                      {event.severity || "Low"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default AlertsTable;
