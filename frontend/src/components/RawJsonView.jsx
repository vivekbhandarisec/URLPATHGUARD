import React from "react";

function RawJsonView({ data }) {
  return (
    <div className="panel-content">
      <h2>Forensics JSON</h2>
      <p className="panel-subtitle">Raw backend response for analyst audit and export.</p>
      <details>
        <summary>Toggle Payload</summary>
        <pre>{JSON.stringify(data || { message: "No data loaded" }, null, 2)}</pre>
      </details>
    </div>
  );
}

export default RawJsonView;
