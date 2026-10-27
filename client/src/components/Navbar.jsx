import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, PlusCircle, LogOut, CheckCheck } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { notificationsApi } from '../services/api';

export default function Navbar({ user, onLogout, onOpenIssueModal, searchQuery, setSearchQuery }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifs = async () => {
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000); // refresh notifs every 15s
    return () => clearInterval(interval);
  }, [user]);

  // Close notifications dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Admin (Marketing)';
    if (role === 'user') return 'Marketing / Mgmt';
    return 'IR Branch User';
  };

  return (
    <header
      style={{
        background: '#d51e27',
        color: '#ffffff',
        height: '64px',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    >
      {/* Left: Brand Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BrandLogo size="normal" inverted={true} />
          <div
            style={{
              height: '24px',
              width: '1px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              margin: '0 0.25rem'
            }}
          />
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#ffffff',
              opacity: 0.95
            }}
          >
            POSM Tracker
          </span>
        </div>

        {/* Global Search */}
        <div
          style={{
            position: 'relative',
            marginLeft: '1rem',
            width: '280px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              color: 'rgba(255,255,255,0.7)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Search branches, campaigns, items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.85rem 0.45rem 2.2rem',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile & Quick Switch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Admin Issue Item CTA */}
        {user?.role === 'admin' && (
          <button
            onClick={onOpenIssueModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#ffffff',
              color: '#d51e27',
              padding: '0.45rem 0.95rem',
              borderRadius: '20px',
              fontWeight: 700,
              fontSize: '0.825rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            <PlusCircle size={16} />
            + Issue Item
          </button>
        )}

        {/* In-App Notifications Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label="Notifications"
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#ffffff',
                  color: '#d51e27',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifs && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '340px',
                background: '#ffffff',
                color: '#0f172a',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                zIndex: 100
              }}
            >
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={16} color="#d51e27" />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge badge-problem" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'transparent',
                      color: '#d51e27',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No notifications right now
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #f8fafc',
                        background: n.is_read ? '#ffffff' : '#fef2f2',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#1e293b' }}>{n.title}</span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {n.created_at ? n.created_at.slice(5, 16) : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.775rem', color: '#475569', lineHeight: 1.35 }}>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(0,0,0,0.15)',
            padding: '0.35rem 0.85rem',
            borderRadius: '24px'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#ffffff',
              color: '#d51e27',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.8rem'
            }}
          >
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, lineHeight: 1.2 }}>
              {user?.name || 'User'}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>
              {getRoleLabel(user?.role)}
            </span>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={onLogout}
          aria-label="Sign out"
          title="Sign Out"
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#ffffff',
            padding: '0.45rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
