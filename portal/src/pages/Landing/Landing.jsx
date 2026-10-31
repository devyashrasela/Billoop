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
          {/* ── Simplified Navigation Header ── */}
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
              <li><a href="#features" onClick={() => setActiveTab(2)}>Customer Portal</a></li>
              <li><a href="#features" onClick={() => setActiveTab(5)}>Reports</a></li>
            </ul>

            {/* Only 2 clean actions: Sign In & Get Started (or user dashboard if already signed in) */}
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
                  <Link to="/login" className="landing-btn">
                    Sign In
                  </Link>
                  <Link to="/register" className="landing-btn landing-btn-primary">
                    Get Started →
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
                    Get Started Free →
                  </Link>
                  <Link to="/login" className="landing-btn">
                    Sign In
                  </Link>
                </>
              )}
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
                Every due subscription becomes an invoice on its own, with customer details, product lines, taxes, and totals already filled in. Nothing is billed twice or skipped.
              </p>
              <Link to={user ? "/invoices" : "/register"} className="landing-btn">
                {user ? "View Invoices →" : "Start Invoicing →"}
              </Link>
            </div>
            <div className="landing-panel g1">
              <div className="landing-stack">
                <div className="landing-glass">
                  <div className="landing-row">
                    <small>SUB-2026-000123</small>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '12px' }}>
                      Auto-Generated
                    </span>
                  </div>
                  <h3 style={{ marginTop: '4px' }}>Invoice Statement</h3>
                </div>
                <div className="landing-glass">
                  <div className="landing-row">
                    <span>Pro Plan (Monthly)</span>
                    <b style={{ fontWeight: 500 }}>$199.00</b>
                  </div>
                </div>
                <div className="landing-glass">
                  <div className="landing-row">
                    <span>GST Tax (18%)</span>
                    <b style={{ fontWeight: 500 }}>+$35.82</b>
                  </div>
                </div>
                <div className="landing-glass" style={{ background: 'rgba(255,255,255,0.4)' }}>
                  <div className="landing-row">
                    <span style={{ fontWeight: 600 }}>Total Balanced</span>
                    <b style={{ fontSize: '18px', fontWeight: 600 }}>$234.82</b>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* ── Tab 1: Overdue Invoice Queue ── */}
          <article className={`landing-slide ${activeTab === 1 ? 'on' : ''}`}>
            <div className="landing-copy">
              <span className="landing-pill">00 - 02</span>
              <h2>
                Overdue<br />Invoice Queue
              </h2>
              <p>
                See which invoices are paid and which are still outstanding. Overdue accounts are flagged automatically so the team can chase them before they turn into lost revenue.
              </p>
              <Link to={user ? "/invoices" : "/register"} className="landing-btn">
                {user ? "Check Overdue Invoices →" : "Learn More →"}
              </Link>
            </div>
            <div className="landing-panel g2">
              <div className="landing-grid">
                <div className="landing-glass ghost"></div>
                <div className="landing-glass">
                  <h3>Overdue<br />Invoices</h3>
                  <div className="landing-warn" aria-hidden="true">⚠</div>
                </div>
                <div className="landing-glass ghost">
                  <div className="landing-spin"></div>
                </div>
                <div className="landing-glass ghost">
                  <div className="landing-spin"></div>
                </div>
                <div className="landing-glass">
                  <h3>Payment<br />Recovery</h3>
                  <div className="landing-warn" aria-hidden="true">⚡</div>
                </div>
                <div className="landing-glass ghost"></div>
              </div>
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
                Customers see only their own subscriptions and invoices. They can pause, close, or renew where the plan allows, and print any invoice without emailing anyone.
              </p>
              <Link to="/login" className="landing-btn">
                Open Customer Portal →
              </Link>
            </div>
            <div className="landing-panel g3">
              <div className="landing-stack" style={{ width: 'min(340px, 100%)' }}>
                <div className="landing-glass">
                  <div className="landing-row">
                    <h3>My Subscription</h3>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '12px' }}>
                      Active
                    </span>
                  </div>
                  <small style={{ marginTop: '4px' }}>Scale Tier · Renews Monthly</small>
                  <div className="landing-row" style={{ marginTop: '14px' }}>
                    <button className="btn-glass">Pause</button>
                    <button className="btn-glass">Renew</button>
                  </div>
                </div>
                <div className="landing-glass">
                  <div className="landing-row">
                    <div>
                      <small>Balance Due</small>
                      <b style={{ fontWeight: 500, fontSize: '22px' }}>$223.00</b>
                    </div>
                    <Link to="/login" className="btn-glass" style={{ textDecoration: 'none' }}>
                      View Invoice
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* ── Tab 3: Taxes & Discount Engine ── */}
          <article className={`landing-slide ${activeTab === 3 ? 'on' : ''}`}>
            <div className="landing-copy">
              <span className="landing-pill">00 - 04</span>
              <h2>
                Taxes &amp;<br />Discount Engine
              </h2>
              <p>
                Taxes are calculated from rules you set. Discounts apply to products or whole subscriptions, land on the next invoice automatically, and stop when they expire.
              </p>
              <Link to={user ? "/subscriptions" : "/register"} className="landing-btn">
                {user ? "View Plans & Rates →" : "Explore Features →"}
              </Link>
            </div>
            <div className="landing-panel g4">
              <div className="landing-duo">
                <div className="landing-chips" style={{ width: '160px' }}>
                  <div className="landing-glass landing-chip">GST (18%)</div>
                  <div className="landing-glass landing-chip">Discount (-15%)</div>
                  <div className="landing-glass landing-chip">Variant Extra</div>
                  <div className="landing-glass landing-chip">Fixed Fee</div>
                </div>
                <div className="landing-glass" style={{ width: '220px', minHeight: '220px' }}>
                  <h3>Invoice</h3>
                  <div className="landing-glass" style={{ marginTop: '14px', padding: '10px' }}>
                    Pro Plan
                  </div>
                  <div className="landing-glass" style={{ marginTop: '10px', padding: '10px' }}>
                    Variant Extra
                  </div>
                </div>
                <div className="landing-lens">
                  <b>+$45.00</b>
                  <small>Cap: $50.00</small>
                </div>
              </div>
            </div>
          </article>

          {/* ── Tab 4: Subscription Lifecycle ── */}
          <article className={`landing-slide ${activeTab === 4 ? 'on' : ''}`}>
            <div className="landing-copy">
              <span className="landing-pill">00 - 05</span>
              <h2>
                Subscription<br />Lifecycle
              </h2>
              <p>
                Each subscription has its own number and moves predictably from Draft to Quotation to Confirmed to Active to Closed. Anyone on the team can see where it stands.
              </p>
              <Link to={user ? "/subscriptions" : "/register"} className="landing-btn">
                {user ? "Manage Subscriptions →" : "Get Started Now →"}
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

          {/* ── Tab 5: Revenue & Reporting ── */}
          <article className={`landing-slide ${activeTab === 5 ? 'on' : ''}`}>
            <div className="landing-copy">
              <span className="landing-pill">00 - 06</span>
              <h2>
                Revenue &amp;<br />Reporting
              </h2>
              <p>
                One place to see active subscriptions, revenue, payments, and overdue invoices with filters and a summary view. Every report responds instantly.
              </p>
              <Link to={user ? "/subscriptions" : "/register"} className="landing-btn">
                {user ? "View My Account →" : "Start Free Trial →"}
              </Link>
            </div>
            <div className="landing-panel g6">
              <div className="landing-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', width: 'min(400px, 100%)' }}>
                <div className="landing-glass">
                  <small>Active Subscriptions</small>
                  <h3 style={{ fontSize: '24px', marginTop: '6px' }}>1,284</h3>
                </div>
                <div className="landing-glass">
                  <small>Monthly Revenue</small>
                  <h3 style={{ fontSize: '24px', marginTop: '6px' }}>$48,250</h3>
                </div>
                <div className="landing-glass">
                  <small>Collections Rate</small>
                  <h3 style={{ fontSize: '24px', marginTop: '6px' }}>99.2%</h3>
                </div>
                <div className="landing-glass">
                  <small>Overdue Accounts</small>
                  <h3 style={{ fontSize: '24px', marginTop: '6px', color: '#ffc8c4' }}>0</h3>
                </div>
              </div>
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
                    Get Started Free →
                  </Link>
                  <Link to="/login" className="landing-btn">
                    Sign In
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
                  One unified platform for plans, subscriptions, automated invoices, payments, and real-time revenue analytics.
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
                  <li><Link to="/login">Customer Sign In</Link></li>
                  <li><Link to="/register">Create Customer Account</Link></li>
                  <li><a href="http://localhost:5174/login">Staff / Admin Ops Console ↗</a></li>
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
