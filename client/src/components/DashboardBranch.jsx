import React, { useState, useEffect } from 'react';
import { Store, CheckCircle2, AlertTriangle, Eye, Calendar, Clock, MapPin, Phone } from 'lucide-react';
import CalendarMonth from './CalendarMonth';
import { issuesApi, branchesApi } from '../services/api';
import confetti from 'canvas-confetti';

export default function DashboardBranch({ user, onSelectIssue, searchQuery }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [issues, setIssues] = useState([]);
  const [branchDetail, setBranchDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchBranchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, branchRes] = await Promise.all([
        issuesApi.getAll({ search: searchQuery }),
        user?.branch_id ? branchesApi.getById(user.branch_id) : Promise.resolve(null)
      ]);
      setIssues(issuesRes || []);
      setBranchDetail(branchRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchData();
  }, [user, searchQuery]);

  const handleQuickReceive = async (issue) => {
    try {
      setActionLoadingId(issue.id);
      await issuesApi.confirmReceive(issue.id, {
        comment: `Confirmed received by ${user.name || 'Branch Staff'} on ${new Date().toLocaleDateString()}`
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      fetchBranchData();
    } catch (err) {
      alert(err.message || 'Error marking received');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingConfirmation = issues.filter(i => i.status === 'Issued' || i.status === 'Pending');
  const receivedItems = issues.filter(i => i.status === 'Received');
  const problemItems = issues.filter(i => i.status === 'Problem' || i.is_overdue);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Branch Header Greeting Banner */}
      <div
        className="branch-banner"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: '#d51e27',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(213, 30, 39, 0.4)',
              flexShrink: 0
            }}
          >
            <Store size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                {branchDetail?.name || user?.branch_name || user?.name || 'My Branch'}
              </h1>
              <span className="badge badge-received" style={{ fontSize: '0.7rem' }}>
                {branchDetail?.town || user?.branch_town ? `${branchDetail?.town || user?.branch_town} Store` : 'Branch Account'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.35rem', fontSize: '0.8rem', color: '#94a3b8', flexWrap: 'wrap' }}>
              {(branchDetail?.address || branchDetail?.town || user?.branch_town) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={14} color="#d51e27" flexShrink={0} />
                  {[branchDetail?.address, branchDetail?.town || user?.branch_town].filter(Boolean).join(', ')}
                </span>
              )}
              {(branchDetail?.phone || user?.phone) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Phone size={14} color="#64748b" flexShrink={0} />
                  {branchDetail?.phone || user?.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick summary counts */}
        <div className="branch-counts-strip" style={{ display: 'flex', gap: '0.85rem' }}>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{pendingConfirmation.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Awaiting Receipt</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80' }}>{receivedItems.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Confirmed</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>{problemItems.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Problems</div>
          </div>
        </div>
      </div>

      {/* Main Content Split: My Calendar & My Items Table (Matches Panel 3) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Calendar View for Branch */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              My Branch Calendar
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Items issued to {branchDetail?.name || user?.branch_name || user?.name || 'your store'}
            </span>
          </div>
          <CalendarMonth
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            issues={issues}
            onSelectIssue={onSelectIssue}
            showBranchName={false}
            isMini={true}
          />
        </div>

        {/* My Items Confirmation Table (Panel 3 Bottom) */}
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
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                My Items & Deliveries
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Tap "Mark Received" when POSM arrives, or "Problem" if damaged or missing
              </p>
            </div>
            <span className="badge badge-issued">
              {issues.length} Total Deliveries
            </span>
          </div>

          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item Type</th>
                  <th>Campaign / Promo</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                      No items issued to this branch yet.
                    </td>
                  </tr>
                ) : (
                  issues.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>
                        {item.issue_date}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          {item.item_type_name}
                        </span>
                        {item.slot_width && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {item.slot_width}x{item.slot_height} {item.slot_unit} ({item.slot_orientation})
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {item.campaign}
                        </div>
                        {item.note && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.note}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {item.qty || 1} pcs
                      </td>
                      <td>
                        <span className={`badge badge-${item.status_color === 'green' ? 'received' : item.status_color === 'red' ? 'problem' : item.status_color === 'blue' ? 'issued' : 'pending'}`}>
                          {item.display_status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          {item.status !== 'Received' ? (
                            <>
                              <button
                                onClick={() => handleQuickReceive(item)}
                                disabled={actionLoadingId === item.id}
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <CheckCircle2 size={14} />
                                {actionLoadingId === item.id ? 'Saving...' : "Mark Received"}
                              </button>

                              <button
                                onClick={() => onSelectIssue(item)}
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  background: '#ffffff',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <AlertTriangle size={14} />
                                Problem
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onSelectIssue(item)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                background: '#f8fafc',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <Eye size={14} />
                              View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
