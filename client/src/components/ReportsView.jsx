import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, AlertTriangle, CheckCircle2, Building2, Layers, Filter } from 'lucide-react';
import { reportsApi, branchesApi } from '../services/api';

export default function ReportsView({ user, onSelectIssue }) {
  const [activeTab, setActiveTab] = useState('outstanding'); // 'outstanding' | 'branch' | 'campaign'
  const [outstandingItems, setOutstandingItems] = useState([]);
  const [branchHistory, setBranchHistory] = useState([]);
  const [campaignHistory, setCampaignHistory] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [branchesRes, outRes, bHistRes, cHistRes] = await Promise.all([
        branchesApi.getAll(),
        reportsApi.getOutstanding({ branch_id: selectedBranch }),
        reportsApi.getBranchHistory(),
        reportsApi.getCampaignHistory()
      ]);
      setBranches(branchesRes || []);
      setOutstandingItems(outRes || []);
      setBranchHistory(bHistRes || []);
      setCampaignHistory(cHistRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedBranch]);

  const handleExportExcel = () => {
    window.location.href = reportsApi.exportCsvUrl(activeTab, selectedMonth, selectedBranch);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Title & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            POSM Reports & Analytics
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.15rem' }}>
            Track unconfirmed deliveries, branch performance, campaign audits, and export to Excel
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#d51e27',
            color: '#ffffff',
            padding: '0.55rem 1.15rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 2px 6px rgba(213, 30, 39, 0.3)'
          }}
        >
          <Download size={16} />
          Export to Excel
        </button>
      </div>

      {/* Tabs & Filters Strip (Matches Screen 8) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1rem 1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('outstanding')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: activeTab === 'outstanding' ? '#fef2f2' : 'transparent',
              color: activeTab === 'outstanding' ? '#b91c1c' : '#64748b',
              border: activeTab === 'outstanding' ? '1px solid #fecaca' : '1px solid transparent'
            }}
          >
            Outstanding Items ({outstandingItems.length})
          </button>

          <button
            onClick={() => setActiveTab('branch')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: activeTab === 'branch' ? '#eff6ff' : 'transparent',
              color: activeTab === 'branch' ? '#1d4ed8' : '#64748b',
              border: activeTab === 'branch' ? '1px solid #bfdbfe' : '1px solid transparent'
            }}
          >
            Branch History ({branchHistory.length})
          </button>

          <button
            onClick={() => setActiveTab('campaign')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: activeTab === 'campaign' ? '#f8fafc' : 'transparent',
              color: activeTab === 'campaign' ? '#0f172a' : '#64748b',
              border: activeTab === 'campaign' ? '1px solid #cbd5e1' : '1px solid transparent'
            }}
          >
            Campaign History ({campaignHistory.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              style={{ height: '36px', fontSize: '0.8rem' }}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.town})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        {activeTab === 'outstanding' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Outstanding / Overdue Items
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Items not confirmed received by the 2nd of the following month (e.g. issued in September not confirmed by 2 Oct)
                </p>
              </div>
              <span className="badge badge-overdue">
                {outstandingItems.length} Overdue Flagged
              </span>
            </div>

            <div className="app-table-container">
              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Branch</th>
                    <th>Item Type</th>
                    <th>Campaign</th>
                    <th>Issue Date</th>
                    <th>Days Elapsed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#16a34a', fontWeight: 600 }}>
                        ✓ Great news! No outstanding overdue items past the 2nd-of-month cutoff.
                      </td>
                    </tr>
                  ) : (
                    outstandingItems.map((item, idx) => (
                      <tr key={item.id} onClick={() => onSelectIssue && onSelectIssue(item)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          {item.branch_name}
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.branch_town}</div>
                        </td>
                        <td>{item.item_type_name}</td>
                        <td style={{ fontWeight: 600 }}>{item.campaign}</td>
                        <td>{item.issue_date}</td>
                        <td style={{ color: '#dc2626', fontWeight: 700 }}>{item.days_elapsed} days</td>
                        <td>
                          <span className="badge badge-overdue">
                            Overdue
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'branch' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Branch Performance & History
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Audit completion rate and confirmations across all 22 SaveMor branches
                </p>
              </div>
            </div>

            <div className="app-table-container">
              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Branch Name</th>
                    <th>Town</th>
                    <th>Total Items</th>
                    <th>Received</th>
                    <th>Problems</th>
                    <th>Overdue</th>
                    <th>Completion %</th>
                  </tr>
                </thead>
                <tbody>
                  {branchHistory.map((b, idx) => (
                    <tr key={b.branch_id}>
                      <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{b.branch_name}</td>
                      <td>{b.branch_town}</td>
                      <td style={{ fontWeight: 600 }}>{b.total_items}</td>
                      <td style={{ color: '#16a34a', fontWeight: 700 }}>{b.received_count}</td>
                      <td style={{ color: b.problem_count > 0 ? '#dc2626' : '#64748b', fontWeight: b.problem_count > 0 ? 700 : 400 }}>
                        {b.problem_count}
                      </td>
                      <td style={{ color: b.overdue_count > 0 ? '#dc2626' : '#64748b', fontWeight: b.overdue_count > 0 ? 700 : 400 }}>
                        {b.overdue_count}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${b.completion_rate}%`, height: '100%', background: b.completion_rate > 70 ? '#16a34a' : b.completion_rate > 40 ? '#f59e0b' : '#dc2626' }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{b.completion_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'campaign' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Campaign POSM History
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Track campaign wide issues, distribution coverage, and delivery confirmation status
                </p>
              </div>
            </div>

            <div className="app-table-container">
              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Campaign Name</th>
                    <th>Total Branches</th>
                    <th>Quantity Issued</th>
                    <th>Received Count</th>
                    <th>Problems</th>
                    <th>Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignHistory.map((c, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{c.campaign}</td>
                      <td style={{ fontWeight: 600 }}>{c.total_branches} stores</td>
                      <td style={{ fontWeight: 700 }}>{c.total_quantity} pcs</td>
                      <td style={{ color: '#16a34a', fontWeight: 700 }}>{c.received_count}</td>
                      <td style={{ color: c.problem_count > 0 ? '#dc2626' : '#64748b' }}>{c.problem_count}</td>
                      <td style={{ color: c.overdue_count > 0 ? '#dc2626' : '#64748b' }}>{c.overdue_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
