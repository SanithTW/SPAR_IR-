import React, { useState, useEffect } from 'react';
import { Layers, PlusCircle, Check, X, Edit2 } from 'lucide-react';
import { typesAndSizesApi } from '../services/api';

export default function SizesTypesManagement({ user }) {
  const [itemTypes, setItemTypes] = useState([]);
  const [hoardingSizes, setHoardingSizes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showAddSizeModal, setShowAddSizeModal] = useState(false);

  // Forms
  const [typeForm, setTypeForm] = useState({ name: '', description: '' });
  const [sizeForm, setSizeForm] = useState({ width: '12', height: '8', unit: 'ft', orientation: 'Horizontal', sides: '1' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [typesRes, sizesRes] = await Promise.all([
        typesAndSizesApi.getItemTypes(),
        typesAndSizesApi.getHoardingSizes()
      ]);
      setItemTypes(typesRes || []);
      setHoardingSizes(sizesRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      await typesAndSizesApi.createItemType(typeForm);
      setShowAddTypeModal(false);
      setTypeForm({ name: '', description: '' });
      fetchData();
    } catch (err) {
      alert(err.message || 'Error creating item type');
    }
  };

  const handleCreateSize = async (e) => {
    e.preventDefault();
    try {
      await typesAndSizesApi.createHoardingSize(sizeForm);
      setShowAddSizeModal(false);
      setSizeForm({ width: '12', height: '8', unit: 'ft', orientation: 'Horizontal', sides: '1' });
      fetchData();
    } catch (err) {
      alert(err.message || 'Error creating hoarding size');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
          Sizes & Item Types Settings
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.15rem' }}>
          Master library of POSM item categories and hoarding billboard dimension templates
        </p>
      </div>

      {/* Grid: 2 Tables (Matches Screen 6) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Table 1: Hoarding Sizes */}
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
                Hoarding Sizes Master
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Width x Height specifications, units, and orientations
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowAddSizeModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#d51e27',
                  color: '#ffffff',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                <PlusCircle size={15} /> + Add Size
              </button>
            )}
          </div>

          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Width</th>
                  <th>Height</th>
                  <th>Unit</th>
                  <th>Orientation</th>
                  <th>Sides</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hoardingSizes.map((s, idx) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700 }}>{s.width}</td>
                    <td style={{ fontWeight: 700 }}>{s.height}</td>
                    <td>{s.unit}</td>
                    <td>{s.orientation}</td>
                    <td>{s.sides === 2 ? 'Both Sides' : 'Single Side'}</td>
                    <td>
                      <span className="badge badge-active">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Item Types */}
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
                Item Types
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Tabloid, Poster, Hoarding, Wobbler, Banners and custom items
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowAddTypeModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#d51e27',
                  color: '#ffffff',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                <PlusCircle size={15} /> + Add Type
              </button>
            )}
          </div>

          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Type Name</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {itemTypes.map((t, idx) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{t.name}</td>
                    <td style={{ color: '#475569' }}>{t.description || '—'}</td>
                    <td>
                      <span className="badge badge-active">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Size Modal */}
      {showAddSizeModal && (
        <div className="modal-overlay" onClick={() => setShowAddSizeModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Add Hoarding Size</h2>
              <button onClick={() => setShowAddSizeModal(false)} style={{ background: '#f1f5f9', width: '28px', height: '28px', borderRadius: '50%' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateSize} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Width</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={sizeForm.width}
                    onChange={(e) => setSizeForm({ ...sizeForm, width: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Height</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={sizeForm.height}
                    onChange={(e) => setSizeForm({ ...sizeForm, height: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Orientation</label>
                  <select
                    value={sizeForm.orientation}
                    onChange={(e) => setSizeForm({ ...sizeForm, orientation: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="Horizontal">Horizontal</option>
                    <option value="Vertical">Vertical</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sides</label>
                  <select
                    value={sizeForm.sides}
                    onChange={(e) => setSizeForm({ ...sizeForm, sides: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="1">Single Sided</option>
                    <option value="2">Both Sides (Double)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddSizeModal(false)} style={{ padding: '0.5rem 0.85rem', background: '#f1f5f9', borderRadius: '6px' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#d51e27', color: '#ffffff', borderRadius: '6px', fontWeight: 700 }}>Save Size</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Type Modal */}
      {showAddTypeModal && (
        <div className="modal-overlay" onClick={() => setShowAddTypeModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Add Item Type</h2>
              <button onClick={() => setShowAddTypeModal(false)} style={{ background: '#f1f5f9', width: '28px', height: '28px', borderRadius: '50%' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateType} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Type Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wobbler / Standee / Floor Sticker"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Details about print material or placement"
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddTypeModal(false)} style={{ padding: '0.5rem 0.85rem', background: '#f1f5f9', borderRadius: '6px' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#d51e27', color: '#ffffff', borderRadius: '6px', fontWeight: 700 }}>Save Type</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
