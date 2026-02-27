import React from "react";

function StatsCards({ metrics, hasData }) {
  if (!hasData) {
    return (
      <div className="panel-content">
        <h2>Security Telemetry</h2>
        <p className="panel-subtitle">Upload a log file to populate SOC indicators.</p>
      </div>
    );
  }

  const cards = [
    { label: "Total Requests", value: metrics.totalRequests, tone: "neutral" },
    { label: "Threat Hits", value: metrics.totalAttacks, tone: "danger" },
    { label: "Attack Rate", value: `${metrics.attackRate}%`, tone: "warning" },
    { label: "High Severity", value: metrics.high, tone: "danger" },
    { label: "Medium Severity", value: metrics.medium, tone: "warning" },
    { label: "Low Severity", value: metrics.low, tone: "safe" },
  ];

  return (
    <div className="panel-content">
      <h2>Security Telemetry</h2>
      <p className="panel-subtitle">Current scan summary from backend detections.</p>
      <div className="metric-grid">
        {cards.map((card) => (
          <article className={`metric-card metric-${card.tone}`} key={card.label}>
            <p>{card.label}</p>
            <h3>{card.value}</h3>
          </article>
        ))}
      </div>
    </div>
  );
}

export default StatsCards;
