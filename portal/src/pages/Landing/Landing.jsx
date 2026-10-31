import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import './Landing.css';

export const Landing = () => {
  const [activeTab, setActiveTab] = useState(0);
  const user = useSelector(selectCurrentUser);

  const tabs = [
    { label: 'Billing & Invoices', id: 'billing' },
    { label: 'Overdue Queue', id: 'overdue' },
    { label: 'Customer Portal', id: 'portal' },
    { label: 'Taxes & Discounts', id: 'compliance' },
    { label: 'Subscription Lifecycle', id: 'lifecycle' },
    { label: 'Revenue Reports', id: 'reports' },
  ];

  return (
    <div className="landing-container">
      <div className="landing-sheet">
        <div className="landing-wrap">
          {/* ── Navigation Header ── */}
          <header className="landing-nav">
            <Link to="/" className="landing-logo">
              <i aria-hidden="true">
                <b></b><b></b><b></b><b></b>
              </i>
              Brightloop
            </Link>

            <ul className="landing-nav-links">
              <li><a href="#features" onClick={() => setActiveTab(0)}>Why Brightloop?</a></li>
              <li><a href="#features" onClick={() => setActiveTab(0)}>Billing</a></li>
              <li><a href="#features" onClick={() => setActiveTab(2)}>Portal</a></li>
              <li><a href="#features" onClick={() => setActiveTab(5)}>Reports</a></li>
            </ul>

            <div className="landing-nav-actions">
              {user ? (
                <>
                  <span className="landing-user-badge">
                    Hi, {user.name || user.email}
                  </span>
                  <Link to="/subscriptions" className="landing-btn landing-btn-primary">
                    My Portal →
                  </Link>
                </>
              ) : (
                <>
                  <a
                    href="http://localhost:5174/login"
                    className="landing-btn landing-btn-ops"
                    title="Staff & Admin Management"
                  >
                    Ops Login ↗
                  </a>
                  <Link to="/login" className="landing-btn">
                    Sign in →
                  </Link>
                  <Link to="/register" className="landing-btn landing-btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </header>

          {/* ── Hero Section ── */}
          <section className="landing-hero">
            <small>The Brightloop Platform</small>
            <h1>
              Brightloop was built from the ground up to <mark>run every subscription</mark> from plan to payment.
            </h1>
            <p className="landing-hero-desc">
              The modern recurring billing engine for fast-growing businesses. Automated invoicing, locked sequence numbering, live revenue reports, and customer self-service in one unified stack.
            </p>
            <div className="landing-hero-ctas">
              {user ? (
                <>
                  <Link to="/subscriptions" className="landing-btn landing-btn-primary">
                    Go to My Subscriptions →
                  </Link>
                  <Link to="/invoices" className="landing-btn">
                    View Invoices
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="landing-btn landing-btn-primary">
                    Start Free Trial →
                  </Link>
                  <Link to="/login" className="landing-btn">
                    Customer Sign In
                  </Link>
                </>
              )}
            </div>
            <div className="landing-ops-helper">
              Are you an operator or administrator?{' '}
              <a href="http://localhost:5174/login">Launch Brightloop Ops Console ↗</a>
            </div>
          </section>

          {/* ── Features Tab Bar ── */}
          <nav className="landing-tabs" id="features" role="tablist" aria-label="Features">
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                className="landing-tab"
                role="tab"
                aria-selected={activeTab === idx}
                onClick={() => setActiveTab(idx)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* ── Tab 0: Automatic Invoicing & Billing Runs ── */}
          <article className={`landing-slide ${activeTab === 0 ? 'on' : ''}`}>
            <div className="landing-copy">
              <span className="landing-pill">00 - 01</span>
              <h2>
                Automatic Invoicing<br />&amp; Billing Runs
              </h2>
              <p>
                Every due subscription becomes an invoice automatically, with customer details, product lines, taxes, and totals filled in. With database sequence locks and idempotency checks, nothing is billed twice or skipped.
              </p>
              <Link to={user ? "/invoices" : "/register"} className="landing-btn">
                {user ? "View Invoices →" : "Try Automatic Invoicing →"}
              </Link>
            </div>
            <div className="landing-panel g1">
              <img
                src="/images/feature-billing.jpg"
                alt="Automatic Billing and Compliance Engine"
                className="landing-feature-img"
              />
            </div>
          </article>

          {/* ── Tab 1: Pre-Bill Exception & Overdue Queue ── */}
          <article className={`landing-slide ${activeTab === 1 ? 'on' : ''}`}>
            <div className="landing-copy">
              <span className="landing-pill">00 - 02</span>
              <h2>
                Pre-Bill Exception<br />&amp; Overdue Queue
              </h2>
              <p>
                Before statements go out, an exception queue flags high variances, missing data, and overdue accounts. Catch issues upstream before customers ever see a bill, and automate payment chase alerts.
              </p>
              <a href="http://localhost:5174/" className="landing-btn">
                View Overdue Metrics in Ops ↗
              </a>
            </div>
            <div className="landing-panel g2">
              <img
                src="/images/feature-exceptions.jpg"
                alt="Pre-Bill Exception Queue"
                className="landing-feature-img"
              />
            </div>
          </article>

          {/* ── Tab 2: Customer Portal & Self-Service ── */}
          <article className={`landing-slide ${activeTab === 2 ? 'on' : ''}`}>
            <div className="landing-copy">
              <span className="landing-pill">00 - 03</span>
              <h2>
                Customer Portal<br />&amp; Self-Service
              </h2>
              <p>
                Customers receive plain-English statements that show the math, with click-to-pay, autopay reminders, pause, and renew controls in a mobile-first portal that reduces support tickets and accelerates collections.
              </p>
              <Link to="/login" className="landing-btn">
                Open Customer Portal →
              </Link>
            </div>
            <div className="landing-panel g3">
              <img
                src="/images/feature-portal.jpg"
                alt="Customer Portal and Support"
                className="landing-feature-img"
              />
            </div>
          </article>

          {/* ── Tab 3: Taxes & Compliance Engine ── */}
          <article className={`landing-slide ${activeTab === 3 ? 'on' : ''}`}>
            <div className="landing-copy">
              <span className="landing-pill">00 - 04</span>
              <h2>
                Taxes &amp; Compliance<br />Discount Engine
              </h2>
              <p>
                Encodes tax handling (GST, VAT, state rules), fee caps, and discount rules per subscription, keeping a versioned audit trail so every charge is explainable and audit-ready.
              </p>
              <a href="http://localhost:5174/taxes" className="landing-btn">
                Configure Tax Rules in Ops ↗
              </a>
            </div>
            <div className="landing-panel g4">
              <div className="landing-duo">
                <div className="landing-chips" style={{ width: '160px' }}>
                  <div className="landing-glass landing-chip">GST (18%)</div>
                  <div className="landing-glass landing-chip">Promo (-15%)</div>
                  <div className="landing-glass landing-chip">Variants</div>
                  <div className="landing-glass landing-chip">Net-30 Terms</div>
                </div>
                <div className="landing-glass" style={{ width: '220px', minHeight: '220px' }}>
                  <h3>Sample Invoice</h3>
                  <div className="landing-glass" style={{ marginTop: '12px', padding: '10px' }}>
                    Pro Plan · $99.00
                  </div>
                  <div className="landing-glass" style={{ marginTop: '8px', padding: '10px' }}>
                    Tax Added · +$17.82
                  </div>
                </div>
                <div className="landing-lens">
                  <b>$116.82</b>
                  <small>Audit verified</small>
                </div>
              </div>
            </div>
          </article>

          {/* ── Tab 4: Subscription Lifecycle ── */}
          <article className={`landing-slide ${activeTab === 4 ? 'on' : ''}`}>
            <div className="landing-copy">
              <span className="landing-pill">00 - 05</span>
              <h2>
                Predictable Subscription<br />Lifecycle
              </h2>
              <p>
                Each subscription moves predictably through Draft → Quotation → Confirmed → Active → Closed, backed by strict state transitions and locked sequence numbering. Anyone on the team can inspect history in real time.
              </p>
              <Link to={user ? "/subscriptions" : "/register"} className="landing-btn">
                {user ? "Manage Subscriptions →" : "Start Subscribing →"}
              </Link>
            </div>
            <div className="landing-panel g5">
              <div className="landing-steps">
                <div className="landing-glass">1. Draft</div>
                <div className="landing-glass">2. Quotation</div>
                <div className="landing-glass">3. Confirmed</div>
                <div className="landing-glass cur">4. Active ⚡</div>
                <div className="landing-glass">5. Closed</div>
              </div>
            </div>
          </article>

          {/* ── Tab 5: Lower All-in Cost & Revenue Reports ── */}
          <article className={`landing-slide ${activeTab === 5 ? 'on' : ''}`}>
            <div className="landing-copy">
              <span className="landing-pill">00 - 06</span>
              <h2>
                Lower All-in Cost<br />&amp; Revenue Analytics
              </h2>
              <p>
                Compared to legacy, people-heavy workflows, Brightloop's end-to-end automation cuts cost-to-serve across invoice processing, billing, and support. Real-time MRR, ARR, and AR aging buckets keep executives informed.
              </p>
              <a href="http://localhost:5174/reports" className="landing-btn">
                Open Financial Reports ↗
              </a>
            </div>
            <div className="landing-panel g6">
              <img
                src="/images/feature-automation.jpg"
                alt="Automated Invoice Processing and Lower Cost to Serve"
                className="landing-feature-img"
              />
            </div>
          </article>

          {/* ── Call to Action Section ── */}
          <section className="landing-cta">
            <h2>Stop typing invoices. Start running subscriptions.</h2>
            <div className="landing-cta-actions">
              {user ? (
                <Link to="/subscriptions" className="landing-btn landing-btn-primary">
                  Go to My Subscriptions →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="landing-btn landing-btn-primary">
                    Get started now →
                  </Link>
                  <Link to="/login" className="landing-btn">
                    Customer Sign In
                  </Link>
                </>
              )}
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="landing-foot">
            <div className="landing-foot-main">
              <div className="landing-foot-about">
                <Link to="/" className="landing-logo">
                  <i aria-hidden="true">
                    <b></b><b></b><b></b><b></b>
                  </i>
                  Brightloop
                </Link>
                <p>
                  One modern platform for plans, subscriptions, recurring invoices, payments, and real-time revenue analytics.
                </p>
              </div>

              <nav aria-label="Product">
                <h4>Product</h4>
                <ul>
                  <li><a href="#features" onClick={() => setActiveTab(0)}>Billing &amp; Invoices</a></li>
                  <li><a href="#features" onClick={() => setActiveTab(1)}>Overdue Queue</a></li>
                  <li><a href="#features" onClick={() => setActiveTab(2)}>Customer Portal</a></li>
                  <li><a href="#features" onClick={() => setActiveTab(5)}>Revenue Reports</a></li>
                </ul>
              </nav>

              <nav aria-label="Portals">
                <h4>Access</h4>
                <ul>
                  <li><Link to="/login">Customer Portal Login</Link></li>
                  <li><Link to="/register">Create Customer Account</Link></li>
                  <li><a href="http://localhost:5174/login">Staff / Admin Ops Console</a></li>
                  <li><Link to="/forgot-password">Reset Password</Link></li>
                </ul>
              </nav>

              <nav aria-label="Company">
                <h4>Platform</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="http://localhost:4000/health" target="_blank" rel="noreferrer">API Health</a></li>
                  <li><a href="https://github.com/devyashrasela/Billoop" target="_blank" rel="noreferrer">GitHub Repository</a></li>
                </ul>
              </nav>
            </div>

            <div className="landing-foot-bar">
              <span>© 2026 Brightloop Software. All rights reserved.</span>
              <span>
                <a href="#privacy">Privacy Policy</a>
                <a href="#terms">Terms of Service</a>
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Landing;
