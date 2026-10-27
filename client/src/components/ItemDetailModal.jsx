import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Store, Clock, CheckCircle2, AlertTriangle, User, Paperclip, Send } from 'lucide-react';
import { issuesApi } from '../services/api';
import confetti from 'canvas-confetti';

export default function ItemDetailModal({ issueId, user, onClose, onRefresh }) {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [problemType, setProblemType] = useState('Damaged in transit');
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await issuesApi.getById(issueId);
      setIssue(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) {
      fetchDetail();
    }
  }, [issueId]);

  const handleConfirmReceived = async () => {
    try {
      setActionLoading(true);
      await issuesApi.confirmReceive(issueId, { comment: commentText });

      // Trigger celebratory confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      onRefresh && onRefresh();
      fetchDetail();
    } catch (err) {
      alert(err.message || 'Error confirming receipt');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportProblem = async () => {
    if (!commentText.trim()) {
      alert('Please describe the problem details.');
      return;
    }
    try {
      setActionLoading(true);
      await issuesApi.reportProblem(issueId, {
        problem_type: problemType,
        comment: commentText
      });
      setShowProblemForm(false);
      onRefresh && onRefresh();
      fetchDetail();
    } catch (err) {
      alert(err.message || 'Error reporting problem');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      await issuesApi.updateStatus(issueId, newStatus, `Status updated to ${newStatus} by Admin`);
      onRefresh && onRefresh();
      fetchDetail();
    } catch (err) {
      alert(err.message || 'Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  if (!issueId) return null;

  const isBranchUser = user?.role === 'branch';
  const isAdmin = user?.role === 'admin';
  const canBranchAct = isBranchUser && issue && issue.branch_id === user.branch_id && issue.status !== 'Received';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                {issue ? issue.campaign : 'POSM Issue Details'}
              </h2>
              {issue && (
                <span className={`badge badge-${issue.status_color === 'green' ? 'received' : issue.status_color === 'red' ? 'problem' : issue.status_color === 'blue' ? 'issued' : 'pending'}`}>
                  {issue.display_status}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
              Issue ID #{issueId} · Created by {issue?.creator_name || 'Marketing'}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              color: '#64748b',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Loading issue details...
          </div>
        ) : issue ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Summary Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Target Branch</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontWeight: 700, color: '#0f172a' }}>
                  <Store size={16} color="#d51e27" />
                  {issue.branch_name} ({issue.branch_town})
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                  {issue.branch_address}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>POSM Specifications</span>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  {issue.item_type_name} — {issue.qty} pcs
                </div>
                {issue.slot_width && (
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.15rem' }}>
                    Size: {issue.slot_width} x {issue.slot_height} {issue.slot_unit} ({issue.slot_orientation})
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Issue Date</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontWeight: 600, color: '#0f172a' }}>
                  <Calendar size={15} color="#64748b" />
                  {issue.issue_date}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Elapsed: {issue.days_elapsed} days
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Overdue Status</span>
                <div style={{ marginTop: '0.2rem', fontWeight: 700, color: issue.is_overdue ? '#b91c1c' : '#047857' }}>
                  {issue.is_overdue ? '⚠️ Overdue (Past 2nd of Month)' : '✓ Within On-Time Window'}
                </div>
              </div>
            </div>

            {/* Note from Marketing */}
            {issue.note && (
              <div
                style={{
                  padding: '1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Note from Marketing
                </div>
                <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{issue.note}</div>
              </div>
            )}

            {/* Attachment if present */}
            {issue.attachment_url && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Paperclip size={16} color="#d51e27" />
                  <span>Artwork / Dispatch Note Attachment</span>
                </div>
                <a
                  href={issue.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#d51e27',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textDecoration: 'underline'
                  }}
                >
                  View File
                </a>
              </div>
            )}

            {/* Branch Actions (Receive / Problem) */}
            {(canBranchAct || isAdmin) && (
              <div
                style={{
                  padding: '1.25rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  {isBranchUser ? 'Confirm Item Receipt or Report Issue' : 'Administrative Actions'}
                </div>

                {!showProblemForm ? (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleConfirmReceived}
                      disabled={actionLoading || issue.status === 'Received'}
                      style={{
                        flex: '1',
                        padding: '0.65rem 1rem',
                        background: '#16a34a',
                        color: '#ffffff',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 5px rgba(22, 163, 74, 0.3)'
                      }}
                    >
                      <CheckCircle2 size={18} />
                      {issue.status === 'Received' ? 'Already Received' : 'Mark Received'}
                    </button>

                    <button
                      onClick={() => setShowProblemForm(true)}
                      disabled={actionLoading}
                      style={{
                        flex: '1',
                        padding: '0.65rem 1rem',
                        background: '#ffffff',
                        color: '#dc2626',
                        border: '1.5px solid #dc2626',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <AlertTriangle size={18} />
                      Report Problem
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleAdminStatusChange(issue.status === 'Issued' ? 'Pending' : 'Issued')}
                        style={{
                          padding: '0.65rem 0.85rem',
                          background: '#f1f5f9',
                          color: '#475569',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        Set to {issue.status === 'Issued' ? 'Pending' : 'Issued'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        value={problemType}
                        onChange={(e) => setProblemType(e.target.value)}
                        style={{ flex: '1' }}
                      >
                        <option value="Damaged in transit">Damaged in transit</option>
                        <option value="Wrong size delivered">Wrong size delivered</option>
                        <option value="Not arrived / missing">Not arrived / missing</option>
                        <option value="Print quality issue">Print quality issue</option>
                        <option value="Other">Other problem</option>
                      </select>
                    </div>

                    <textarea
                      placeholder="Please explain the problem for Marketing..."
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      style={{ width: '100%' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => setShowProblemForm(false)}
                        style={{
                          padding: '0.5rem 0.85rem',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          fontSize: '0.825rem'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReportProblem}
                        disabled={actionLoading}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#dc2626',
                          color: '#ffffff',
                          borderRadius: '6px',
                          fontSize: '0.825rem',
                          fontWeight: 700
                        }}
                      >
                        Submit Problem Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audit History Timeline */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                Status History & Audit Trail
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {issue.history && issue.history.length > 0 ? (
                  issue.history.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${
                          h.status === 'Received' ? '#16a34a' : h.status === 'Problem' ? '#dc2626' : '#2563eb'
                        }`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a' }}>
                          {h.status}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {h.updated_at ? h.updated_at.slice(0, 16) : ''}
                        </span>
                      </div>
                      {h.comment && (
                        <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
                          {h.comment}
                        </p>
                      )}
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                        Updated by: {h.updated_by_name || 'System / Branch'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No history recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
