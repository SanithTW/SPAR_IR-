import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Building2,
  Layers,
  FileSpreadsheet,
  Users,
  Settings,
  PackageCheck,
  Store,
  Tag,
  X
} from 'lucide-react';

export default function Sidebar({ user, activeTab, setActiveTab, isOpen = false, onClose }) {
  const isAdmin = user?.role === 'admin';
  const isMarketingUser = user?.role === 'user';
  const isBranch = user?.role === 'branch';

  const navItems = [];

  if (isBranch) {
    navItems.push(
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'my-calendar', label: 'My Calendar', icon: Calendar },
      { id: 'my-items', label: 'My Items', icon: PackageCheck },
      { id: 'private-labels', label: 'Private Label', icon: Tag }
    );
  } else {
    // Admin or Marketing User
    navItems.push(
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'calendar', label: 'Calendar', icon: Calendar }
    );

    if (isAdmin) {
      navItems.push({ id: 'issue-item', label: 'Issue Items', icon: PlusCircle });
    }

    navItems.push({ id: 'branches', label: 'Branches', icon: Building2 });
    navItems.push({ id: 'private-labels', label: 'Private Label', icon: Tag });

    if (isAdmin) {
      navItems.push({ id: 'sizes-types', label: 'Sizes & Types', icon: Layers });
    }

    navItems.push({ id: 'reports', label: 'Reports', icon: FileSpreadsheet });

    if (isAdmin) {
      navItems.push(
        { id: 'users', label: 'Users', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings }
      );
    }
  }

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="mobile-only"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 90
          }}
        />
      )}

      <aside
        className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}
        style={{
          width: '240px',
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 64px)',
          padding: '1.25rem 0.75rem',
          flexShrink: 0
        }}
      >
        {/* Mobile Header with Close button */}
        <div
          className="mobile-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.25rem 0.5rem 1rem 0.5rem',
            marginBottom: '0.75rem',
            borderBottom: '1px solid #f1f5f9'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#d51e27', letterSpacing: '0.05em' }}>
              SPAR NAVIGATION
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              padding: '0.4rem',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>
      {/* Branch Badge indicator if logged in as branch */}
      {isBranch && (
        <div
          style={{
            margin: '0 0.5rem 1rem 0.5rem',
            padding: '0.75rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <Store size={18} color="#d51e27" />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Branch Account</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.branch_name || user?.name}
            </div>
            {user?.branch_town && (
              <div style={{ fontSize: '0.72rem', color: '#d51e27', fontWeight: 600 }}>
                {user.branch_town}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onClose) onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : '#475569',
                background: isActive ? '#d51e27' : 'transparent',
                textAlign: 'left',
                width: '100%',
                boxShadow: isActive ? '0 2px 5px rgba(213, 30, 39, 0.25)' : 'none',
                transition: 'background 0.15s, color 0.15s'
              }}
            >
              <Icon size={18} color={isActive ? '#ffffff' : '#64748b'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom helper card */}
      <div
        className="desktop-only"
        style={{
          marginTop: 'auto',
          padding: '0.85rem',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          margin: '1rem 0.5rem 0 0.5rem'
        }}
      >
        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
          Status Legend
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></span>
            <span style={{ color: '#475569' }}>Grey: Pending</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span>
            <span style={{ color: '#1d4ed8' }}>Blue: Issued</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></span>
            <span style={{ color: '#15803d' }}>Green: Received</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }}></span>
            <span style={{ color: '#b91c1c' }}>Red: Problem / Overdue</span>
          </div>
        </div>
      </div>
    </aside>
  </>
  );
}
