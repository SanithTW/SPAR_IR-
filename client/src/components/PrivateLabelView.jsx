import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  Eye,
  Calendar,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';
import { privateLabelsApi, uploadApi } from '../services/api';

const CATEGORIES = [
  'All',
  'Food & Beverages',
  'Personal Care',
  'Household & Cleaning',
  'Packaging & Labels',
  'Brand Guidelines',
  'General'
];

export default function PrivateLabelView({ user, searchQuery = '' }) {
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'pdf', 'image'

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);

  // Load data
  const loadPrivateLabels = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await privateLabelsApi.getAll();
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load private labels:', err);
      setError(err.message || 'Failed to load private label items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrivateLabels();
  }, []);

  // Combined search term from navbar search or local search
  const effectiveSearch = (localSearch || searchQuery || '').trim().toLowerCase();

  // Filter items
  const filteredItems = items.filter(item => {
    // Category match
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }

    // Type match
    const isPdf = item.file_type?.toLowerCase().includes('pdf') || item.file_url?.toLowerCase().endsWith('.pdf');
    if (selectedType === 'pdf' && !isPdf) return false;
    if (selectedType === 'image' && isPdf) return false;

    // Search match
    if (effectiveSearch) {
      const matchTitle = item.title?.toLowerCase().includes(effectiveSearch);
      const matchDesc = item.description?.toLowerCase().includes(effectiveSearch);
      const matchFile = item.file_name?.toLowerCase().includes(effectiveSearch);
      const matchCat = item.category?.toLowerCase().includes(effectiveSearch);
      if (!matchTitle && !matchDesc && !matchFile && !matchCat) {
        return false;
      }
    }

    return true;
  });

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #d51e27 0%, #b3141c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 6px rgba(213, 30, 39, 0.3)'
              }}
            >
              <Tag size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Private Label Library
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            Browse, inspect, and download official SPAR private label artwork, packaging templates, and brand specs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={loadPrivateLabels}
            title="Refresh list"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 0.9rem',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                background: 'linear-gradient(135deg, #d51e27 0%, #b3141c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(213, 30, 39, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={18} />
              Add Private Label
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '450px' }}>
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }}
            />
            <input
              type="text"
              placeholder="Search by label name, description, or file..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.9rem 0.6rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                style={{
                  position: 'absolute',
                  right: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 2
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginRight: '0.2rem' }}>
              Format:
            </span>
            <button
              onClick={() => setSelectedType('all')}
              style={{
                padding: '0.45rem 0.8rem',
                borderRadius: '6px',
                border: selectedType === 'all' ? '1px solid #d51e27' : '1px solid #e2e8f0',
                background: selectedType === 'all' ? '#fee2e2' : '#ffffff',
                color: selectedType === 'all' ? '#d51e27' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType('image')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.45rem 0.8rem',
                borderRadius: '6px',
                border: selectedType === 'image' ? '1px solid #0284c7' : '1px solid #e2e8f0',
                background: selectedType === 'image' ? '#e0f2fe' : '#ffffff',
                color: selectedType === 'image' ? '#0369a1' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ImageIcon size={14} />
              Images (JPG/PNG)
            </button>
            <button
              onClick={() => setSelectedType('pdf')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.45rem 0.8rem',
                borderRadius: '6px',
                border: selectedType === 'pdf' ? '1px solid #b91c1c' : '1px solid #e2e8f0',
                background: selectedType === 'pdf' ? '#fef2f2' : '#ffffff',
                color: selectedType === 'pdf' ? '#b91c1c' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FileText size={14} />
              PDFs
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', paddingTop: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginRight: '0.2rem' }}>
            Category:
          </span>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  border: isSelected ? '1px solid #007a3d' : '1px solid #e2e8f0',
                  background: isSelected ? '#e8f5e9' : '#f8fafc',
                  color: isSelected ? '#007a3d' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '4rem 2rem',
            textAlign: 'center',
            color: '#64748b'
          }}
        >
          <div className="spin" style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
            <RefreshCw size={28} color="#d51e27" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Loading Private Label assets...</p>
        </div>
      ) : error ? (
        <div
          style={{
            background: '#fef2f2',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            padding: '2rem',
            textAlign: 'center',
            color: '#b91c1c'
          }}
        >
          <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Failed to load private labels</h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>{error}</p>
          <button
            onClick={loadPrivateLabels}
            style={{
              padding: '0.5rem 1rem',
              background: '#b91c1c',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Retry
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            padding: '4rem 2rem',
            textAlign: 'center',
            color: '#64748b'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              color: '#94a3b8'
            }}
          >
            <Tag size={32} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#1e293b' }}>
            No Private Label assets found
          </h3>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            {effectiveSearch || selectedCategory !== 'All' || selectedType !== 'all'
              ? 'No assets match your search or filter criteria. Try clearing filters.'
              : 'No private label assets have been uploaded yet. Upload designs, artworks, and brand guidelines to share with all stores.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                background: '#d51e27',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              Upload First Private Label
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Asset Count Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              Showing {filteredItems.length} of {items.length} {items.length === 1 ? 'asset' : 'assets'}
            </span>
          </div>

          {/* Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {filteredItems.map(item => {
              const isPdf = item.file_type?.toLowerCase().includes('pdf') || item.file_url?.toLowerCase().endsWith('.pdf');

              return (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                  }}
                >
                  {/* Top Media Preview Area */}
                  <div
                    style={{
                      height: '180px',
                      background: isPdf ? 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)' : '#0f172a',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                    onClick={() => {
                      if (isPdf) {
                        window.open(item.file_url, '_blank', 'noopener,noreferrer');
                      } else {
                        setPreviewMedia(item);
                      }
                    }}
                  >
                    {isPdf ? (
                      <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            background: '#d51e27',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(213, 30, 39, 0.3)',
                            marginBottom: '0.5rem'
                          }}
                        >
                          <FileText size={30} />
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#991b1b' }}>
                          PDF DOCUMENT
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '2px' }}>
                          Click to open and view document
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.file_url}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          background: '#f8fafc'
                        }}
                      />
                    )}

                    {/* Format Badge overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.65rem',
                        right: '0.65rem',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                        background: isPdf ? '#b91c1c' : '#007a3d',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      {isPdf ? 'PDF' : (item.file_type?.split('/')[1] || 'IMAGE').toUpperCase()}
                    </div>

                    {/* Quick view button overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.65rem',
                        right: '0.65rem',
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Eye size={12} />
                      Preview
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Category & Date */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: '#007a3d',
                          background: '#e8f5e9',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px'
                        }}
                      >
                        {item.category || 'General'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Calendar size={12} />
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0 0 0.4rem 0',
                        lineHeight: 1.35
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Description */}
                    {item.description ? (
                      <p
                        style={{
                          fontSize: '0.825rem',
                          color: '#64748b',
                          margin: '0 0 0.85rem 0',
                          lineHeight: 1.45,
                          flex: 1
                        }}
                      >
                        {item.description}
                      </p>
                    ) : (
                      <div style={{ flex: 1 }} />
                    )}

                    {/* Metadata line */}
                    <div
                      style={{
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #f1f5f9',
                        fontSize: '0.75rem',
                        color: '#64748b',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.85rem'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }} title={item.file_name}>
                        📎 {item.file_name || 'Attached file'}
                      </span>
                      {item.file_size && (
                        <span style={{ fontWeight: 600, color: '#475569' }}>
                          {formatFileSize(item.file_size)}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto' }}>
                      {/* Download / Open file - Accessible to EVERY user */}
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={item.file_name || true}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          padding: '0.55rem 0.85rem',
                          background: '#f1f5f9',
                          color: '#1e293b',
                          borderRadius: '6px',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          border: '1px solid #e2e8f0',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#e2e8f0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f1f5f9';
                        }}
                      >
                        <Download size={14} color="#d51e27" />
                        Download / Open
                      </a>

                      {/* Admin Edit & Delete buttons */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setEditingItem(item)}
                            title="Edit Private Label"
                            style={{
                              padding: '0.55rem',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            title="Delete Private Label"
                            style={{
                              padding: '0.55rem',
                              background: '#ffffff',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || editingItem) && (
        <PrivateLabelFormModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingItem(null);
            loadPrivateLabels();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <DeleteConfirmModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onSuccess={() => {
            setDeletingItem(null);
            loadPrivateLabels();
          }}
        />
      )}

      {/* Full Image Preview Modal */}
      {previewMedia && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setPreviewMedia(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#0f172a',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid #334155',
                color: '#fff'
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{previewMedia.title}</h4>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {previewMedia.file_name} • {previewMedia.category}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a
                  href={previewMedia.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.75rem',
                    background: '#d51e27',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <Download size={14} />
                  Download
                </a>
                <button
                  onClick={() => setPreviewMedia(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.4rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
              <img
                src={previewMedia.file_url}
                alt={previewMedia.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// FORM MODAL (Add / Edit)
// ==========================================
function PrivateLabelFormModal({ item, onClose, onSuccess }) {
  const isEdit = !!item;

  const [title, setTitle] = useState(item?.title || '');
  const [category, setCategory] = useState(item?.category || 'General');
  const [description, setDescription] = useState(item?.description || '');

  // File state
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(item?.file_url || null);
  const [fileType, setFileType] = useState(item?.file_type || null);
  const [fileName, setFileName] = useState(item?.file_name || null);
  const [fileSize, setFileSize] = useState(item?.file_size || null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type: jpg, png, or pdf
    const validMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const validExts = ['.jpg', '.jpeg', '.png', '.pdf'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (!validMimes.includes(file.type) && !validExts.includes(fileExt)) {
      setError('Please upload a JPG, PNG, or PDF file only.');
      return;
    }

    // Check size limit: 25MB
    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB limit.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type || (fileExt === '.pdf' ? 'application/pdf' : 'image/jpeg'));

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null); // PDF icon fallback
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Private label name is required.');
      return;
    }

    if (!isEdit && !selectedFile) {
      setError('Please select a JPG, PNG, or PDF file to upload.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let finalFileUrl = item?.file_url;
      let finalFileName = fileName;
      let finalFileType = fileType;
      let finalFileSize = fileSize;

      // If new file chosen, upload it first
      if (selectedFile) {
        const uploadRes = await uploadApi.uploadFile(selectedFile);
        finalFileUrl = uploadRes.url;
        finalFileName = uploadRes.filename || selectedFile.name;
        finalFileType = selectedFile.type;
        finalFileSize = uploadRes.size || selectedFile.size;
      }

      const payload = {
        title: title.trim(),
        category,
        description: description.trim(),
        file_url: finalFileUrl,
        file_name: finalFileName,
        file_type: finalFileType,
        file_size: finalFileSize
      };

      if (isEdit) {
        await privateLabelsApi.update(item.id, payload);
      } else {
        await privateLabelsApi.create(payload);
      }

      onSuccess();
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.message || 'Failed to save private label item');
      setSaving(false);
    }
  };

  const isPdf = fileType?.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#fee2e2',
                color: '#d51e27',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Tag size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {isEdit ? 'Edit Private Label' : 'Add New Private Label'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} flexShrink={0} />
              <span>{error}</span>
            </div>
          )}

          {/* Private Label Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
              Private Label Name <span style={{ color: '#d51e27' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. SPAR Select Basmati Rice 5kg, SaveMor Laundry Detergent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
              Description / Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add details, size specifications, barcode notes, or printer instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
              Upload Asset (JPG, PNG, or PDF) {!isEdit && <span style={{ color: '#d51e27' }}>*</span>}
            </label>

            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '1.25rem',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => document.getElementById('private-label-file-input').click()}
            >
              <input
                id="private-label-file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {fileName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textAlign: 'left' }}>
                  {isPdf ? (
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        background: '#fee2e2',
                        color: '#d51e27',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <FileText size={24} />
                    </div>
                  ) : filePreview ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        flexShrink: 0,
                        border: '1px solid #e2e8f0'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <ImageIcon size={24} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fileName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {isPdf ? 'PDF Document' : 'Image File'} {fileSize ? `• ${(fileSize / (1024 * 1024)).toFixed(2)} MB` : ''}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#007a3d', fontWeight: 600, marginTop: '2px' }}>
                      Click to choose a different file
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <UploadCloud size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                    Click to select JPG, PNG, or PDF file
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Maximum file size: 25 MB
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #d51e27 0%, #b3141c 100%)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 10px rgba(213, 30, 39, 0.3)'
              }}
            >
              {saving ? (
                <>
                  <RefreshCw size={15} className="spin" />
                  Saving...
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Upload Private Label'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// DELETE CONFIRMATION MODAL
// ==========================================
function DeleteConfirmModal({ item, onClose, onSuccess }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await privateLabelsApi.delete(item.id);
      onSuccess();
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.message || 'Failed to delete private label');
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '440px',
          padding: '1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}
        >
          <Trash2 size={24} />
        </div>

        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
          Delete Private Label Asset?
        </h3>

        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
          Are you sure you want to delete <strong style={{ color: '#1e293b' }}>"{item.title}"</strong>?
          All users will lose access to download this file.
        </p>

        {error && (
          <div
            style={{
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: '0.8rem',
              marginBottom: '1rem'
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            disabled={deleting}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: deleting ? 'not-allowed' : 'pointer'
            }}
          >
            {deleting ? (
              <>
                <RefreshCw size={14} className="spin" />
                Deleting...
              </>
            ) : (
              'Delete Asset'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
