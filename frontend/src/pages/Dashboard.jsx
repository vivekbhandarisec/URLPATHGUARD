import React, { useMemo, useState } from "react";
import UploadPanel from "../components/UploadPanel";
import StatsCards from "../components/StatsCards";
import AlertsTable from "../components/AlertsTable";
import RawJsonView from "../components/RawJsonView";

function Dashboard() {
  const [responseData, setResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFileName, setLastFileName] = useState("");

  const events = responseData?.events ?? [];

  const metrics = useMemo(() => {
    const severityCount = { High: 0, Medium: 0, Low: 0 };

    events.forEach((event) => {
      const severity = event.severity || "Low";
      if (severityCount[severity] === undefined) {
        severityCount.Low += 1;
      } else {
        severityCount[severity] += 1;
      }
    });

    const totalRequests = responseData?.total_requests || 0;
    const totalAttacks = responseData?.total_attacks || 0;
    const attackRate = totalRequests > 0 ? ((totalAttacks / totalRequests) * 100).toFixed(1) : "0.0";

    return {
      totalRequests,
      totalAttacks,
      attackRate,
      high: severityCount.High,
      medium: severityCount.Medium,
      low: severityCount.Low,
    };
  }, [events, responseData]);

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-log", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Upload failed";

        try {
          const errorBody = await response.json();
          if (errorBody?.detail) {
            errorMessage = errorBody.detail;
          }
        } catch (_) {
          // Keep default message when error body is not JSON.
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      setResponseData(result);
      setLastFileName(file.name);
    } catch (uploadError) {
      setError(uploadError.message || "Failed to process the log file.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="soc-app">
      <header className="soc-topbar">
        <div>
          <p className="soc-kicker">Threat Monitoring Console</p>
          <h1>URLPathGuard SOC Enterprise Dashboard</h1>
        </div>
        <div className="soc-status">
          <span className="status-dot" />
          <span>Pipeline Active</span>
        </div>
      </header>

      <main className="soc-grid">
        <section className="soc-panel">
          <UploadPanel
            onUpload={handleFileUpload}
            loading={isLoading}
            error={error}
            lastFileName={lastFileName}
          />
        </section>

        <section className="soc-panel">
          <StatsCards metrics={metrics} hasData={Boolean(responseData)} />
        </section>

        <section className="soc-panel soc-panel-wide">
          <AlertsTable events={events} loading={isLoading} />
        </section>

        <section className="soc-panel soc-panel-wide">
          <RawJsonView data={responseData} />
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
