import React, { useState } from "react";

function UploadPanel({ onUpload, loading, error, lastFileName }) {
  const [file, setFile] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || loading) return;
    await onUpload(file);
  };

  return (
    <div className="panel-content">
      <h2>Ingestion Control</h2>
      <p className="panel-subtitle">Upload HTTP access logs for real-time threat classification.</p>

      <form onSubmit={handleSubmit} className="upload-form">
        <label htmlFor="log-upload" className="upload-input-label">
          <span>Select Log File</span>
          <input
            id="log-upload"
            type="file"
            accept=".log,.txt"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>

        <div className="upload-meta">
          <p>
            <strong>Selected:</strong> {file ? file.name : "None"}
          </p>
          <p>
            <strong>Last Processed:</strong> {lastFileName || "No file processed"}
          </p>
        </div>

        <button type="submit" disabled={!file || loading}>
          {loading ? "Analyzing..." : "Analyze Log"}
        </button>
      </form>

      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}

export default UploadPanel;
