import React, { useState, useEffect } from 'react';
import { Users, Settings, PlusCircle, Check, X, Shield, Store, Save } from 'lucide-react';
import { usersApi, settingsApi, branchesApi } from '../services/api';

export default function UsersSettingsView({ user }) {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [settings, setSettings] = useState({ overdue_day_of_month: '2', company_name: 'SPAR SaveMor Sri Lanka' });
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'branch',
    branch_id: ''
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

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
      setUserForm({ name: '', username: '', email: '', password: '', role: 'branch', branch_id: branches[0]?.id || '' });
      fetchData();
    } catch (err) {
      alert(err.message || 'Error creating user');
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                System Users & Logins
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Admin, Marketing, and 22 isolated branch login accounts
              </p>
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

          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Branch Assignment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>@{u.username}</div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-problem' : u.role === 'user' ? 'badge-issued' : 'badge-received'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.role === 'branch' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#0f172a' }}>
                          <Store size={14} color="#d51e27" />
                          <span>{u.branch_name || 'Assigned Branch'}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>All Branches (Global)</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-active">Active</span>
                    </td>
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
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Fernando"
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
                    placeholder="e.g. kasunf"
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
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
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
    </div>
  );
}
