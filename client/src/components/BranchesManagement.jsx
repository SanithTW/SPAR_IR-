import React, { useState, useEffect } from 'react';
import { Building2, PlusCircle, Search, Edit2, Layers, X, Phone, MapPin, User, Trash2 } from 'lucide-react';
import { branchesApi } from '../services/api';

export default function BranchesManagement({ user, searchQuery }) {
  const [branches, setBranches] = useState([]);
  const [localSearch, setLocalSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedBranchForSlots, setSelectedBranchForSlots] = useState(null);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState(null);

  // New branch form
  const [branchForm, setBranchForm] = useState({ name: '', town: '', address: '', contact: '', phone: '' });

  // New slot form
  const [slotForm, setSlotForm] = useState({ width: '12', height: '8', unit: 'ft', orientation: 'Horizontal', sides: '1', qty: '1', notes: '' });

  const isAdmin = user?.role === 'admin';

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await branchesApi.getAll();
      setBranches(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenSlotsModal = async (branch) => {
    try {
      const res = await branchesApi.getById(branch.id);
      setSelectedBranchForSlots(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!selectedBranchForSlots) return;

    try {
      await branchesApi.addSlot(selectedBranchForSlots.id, slotForm);
      // refresh slots
      const updated = await branchesApi.getById(selectedBranchForSlots.id);
      setSelectedBranchForSlots(updated);
      fetchBranches();
      setSlotForm({ width: '12', height: '8', unit: 'ft', orientation: 'Horizontal', sides: '1', qty: '1', notes: '' });
    } catch (err) {
      alert(err.message || 'Error adding hoarding slot');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this hoarding slot?')) return;
    try {
      await branchesApi.deleteSlot(selectedBranchForSlots.id, slotId);
      const updated = await branchesApi.getById(selectedBranchForSlots.id);
      setSelectedBranchForSlots(updated);
      fetchBranches();
    } catch (err) {
      alert(err.message || 'Error deleting slot');
    }
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    try {
      if (showEditBranchModal) {
        await branchesApi.update(showEditBranchModal.id, branchForm);
        setShowEditBranchModal(null);
      } else {
        await branchesApi.create(branchForm);
        setShowAddBranchModal(false);
      }
      setBranchForm({ name: '', town: '', address: '', contact: '', phone: '' });
      fetchBranches();
    } catch (err) {
      alert(err.message || 'Error saving branch');
    }
  };

  const query = (localSearch || searchQuery || '').toLowerCase();
  const filtered = branches.filter(b =>
    b.name.toLowerCase().includes(query) ||
    b.town.toLowerCase().includes(query) ||
    b.contact.toLowerCase().includes(query)
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner / Controls (Matches Panel 5) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            IR Branches Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.15rem' }}>
            Manage SaveMor IR branches, contact info, and attached hoarding specifications
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search branch or town..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2rem', height: '38px', fontSize: '0.825rem' }}
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setBranchForm({ name: '', town: '', address: '', contact: '', phone: '' });
                setShowAddBranchModal(true);
              }}
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
              <PlusCircle size={16} /> + Add Branch
            </button>
          )}
        </div>
      </div>

      {/* Branches Table (Matches Screen 5) */}
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
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
            Showing {filtered.length} of {branches.length} SaveMor branches
          </span>
          <span className="badge badge-received">
            All 22 branches seeded & verified
          </span>
        </div>

        <div className="app-table-container">
          <table className="app-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Branch Name</th>
                <th>Town</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Hoarding Slots</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No branches found matching search.
                  </td>
                </tr>
              ) : (
                filtered.map((b, idx) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={16} color="#d51e27" />
                        <span>{b.name}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '1.4rem' }}>
                        {b.address}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{b.town}</td>
                    <td>{b.contact}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>{b.phone}</td>
                    <td>
                      <button
                        onClick={() => handleOpenSlotsModal(b)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#0f172a'
                        }}
                      >
                        <Layers size={14} color="#d51e27" />
                        <span>{b.slot_count || 0} Slots</span>
                      </button>
                    </td>
                    <td>
                      <span className={`badge ${b.active ? 'badge-active' : 'badge-inactive'}`}>
                        {b.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setBranchForm({
                                name: b.name,
                                town: b.town,
                                address: b.address,
                                contact: b.contact,
                                phone: b.phone
                              });
                              setShowEditBranchModal(b);
                            }}
                            style={{
                              padding: '0.35rem 0.6rem',
                              background: '#f1f5f9',
                              color: '#334155',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenSlotsModal(b)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          Slots
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hoarding Slots Modal for Branch */}
      {selectedBranchForSlots && (
        <div className="modal-overlay" onClick={() => setSelectedBranchForSlots(null)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                  {selectedBranchForSlots.name} — Hoarding Slots
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                  {selectedBranchForSlots.town} · Attached billboard slots & outdoor physical specs
                </p>
              </div>
              <button
                onClick={() => setSelectedBranchForSlots(null)}
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

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Existing Slots List */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem' }}>
                  Current Hoarding Slots ({selectedBranchForSlots.slots?.length || 0})
                </h3>

                {selectedBranchForSlots.slots && selectedBranchForSlots.slots.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedBranchForSlots.slots.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          padding: '0.75rem 1rem',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                            {s.width}' x {s.height}' {s.unit} ({s.orientation}) — {s.qty} {s.qty > 1 ? 'nos' : 'no'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                            Sides: {s.sides === 2 ? 'Both Sides (Double)' : 'Single Side'} {s.notes ? `· ${s.notes}` : ''}
                          </div>
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteSlot(s.id)}
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              padding: '0.35rem',
                              borderRadius: '6px'
                            }}
                            title="Delete slot"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
                    No hoarding slots attached to this branch yet.
                  </div>
                )}
              </div>

              {/* Add New Slot (Admin only) */}
              {isAdmin && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.65rem' }}>
                    + Attach New Hoarding Slot
                  </h3>
                  <form onSubmit={handleAddSlot} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Width</label>
                      <input
                        type="number"
                        step="0.5"
                        value={slotForm.width}
                        onChange={(e) => setSlotForm({ ...slotForm, width: e.target.value })}
                        required
                        style={{ width: '100%', height: '36px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Height</label>
                      <input
                        type="number"
                        step="0.5"
                        value={slotForm.height}
                        onChange={(e) => setSlotForm({ ...slotForm, height: e.target.value })}
                        required
                        style={{ width: '100%', height: '36px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Orientation</label>
                      <select
                        value={slotForm.orientation}
                        onChange={(e) => setSlotForm({ ...slotForm, orientation: e.target.value })}
                        style={{ width: '100%', height: '36px' }}
                      >
                        <option value="Horizontal">Horizontal</option>
                        <option value="Vertical">Vertical</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Sides</label>
                      <select
                        value={slotForm.sides}
                        onChange={(e) => setSlotForm({ ...slotForm, sides: e.target.value })}
                        style={{ width: '100%', height: '36px' }}
                      >
                        <option value="1">Single Sided</option>
                        <option value="2">Both Sides (Double)</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Notes / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Front road entrance main hoarding"
                        value={slotForm.notes}
                        onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
                        style={{ width: '100%', height: '36px' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                      <button
                        type="submit"
                        style={{
                          padding: '0.45rem 1rem',
                          background: '#d51e27',
                          color: '#ffffff',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}
                      >
                        Attach Slot
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      {(showAddBranchModal || showEditBranchModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddBranchModal(false); setShowEditBranchModal(null); }}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {showEditBranchModal ? 'Edit Branch' : 'Add New SaveMor Branch'}
              </h2>
              <button
                onClick={() => { setShowAddBranchModal(false); setShowEditBranchModal(null); }}
                style={{ background: '#f1f5f9', color: '#64748b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chandra Super"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  style={{ width: '100%', height: '40px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Town *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Palmadulla"
                  value={branchForm.town}
                  onChange={(e) => setBranchForm({ ...branchForm, town: e.target.value })}
                  style={{ width: '100%', height: '40px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Address</label>
                <input
                  type="text"
                  placeholder="e.g. Main Street, Palmadulla"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  style={{ width: '100%', height: '40px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Nimal Perera"
                    value={branchForm.contact}
                    onChange={(e) => setBranchForm({ ...branchForm, contact: e.target.value })}
                    style={{ width: '100%', height: '40px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 077 123 4567"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    style={{ width: '100%', height: '40px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => { setShowAddBranchModal(false); setShowEditBranchModal(null); }}
                  style={{ padding: '0.55rem 1rem', background: '#f1f5f9', borderRadius: '6px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.55rem 1.25rem', background: '#d51e27', color: '#ffffff', borderRadius: '6px', fontWeight: 700 }}
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
