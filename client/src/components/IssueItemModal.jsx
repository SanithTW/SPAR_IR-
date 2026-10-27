import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Paperclip, Check, Store } from 'lucide-react';
import { issuesApi, branchesApi, typesAndSizesApi } from '../services/api';

export default function IssueItemModal({ onClose, onSuccess }) {
  const [branches, setBranches] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [hoardingSizes, setHoardingSizes] = useState([]);

  const [itemTypeId, setItemTypeId] = useState('');
  const [campaign, setCampaign] = useState('');
  const [qty, setQty] = useState(1);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [hoardingSizeId, setHoardingSizeId] = useState('');

  const [targetMode, setTargetMode] = useState('all'); // 'all' or 'specific'
  const [selectedBranchIds, setSelectedBranchIds] = useState([]);
  const [branchSearch, setBranchSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      branchesApi.getAll(),
      typesAndSizesApi.getItemTypes(),
      typesAndSizesApi.getHoardingSizes()
    ]).then(([branchesRes, typesRes, sizesRes]) => {
      setBranches(branchesRes || []);
      setItemTypes(typesRes || []);
      setHoardingSizes(sizesRes || []);

      if (typesRes && typesRes.length > 0) {
        setItemTypeId(typesRes[0].id);
      }
    }).catch(console.error);
  }, []);

  const selectedType = itemTypes.find((t) => t.id === parseInt(itemTypeId, 10));
  const isHoarding = selectedType && selectedType.name.toLowerCase().includes('hoarding');

  const toggleBranch = (id) => {
    if (selectedBranchIds.includes(id)) {
      setSelectedBranchIds(selectedBranchIds.filter(bId => bId !== id));
    } else {
      setSelectedBranchIds([...selectedBranchIds, id]);
    }
  };

  const handleSelectAllBranches = () => {
    setSelectedBranchIds(branches.map(b => b.id));
  };

  const handleDeselectAllBranches = () => {
    setSelectedBranchIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!campaign.trim()) {
      setError('Please provide a campaign or promotion name');
      return;
    }

    if (targetMode === 'specific' && selectedBranchIds.length === 0) {
      setError('Please select at least one branch');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        item_type_id: parseInt(itemTypeId, 10),
        campaign: campaign.trim(),
        qty: parseInt(qty, 10) || 1,
        issue_date: issueDate,
        note: note.trim(),
        all_branches: targetMode === 'all',
        branch_ids: targetMode === 'specific' ? selectedBranchIds : undefined
      };

      await issuesApi.create(payload);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to issue item');
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter(b =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
    b.town.toLowerCase().includes(branchSearch.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
              Issue Item
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
              Create and issue a new POSM item to one or more branches
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Item Type *
              </label>
              <select
                value={itemTypeId}
                onChange={(e) => setItemTypeId(e.target.value)}
                style={{ width: '100%', height: '42px' }}
                required
              >
                {itemTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Campaign / Promo Name *
              </label>
              <input
                type="text"
                placeholder="e.g. October Campaign / Mega Sale"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                style={{ width: '100%', height: '42px' }}
                required
              >
              </input>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isHoarding ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1rem' }}>
            {isHoarding && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Size (for hoardings)
                </label>
                <select
                  value={hoardingSizeId}
                  onChange={(e) => setHoardingSizeId(e.target.value)}
                  style={{ width: '100%', height: '42px' }}
                >
                  <option value="">-- Standard Size --</option>
                  {hoardingSizes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.width} x {s.height} {s.unit} ({s.orientation})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{ width: '100%', height: '42px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Issue Date *
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                style={{ width: '100%', height: '42px' }}
                required
              />
            </div>
          </div>

          {/* Branch Selection Section */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.65rem' }}>
              Target Branches
            </label>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="targetMode"
                  value="all"
                  checked={targetMode === 'all'}
                  onChange={() => setTargetMode('all')}
                />
                <span>All {branches.length || 22} branches</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="targetMode"
                  value="specific"
                  checked={targetMode === 'specific'}
                  onChange={() => setTargetMode('specific')}
                />
                <span>Select specific branches ({selectedBranchIds.length} selected)</span>
              </label>
            </div>

            {targetMode === 'specific' && (
              <div style={{ marginTop: '0.75rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Search branches..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: '220px' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleSelectAllBranches}
                      style={{ fontSize: '0.75rem', color: '#d51e27', background: 'transparent', fontWeight: 600 }}
                    >
                      Select All
                    </button>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllBranches}
                      style={{ fontSize: '0.75rem', color: '#64748b', background: 'transparent' }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.4rem'
                  }}
                >
                  {filteredBranches.map((b) => (
                    <label
                      key={b.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                        padding: '0.35rem',
                        borderRadius: '4px',
                        background: selectedBranchIds.includes(b.id) ? '#fef2f2' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBranchIds.includes(b.id)}
                        onChange={() => toggleBranch(b.id)}
                      />
                      <span style={{ fontWeight: selectedBranchIds.includes(b.id) ? 700 : 500, color: '#1e293b' }}>
                        {b.name} <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>({b.town})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Note for Branch
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Monthly promotional posters for October campaign..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                background: '#f1f5f9',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '8px',
                background: '#d51e27',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: '0 2px 6px rgba(213, 30, 39, 0.35)'
              }}
            >
              {loading ? 'Issuing...' : 'Issue Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
