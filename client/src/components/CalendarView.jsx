import React, { useState, useEffect } from 'react';
import { Calendar as CalIcon, Filter, PlusCircle, CheckCircle2, AlertTriangle, Clock, List, Grid } from 'lucide-react';
import CalendarMonth from './CalendarMonth';
import { issuesApi, branchesApi, typesAndSizesApi } from '../services/api';

export default function CalendarView({ onSelectIssue, onOpenIssueModal, user, searchQuery }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [issues, setIssues] = useState([]);
  const [branches, setBranches] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
  const [statusFilters, setStatusFilters] = useState({
    Received: true,
    Issued: true,
    Pending: true,
    Problem: true
  });

  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedBranch) params.branch_id = selectedBranch;
      if (selectedType) params.item_type_id = selectedType;
      if (searchQuery) params.search = searchQuery;

      const [issuesRes, branchesRes, typesRes] = await Promise.all([
        issuesApi.getAll(params),
        branchesApi.getAll(),
        typesAndSizesApi.getItemTypes()
      ]);

      setIssues(issuesRes || []);
      setBranches(branchesRes || []);
      setItemTypes(typesRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranch, selectedType, searchQuery]);

  const toggleStatusFilter = (status) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Filter issues based on active status filters
  const filteredIssues = issues.filter(item => {
    if (item.status === 'Received' && !statusFilters.Received) return false;
    if (item.status === 'Issued' && !item.is_overdue && !statusFilters.Issued) return false;
    if (item.status === 'Pending' && !statusFilters.Pending) return false;
    if ((item.status === 'Problem' || item.is_overdue) && !statusFilters.Problem) return false;
    return true;
  });

  const isAdmin = user?.role === 'admin';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Bar Controls (Matches Panel 7) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            POSM Calendar
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.15rem' }}>
            Unified schedule of POSM distributions across all SaveMor stores
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('month')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: viewMode === 'month' ? '#ffffff' : 'transparent',
                color: viewMode === 'month' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'month' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Grid size={15} /> Month
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: viewMode === 'list' ? '#ffffff' : 'transparent',
                color: viewMode === 'list' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <List size={15} /> List
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={onOpenIssueModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#d51e27',
                color: '#ffffff',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(213, 30, 39, 0.3)'
              }}
            >
              <PlusCircle size={16} /> + Issue Item
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Filters Sidebar + Calendar / List */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Filter Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <Filter size={18} color="#d51e27" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              Filter Calendar
            </h2>
          </div>

          {/* Branch Filter */}
          {user?.role !== 'branch' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                style={{ width: '100%', height: '38px', fontSize: '0.825rem' }}
              >
                <option value="">All Branches ({branches.length})</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.town})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Item Type Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Item Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ width: '100%', height: '38px', fontSize: '0.825rem' }}
            >
              <option value="">All Item Types</option>
              {itemTypes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Checkboxes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem' }}>
              Status
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={statusFilters.Received}
                  onChange={() => toggleStatusFilter('Received')}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></span>
                  Received
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={statusFilters.Issued}
                  onChange={() => toggleStatusFilter('Issued')}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span>
                  Issued
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={statusFilters.Pending}
                  onChange={() => toggleStatusFilter('Pending')}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></span>
                  Pending
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={statusFilters.Problem}
                  onChange={() => toggleStatusFilter('Problem')}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }}></span>
                  Problem / Overdue
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedBranch('');
              setSelectedType('');
              setStatusFilters({ Received: true, Issued: true, Pending: true, Problem: true });
            }}
            style={{
              padding: '0.45rem',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#475569',
              fontWeight: 600
            }}
          >
            Reset Filters
          </button>
        </div>

        {/* Right Content: Month Grid or List View */}
        <div>
          {viewMode === 'month' ? (
            <CalendarMonth
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              issues={filteredIssues}
              onSelectIssue={onSelectIssue}
              showBranchName={user?.role !== 'branch'}
            />
          ) : (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div className="app-table-container">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Branch</th>
                      <th>Item Type</th>
                      <th>Campaign</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                          No items match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.map((item) => (
                        <tr key={item.id} onClick={() => onSelectIssue(item)} style={{ cursor: 'pointer' }}>
                          <td style={{ fontWeight: 600 }}>{item.issue_date}</td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.branch_name} ({item.branch_town})</td>
                          <td>{item.item_type_name}</td>
                          <td style={{ fontWeight: 600 }}>{item.campaign}</td>
                          <td>{item.qty} pcs</td>
                          <td>
                            <span className={`badge badge-${item.status_color === 'green' ? 'received' : item.status_color === 'red' ? 'problem' : item.status_color === 'blue' ? 'issued' : 'pending'}`}>
                              {item.display_status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectIssue(item);
                              }}
                              style={{
                                padding: '0.3rem 0.6rem',
                                background: '#f1f5f9',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#334155'
                              }}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
