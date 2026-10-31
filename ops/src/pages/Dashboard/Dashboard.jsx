import React, { useState } from 'react';
import { useGetDashboardSummaryQuery } from '../../services/endpoints/dashboardApi';
import { useGetRevenueReportQuery } from '../../services/endpoints/reportApi';
import DashCard from '../../components/DashCard/DashCard';
import BarChart from '../../components/Chart/BarChart';
import './Dashboard.css';

export const Dashboard = () => {
  const { data: summaryData, isLoading: isSummaryLoading, refetch } = useGetDashboardSummaryQuery();
  const { data: revenueData, isLoading: isRevenueLoading } = useGetRevenueReportQuery({ months: 6 });
  const [isRunningBilling, setIsRunningBilling] = useState(false);
  const [billingNotice, setBillingNotice] = useState('');

  const kpis = summaryData?.kpis || {
    mrr: 0,
    arr: 0,
    activeSubscriptions: 0,
    pausedSubscriptions: 0,
    overdueInvoicesCount: 0,
    overdueTotalAmount: 0,
    monthRevenue: 0,
  };

  const handleRunBilling = async () => {
    setIsRunningBilling(true);
    setBillingNotice('');
    try {
      const response = await fetch('/api/ops/billing/run-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      const resData = await response.json();
      setBillingNotice(`Billing complete: ${resData.result?.invoicesGenerated || 0} invoices generated.`);
      refetch();
    } catch {
      setBillingNotice('Failed to trigger billing sweep.');
    } finally {
      setIsRunningBilling(false);
    }
  };

  const trendChartData = (revenueData?.trend || []).map((t) => ({
    label: t.month.slice(5), // "06", "07"
    value: t.revenue,
  }));

  if (isSummaryLoading) {
    return (
      <div className="dashboard-page">
        <p>Loading executive dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Operations Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)', marginTop: '4px' }}>
            Real-time subscription metrics & billing health
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn-primary"
            style={{ width: 'auto', padding: 'var(--space-2) var(--space-4)' }}
            onClick={handleRunBilling}
            disabled={isRunningBilling}
          >
            {isRunningBilling ? 'Running Sweep...' : '⚡ Run Billing Sweep'}
          </button>
        </div>
      </div>

      {billingNotice && (
        <div style={{ padding: 'var(--space-3)', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-sm)' }}>
          {billingNotice}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <DashCard
          title="Monthly Recurring Revenue"
          value={`$${kpis.mrr.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Normalized active recurring revenue"
        />
        <DashCard
          title="Annual Recurring Revenue"
          value={`$${kpis.arr.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="ARR projection (MRR × 12)"
        />
        <DashCard
          title="Active Subscriptions"
          value={kpis.activeSubscriptions}
          subtitle={`${kpis.pausedSubscriptions} paused subscriptions`}
        />
        <DashCard
          title="Overdue Invoices"
          value={kpis.overdueInvoicesCount}
          subtitle={`$${kpis.overdueTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} outstanding`}
          trendDirection="down"
        />
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="charts-grid">
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Revenue Collection (Last 6 Months)</h2>
          {isRevenueLoading ? (
            <p>Loading revenue trends...</p>
          ) : (
            <BarChart data={trendChartData} valuePrefix="$" />
          )}
        </div>

        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Payment Methods</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {(revenueData?.paymentMethods || []).length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)' }}>No payments recorded yet.</p>
            ) : (
              (revenueData?.paymentMethods || []).map((pm) => (
                <div key={pm.method} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ textTransform: 'capitalize' }}>{pm.method.replace('_', ' ')}</span>
                  <span style={{ fontWeight: 'var(--fw-bold)' }}>${Number(pm.total).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="charts-grid">
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Recent Invoices</h2>
          <table className="recent-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(summaryData?.recentInvoices || []).length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                summaryData.recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.number}</td>
                    <td>{inv.customer?.name || 'Customer'}</td>
                    <td>{inv.dueDate}</td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold' }}>
                        {inv.status}
                      </span>
                    </td>
                    <td>${Number(inv.total).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Recent Subscriptions</h2>
          <table className="recent-table">
            <thead>
              <tr>
                <th>Subscription #</th>
                <th>Plan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(summaryData?.recentSubscriptions || []).length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No subscriptions yet.
                  </td>
                </tr>
              ) : (
                summaryData.recentSubscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td>{sub.number}</td>
                    <td>{sub.plan?.name || 'Standard'}</td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold' }}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
