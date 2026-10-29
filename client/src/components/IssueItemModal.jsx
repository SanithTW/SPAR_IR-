import React, { useState, useEffect, useRef } from 'react';
import { X, PlusCircle, Paperclip, Check, Store, FileText, Image as ImageIcon, UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { issuesApi, branchesApi, typesAndSizesApi, uploadApi } from '../services/api';

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

  // Attachment State (JPG, PNG, PDF)
  const fileInputRef = useRef(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
      setSelectedBranchIds(selectedBranchIds.filter((bId) => bId !== id));
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

  const processFile = async (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) || file.type.startsWith('image/');
    const isPdf = ext === 'pdf' || file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      setError('Please attach a JPG, PNG, or PDF file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File size must be less than 15MB.');
      return;
    }

    setError('');
    setAttachmentFile(file);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachmentPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }

    try {
      setUploadingFile(true);
      const res = await uploadApi.uploadFile(file);
      setAttachmentUrl(res.url);
    } catch (err) {
      console.error(err);
      setError('Failed to upload file: ' + (err.message || 'Upload error'));
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    await processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    await processFile(file);
  };

  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setAttachmentUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    if (uploadingFile) {
      setError('Please wait for the attachment to finish uploading.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        item_type_id: parseInt(itemTypeId, 10),
        slot_id: isHoarding && hoardingSizeId ? parseInt(hoardingSizeId, 10) : undefined,
        campaign: campaign.trim(),
        qty: parseInt(qty, 10) || 1,
        issue_date: issueDate,
        note: note.trim(),
        attachment_url: attachmentUrl || undefined,
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

          {/* Attachment Upload (JPG, PNG, PDF) */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Paperclip size={15} color="#d51e27" />
                Artwork / Document Attachment (JPG, PNG, PDF)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                Supports JPG, PNG, PDF (up to 15MB)
              </span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,.pdf,application/pdf,image/jpeg,image/png"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {!attachmentFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: isDragging ? '2px dashed #d51e27' : '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  background: isDragging ? '#fff1f2' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease-in-out',
                  transform: isDragging ? 'scale(1.01)' : 'scale(1)',
                  boxShadow: isDragging ? '0 0 0 4px rgba(213, 30, 39, 0.12)' : 'none'
                }}
                onMouseOver={(e) => { if (!isDragging) e.currentTarget.style.borderColor = '#d51e27'; }}
                onMouseOut={(e) => { if (!isDragging) e.currentTarget.style.borderColor = '#cbd5e1'; }}
              >
                <div style={{ background: isDragging ? '#fed7aa' : '#fee2e2', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={19} color="#d51e27" />
                </div>
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: isDragging ? '#d51e27' : '#0f172a' }}>
                  {isDragging ? 'Drop your file here!' : 'Drag and drop file here, or click to attach'}
                </div>
                <div style={{ fontSize: '0.72rem', color: isDragging ? '#b91c1c' : '#64748b' }}>
                  {isDragging ? 'Release to upload JPG, PNG, or PDF' : 'Attach artwork design (JPG, PNG) or dispatch/spec note (PDF)'}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {attachmentPreview ? (
                    <img
                      src={attachmentPreview}
                      alt="Preview"
                      style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                  ) : (
                    <div style={{ width: '46px', height: '46px', borderRadius: '6px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={22} color="#dc2626" />
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {attachmentFile.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                      <span>{(attachmentFile.size / 1024).toFixed(1)} KB</span>
                      {uploadingFile ? (
                        <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Loader2 size={12} className="spin" /> Uploading...
                        </span>
                      ) : attachmentUrl ? (
                        <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                          <Check size={12} /> Ready to send
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  title="Remove attachment"
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <Trash2 size={13} /> Remove
                </button>
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
