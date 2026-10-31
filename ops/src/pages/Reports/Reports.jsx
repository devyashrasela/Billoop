import React, { useState } from 'react';
import {
  useGetRevenueReportQuery,
  useGetGrowthReportQuery,
  useGetAgingReportQuery,
} from '../../services/endpoints/reportApi';
import BarChart from '../../components/Chart/BarChart';
import './Reports.css';

export const Reports = () => {
  const [activeTab, setActiveTab] = useState('revenue');
  const { data: revenueData, isLoading: isRevLoading } = useGetRevenueReportQuery({ months: 6 });
  const { data: growthData, isLoading: isGrowthLoading } = useGetGrowthReportQuery({ months: 6 });
  const { data: agingData, isLoading: isAgingLoading } = useGetAgingReportQuery();

  const growthChartData = (growthData?.growth || []).map((g) => ({
    label: g.month.slice(5),
    value: g.net,
  }));

  const revenueChartData = (revenueData?.trend || []).map((r) => ({
    label: r.month.slice(5),
    value: r.revenue,
  }));

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Financial & Subscription Reports</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)', marginTop: '4px' }}>
            Historical trends, aging accounts receivable, and net subscription growth
          </p>
        </div>
      </div>

      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          Revenue Collections
        </button>
        <button
          className={`tab-btn ${activeTab === 'growth' ? 'active' : ''}`}
          onClick={() => setActiveTab('growth')}
        >
          Subscription Growth
        </button>
        <button
          className={`tab-btn ${activeTab === 'aging' ? 'active' : ''}`}
          onClick={() => setActiveTab('aging')}
        >
          Accounts Receivable Aging
        </button>
      </div>

      {activeTab === 'revenue' && (
        <div className="aging-card" style={{ padding: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-4)' }}>
            Monthly Collections (Last 6 Months)
          </h2>
          {isRevLoading ? (
            <p>Loading revenue data...</p>
          ) : (
            <BarChart data={revenueChartData} valuePrefix="$" height={260} />
          )}
        </div>
      )}

      {activeTab === 'growth' && (
        <div className="aging-card" style={{ padding: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-4)' }}>
            Net Subscription Growth (New vs Closed)
          </h2>
          {isGrowthLoading ? (
            <p>Loading growth data...</p>
          ) : (
            <BarChart data={growthChartData} valuePrefix="" height={260} />
          )}
        </div>
      )}

      {activeTab === 'aging' && (
        <div>
          <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-4)' }}>
            Overdue Invoices by Aging Bucket
          </h2>
          {isAgingLoading ? (
            <p>Loading aging report...</p>
          ) : (
            <div className="aging-grid">
              {Object.entries(agingData?.aging || {}).map(([key, bucket]) => (
                <div key={key} className="aging-card">
                  <h3>{bucket.label}</h3>
                  <div className="aging-card-value">${Number(bucket.balance).toLocaleString()}</div>
                  <div className="aging-card-count">{bucket.count} invoice{bucket.count === 1 ? '' : 's'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
