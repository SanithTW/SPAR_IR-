import React, { useState, useEffect } from 'react';
import { Users, Settings, PlusCircle, Check, X, Shield, Store, Save, Edit2, Trash2, Phone, MapPin, Mail, Search } from 'lucide-react';
import { usersApi, settingsApi, branchesApi } from '../services/api';

export default function UsersSettingsView({ user }) {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [settings, setSettings] = useState({ overdue_day_of_month: '2', company_name: 'SPAR SaveMor Sri Lanka' });
  const [loading, setLoading] = useState(true);

  const [userSearch, setUserSearch] = useState('');

  // Modals & Forms
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role: 'branch',
    branch_id: ''
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Edit & Delete State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role: 'branch',
    branch_id: '',
    active: 1
  });
  const [deletingUser, setDeletingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, settingsRes, branchesRes] = await Promise.all([
        usersApi.getAll(),
        settingsApi.get(),
        branchesApi.getAll()
      ]);
      setUsers(usersRes || []);
      setSettings(settingsRes || {});
      setBranches(branchesRes || []);

      if (branchesRes && branchesRes.length > 0) {
        setUserForm(prev => ({ ...prev, branch_id: branchesRes[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await usersApi.create(userForm);
      setShowAddUserModal(false);
      setUserForm({ name: '', username: '', email: '', phone: '', address: '', password: '', role: 'branch', branch_id: branches[0]?.id || '' });
      fetchData();
    } catch (err) {
      alert(err.message || 'Error creating user');
    }
  };

  const handleStartEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      name: u.name || '',
      username: u.username || '',
      email: u.email || '',
      phone: u.phone || '',
      address: u.address || '',
      password: '', // Blank preserves existing password
      role: u.role || 'branch',
      branch_id: u.branch_id || (branches[0]?.id || ''),
      active: u.active ?? 1
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setSubmitting(true);
      const payload = {
        name: editForm.name,
        username: editForm.username,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        role: editForm.role,
        branch_id: editForm.role === 'branch' ? editForm.branch_id : null,
        active: editForm.active
      };
      if (editForm.password && editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }
      await usersApi.update(editingUser.id, payload);
      setEditingUser(null);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Error updating user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      setSubmitting(true);
      await usersApi.delete(deletingUser.id);
      setDeletingUser(null);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Error deleting user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await settingsApi.save(settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      alert(err.message || 'Error saving settings');
    }
  };

  const isAdmin = user?.role === 'admin';

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.address && u.address.toLowerCase().includes(q)) ||
      (u.branch_name && u.branch_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
          Users & System Settings
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.15rem' }}>
          Manage user accounts, IR branch access control, and 2nd-of-month overdue business rules
        </p>
      </div>

      {/* Grid: Users Table & Settings Form (Matches Screen 9) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Users Table */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                System Users & Logins
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Admin, Marketing, and {users.filter(u => u.role === 'branch').length} IR SaveMor branch accounts ({filteredUsers.length} shown)
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search IR, contact, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{
                    paddingLeft: '30px',
                    height: '32px',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    width: '210px'
                  }}
                />
              </div>

              {isAdmin && (
                <button
                  onClick={() => setShowAddUserModal(true)}
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
                  <PlusCircle size={15} /> + Add User
                </button>
              )}
            </div>
          </div>

          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: '35px' }}>#</th>
                  <th>IR & Contact Person</th>
                  <th>Contact / Email</th>
                  <th>Address</th>
                  <th>Role & Branch</th>
                  <th>Status</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>@{u.username}</div>
                    </td>
                    <td>
                      {u.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                          <Phone size={12} color="#059669" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                      {u.email ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#0284c7', marginTop: '0.15rem' }}>
                          <Mail size={12} color="#0284c7" />
                          <span>{u.email}</span>
                        </div>
                      ) : (
                        !u.phone && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      {u.address ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem', fontSize: '0.74rem', color: '#475569', maxWidth: '200px', lineHeight: 1.3 }}>
                          <MapPin size={12} color="#d51e27" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{u.address}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      {u.role === 'branch' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#0f172a' }}>
                          <Store size={14} color="#d51e27" />
                          <span>{u.branch_name || 'Assigned Branch'}</span>
                        </div>
                      ) : (
                        <span className={`badge ${u.role === 'admin' ? 'badge-problem' : 'badge-issued'}`}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-active' : 'badge-inactive'}`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleStartEdit(u)}
                            title="Edit User"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.3rem 0.55rem',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#1e293b',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <Edit2 size={13} color="#2563eb" /> Edit
                          </button>

                          {u.id === user?.id ? (
                            <span
                              title="You cannot delete your own logged-in account"
                              style={{
                                fontSize: '0.72rem',
                                color: '#94a3b8',
                                padding: '0.3rem 0.4rem',
                                fontStyle: 'italic'
                              }}
                            >
                              (You)
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeletingUser(u)}
                              title="Delete User"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.3rem 0.55rem',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} color="#dc2626" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settings Panel (Matches Screen 9 Bottom-Right) */}
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
            <Settings size={18} color="#d51e27" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Company / App Settings
            </h2>
          </div>

          {settingsSaved && (
            <div style={{ padding: '0.65rem 0.85rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#047857', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={16} /> Settings saved successfully!
            </div>
          )}

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Company Name
              </label>
              <input
                type="text"
                value={settings.company_name || ''}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                style={{ width: '100%', height: '38px', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Overdue Cutoff Day (Next Month) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  min="1"
                  max="28"
                  required
                  value={settings.overdue_day_of_month || '2'}
                  onChange={(e) => setSettings({ ...settings, overdue_day_of_month: e.target.value })}
                  style={{ width: '90px', height: '38px', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center' }}
                />
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>nd of following month</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.4 }}>
                Default: <strong>2nd</strong>. An item issued on 27 Jun not confirmed by 2 Jul turns red as Overdue.
              </p>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '0.5rem',
                padding: '0.65rem 1rem',
                background: '#d51e27',
                color: '#ffffff',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 6px rgba(213, 30, 39, 0.3)'
              }}
            >
              <Save size={16} /> Save Settings
            </button>
          </form>

          {/* Architecture / Security Info */}
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.45 }}>
            <strong style={{ color: '#0f172a' }}>Branch Isolation Security:</strong>
            <p style={{ marginTop: '0.2rem' }}>
              Each branch login is cryptographically tied to its branch ID in the database and server session. Branches cannot access peer records even if changing parameters.
            </p>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create New User</h2>
              <button onClick={() => setShowAddUserModal(false)} style={{ background: '#f1f5f9', width: '30px', height: '30px', borderRadius: '50%' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Full Name (IR & Contact Person) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NIRMAL SUPER - MR. NRMAL"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. nirmalsuper"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. nirmalfamilysuper@gmail.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Contact Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 077 - 2445813"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Store Address</label>
                <input
                  type="text"
                  placeholder="e.g. NO. 3 A, MAIN STREET, PALLEWELA"
                  value={userForm.address}
                  onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="branch">Branch User (IR SaveMor)</option>
                  <option value="user">Marketing / Management User</option>
                  <option value="admin">Administrator (Marketing)</option>
                </select>
              </div>

              {userForm.role === 'branch' && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Branch Assignment *</label>
                  <select
                    value={userForm.branch_id}
                    onChange={(e) => setUserForm({ ...userForm, branch_id: e.target.value })}
                    style={{ width: '100%' }}
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.town})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ padding: '0.5rem 0.85rem', background: '#f1f5f9', borderRadius: '6px' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', background: '#d51e27', color: '#ffffff', borderRadius: '6px', fontWeight: 700 }}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Edit User</h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Update account details, contact number, address or reset password</p>
              </div>
              <button onClick={() => setEditingUser(null)} style={{ background: '#f1f5f9', width: '30px', height: '30px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Full Name (IR & Contact Person) *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Username *</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Password (Set / Change)</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.2rem' }}>Type here to change password</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. user@gmail.com"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Contact Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 077 - 2445813"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Store Address</label>
                <input
                  type="text"
                  placeholder="e.g. NO. 3 A, MAIN STREET, PALLEWELA"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Role *</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="branch">Branch User (IR SaveMor)</option>
                  <option value="user">Marketing / Management User</option>
                  <option value="admin">Administrator (Marketing)</option>
                </select>
              </div>

              {editForm.role === 'branch' && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Branch Assignment *</label>
                  <select
                    value={editForm.branch_id}
                    onChange={(e) => setEditForm({ ...editForm, branch_id: e.target.value })}
                    style={{ width: '100%' }}
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.town})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginTop: '0.2rem' }}>
                  <input
                    type="checkbox"
                    checked={editForm.active === 1 || editForm.active === true}
                    onChange={(e) => setEditForm({ ...editForm, active: e.target.checked ? 1 : 0 })}
                  />
                  <span>User Account Active (Permit Login)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={submitting}
                  style={{ padding: '0.5rem 0.95rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.5rem 1.35rem',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={22} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Delete User</h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>This action cannot be undone.</p>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              Are you sure you want to permanently delete user <strong>{deletingUser.name}</strong> (<code>@{deletingUser.username}</code>, role: <em>{deletingUser.role}</em>)?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={submitting}
                style={{ padding: '0.5rem 0.95rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={submitting}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
