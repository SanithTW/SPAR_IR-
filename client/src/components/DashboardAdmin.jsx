import React, { useState, useEffect } from 'react';
import { Package, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, TrendingUp, Bell, Filter } from 'lucide-react';
import CalendarMonth from './CalendarMonth';
import { issuesApi, notificationsApi } from '../services/api';

export default function DashboardAdmin({ onSelectIssue, onOpenIssueModal, searchQuery }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState({ total: 0, received: 0, pending: 0, problem: 0, overdue: 0 });
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, summaryRes, notifsRes] = await Promise.all([
        issuesApi.getAll({ search: searchQuery }),
        issuesApi.getSummary(),
        notificationsApi.getAll()
      ]);
      setIssues(issuesRes || []);
      setSummary(summaryRes || {});
      setRecentNotifs(notifsRes?.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const activeBranchesCount = new Set(issues.map(i => i.branch_id)).size;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.15rem' }}>
            Overview of POSM distribution and branch confirmations across Sri Lanka
          </p>
        </div>
      </div>

      {/* KPI Summary Cards Strip (Matches Panel 2) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.25rem'
        }}
      >
        {/* Total Issued */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Total Issued Items
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} color="#d51e27" />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
              {summary.total || 0}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              <TrendingUp size={14} color="#d51e27" />
              <span>Across {activeBranchesCount} active {activeBranchesCount === 1 ? 'branch' : 'branches'}</span>
            </div>
          </div>
        </div>

        {/* Received */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Received
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="#047857" />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#047857', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
              {summary.received || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
              {summary.completionRate || 0}% overall completion
            </div>
          </div>
        </div>

        {/* Pending */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Pending / Issued
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#1d4ed8" />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1d4ed8', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
              {(summary.pending || 0) + (summary.waitingIssued || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
              {summary.pending || 0} planned · {summary.waitingIssued || 0} in transit
            </div>
          </div>
        </div>

        {/* Problem / Overdue */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Problem / Overdue
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#b91c1c" />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#b91c1c', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
              {(summary.problem || 0) + (summary.overdue || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.35rem', fontWeight: 600 }}>
              {summary.problem || 0} problems · {summary.overdue || 0} post-2nd overdue
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split: POSM Calendar & Recent Activity stream */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Calendar View */}
        <div>
          <CalendarMonth
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            issues={issues}
            onSelectIssue={onSelectIssue}
            showBranchName={true}
          />
        </div>

        {/* Right Activities & Notifications Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Notifications Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} color="#d51e27" />
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Notifications
                </h2>
              </div>
              <span className="badge badge-problem" style={{ fontSize: '0.7rem' }}>
                {recentNotifs.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
              {recentNotifs.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '1.5rem 0' }}>
                  No recent notifications
                </div>
              ) : (
                recentNotifs.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.65rem 0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      borderLeft: '3px solid #d51e27'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1e293b' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: '0.15rem' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      {n.created_at ? n.created_at.slice(5, 16) : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Deliveries & Updates */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>
              Recent Issues Activity
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {issues.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '1.5rem 0' }}>
                  No issues recorded yet
                </div>
              ) : (
                issues.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectIssue(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #f1f5f9',
                      background: '#ffffff',
                      cursor: 'pointer',
                      transition: 'background 0.1s'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                        {item.branch_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {item.campaign} · {item.item_type_name}
                      </div>
                    </div>
                    <span className={`badge badge-${item.status_color === 'green' ? 'received' : item.status_color === 'red' ? 'problem' : item.status_color === 'blue' ? 'issued' : 'pending'}`}>
                      {item.display_status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
