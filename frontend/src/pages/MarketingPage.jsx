function MarketingPage({ onGetStarted }) {
  return (
    <div className="marketing-page">
      <header className="mkt-topbar">
        <div className="brand-lockup">
          <span className="brand-badge">UPG</span>
          <div>
            <strong>URLPathGuard</strong>
            <p>Web Attack Defense Intelligence</p>
          </div>
        </div>
        <nav>
          <a href="#features">Features</a>
          <a href="#blog">Blog</a>
          <a href="#contact">Contact</a>
          <button type="button" className="cta-primary" onClick={onGetStarted}>Get Started</button>
        </nav>
      </header>

      <section className="mkt-hero" id="top">
        <div className="mkt-hero-copy">
          <p className="hero-kicker">AI-powered SOC for URL-level threats</p>
          <h1>Enterprise-grade URL Attack Detection Platform</h1>
          <p>
            Detect SQLi, XSS, Path Traversal, Brute Force, command injection, and reconnaissance patterns in seconds.
            Built for security teams that need speed, clarity, and defensible incident evidence.
          </p>
          <div className="hero-actions">
            <button type="button" className="cta-primary" onClick={onGetStarted}>Get Started Free Trial</button>
            <a className="cta-ghost" href="#contact">Book Demo</a>
          </div>
        </div>
        <div className="mkt-hero-card">
          <h3>Live Threat Snapshot</h3>
          <ul>
            <li><span>Detection latency</span><strong>2.1s avg</strong></li>
            <li><span>Rule families</span><strong>11+ signatures</strong></li>
            <li><span>Analyst-ready exports</span><strong>CSV / JSON</strong></li>
            <li><span>Deployment mode</span><strong>Self-hosted</strong></li>
          </ul>
        </div>
      </section>

      <section className="mkt-logo-strip">
        <span>Trusted by red teams, appsec teams, and SOC analysts</span>
        <div>
          <p>SECURESTACK</p>
          <p>OPSNOVA</p>
          <p>CYBERFLEET</p>
          <p>NETSENTRY</p>
          <p>BLUEWALL</p>
        </div>
      </section>

      <section className="mkt-section" id="features">
        <h2>Core Platform Features</h2>
        <div className="feature-grid">
          <article className="panel feature-card"><h3>Detection Engine</h3><p>Multi-signal detection pipeline with decoding, rule matching, and behavior analytics.</p></article>
          <article className="panel feature-card"><h3>SOC Dashboard</h3><p>Posture scoring, incident queue, timeline intelligence, and top threat source insights.</p></article>
          <article className="panel feature-card"><h3>Incident Forensics</h3><p>Full request evidence, decoded payloads, triggered rules, and historical IP context.</p></article>
          <article className="panel feature-card"><h3>Analyst Workflow</h3><p>Sort, filter, bulk-select, export, note-taking, and investigation shortcuts.</p></article>
          <article className="panel feature-card"><h3>Free Trial Tool</h3><p>Upload access logs instantly and evaluate the full SOC experience before deployment.</p></article>
          <article className="panel feature-card"><h3>API-first Design</h3><p>REST endpoints for alerts, stats, system health, and integrations into your stack.</p></article>
        </div>
      </section>

      <section className="mkt-section split">
        <div>
          <h2>Built for Real Security Operations</h2>
          <p>
            This is not a generic admin template. URLPathGuard is purpose-built for web attack hunting and response workflows,
            with data models and visual systems aligned to SOC decision-making.
          </p>
          <ul className="check-list">
            <li>Severity-aware incident queues</li>
            <li>Rapid log-to-detection pipeline</li>
            <li>Evidence-rich alert details</li>
            <li>Operational exports for handoff and reporting</li>
          </ul>
        </div>
        <div className="panel mkt-highlight">
          <h3>Free Trial Includes</h3>
          <p>Full dashboard access, advanced filtering, details view, and incident triage flow.</p>
          <button type="button" className="cta-primary" onClick={onGetStarted}>Start Free Trial</button>
        </div>
      </section>

      <section className="mkt-section" id="blog">
        <div className="panel-title-row"><h2>Blog</h2><a href="#top">Back to top</a></div>
        <div className="blog-grid">
          <article className="panel blog-card"><p className="blog-tag">Detection</p><h3>How to Catch Encoded SQLi in Access Logs</h3><p>Practical decoding and signature design for production traffic.</p></article>
          <article className="panel blog-card"><p className="blog-tag">SOC Ops</p><h3>Triage Playbook for High-Risk URL Attacks</h3><p>Faster workflows for high-volume web attack incidents.</p></article>
          <article className="panel blog-card"><p className="blog-tag">Architecture</p><h3>Designing a Lightweight SIEM for AppSec</h3><p>Core system patterns for web-focused security analytics.</p></article>
        </div>
      </section>

      <section className="mkt-section" id="contact">
        <h2>Contact</h2>
        <div className="contact-layout">
          <div className="panel">
            <h3>Talk to Security Engineering</h3>
            <p>Need enterprise onboarding, custom rules, or integration support?</p>
            <p>Email: security@urlpathguard.io</p>
            <p>Sales: +1 (800) 555-0142</p>
          </div>
          <form className="panel contact-form" onSubmit={(e) => e.preventDefault()}>
            <label>Name<input type="text" placeholder="Your name" /></label>
            <label>Work Email<input type="email" placeholder="you@company.com" /></label>
            <label>Message<textarea rows="4" placeholder="Tell us about your environment..." /></label>
            <button type="submit">Send Inquiry</button>
          </form>
        </div>
      </section>

      <footer className="mkt-footer">
        <p>© 2026 URLPathGuard. Built for web attack defense.</p>
        <button type="button" className="cta-ghost" onClick={onGetStarted}>Launch Free Trial Tool</button>
      </footer>
    </div>
  );
}

export default MarketingPage;
