import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardBranch from './components/DashboardBranch';
import CalendarView from './components/CalendarView';
import BranchesManagement from './components/BranchesManagement';
import SizesTypesManagement from './components/SizesTypesManagement';
import ReportsView from './components/ReportsView';
import UsersSettingsView from './components/UsersSettingsView';
import IssueItemModal from './components/IssueItemModal';
import ItemDetailModal from './components/ItemDetailModal';

import {
  getToken,
  setToken,
  getStoredUser,
  setStoredUser,
  authApi
} from './services/api';

export default function App() {
  const [token, setSessionToken] = useState(getToken());
  const [user, setUser] = useState(getStoredUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (token && !user) {
      authApi.getMe().then(res => {
        setUser(res.user);
        setStoredUser(res.user);
      }).catch(() => {
        handleLogout();
      });
    }
  }, [token]);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setStoredUser(newUser);
    setSessionToken(newToken);
    setUser(newUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setStoredUser(null);
    setSessionToken(null);
    setUser(null);
    setActiveTab('dashboard');
  };

  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isBranch = user.role === 'branch';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Top Brand Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenIssueModal={() => setShowIssueModal(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* App Body: Sidebar + Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'issue-item') {
              setShowIssueModal(true);
            } else {
              setActiveTab(tab);
            }
          }}
        />

        <main style={{ flex: 1, padding: '1.75rem', overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
          {/* Main views rendering */}
          {activeTab === 'dashboard' && (
            isBranch ? (
              <DashboardBranch
                key={`branch-${user.id}-${refreshTrigger}`}
                user={user}
                searchQuery={searchQuery}
                onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
              />
            ) : (
              <DashboardAdmin
                key={`admin-${user.id}-${refreshTrigger}`}
                searchQuery={searchQuery}
                onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
                onOpenIssueModal={() => setShowIssueModal(true)}
              />
            )
          )}

          {(activeTab === 'calendar' || activeTab === 'my-calendar') && (
            <CalendarView
              key={`cal-${user.id}-${refreshTrigger}`}
              user={user}
              searchQuery={searchQuery}
              onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
              onOpenIssueModal={() => setShowIssueModal(true)}
            />
          )}

          {activeTab === 'my-items' && isBranch && (
            <DashboardBranch
              key={`myitems-${user.id}-${refreshTrigger}`}
              user={user}
              searchQuery={searchQuery}
              onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
            />
          )}

          {activeTab === 'branches' && (
            <BranchesManagement
              key={`branches-${refreshTrigger}`}
              user={user}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'sizes-types' && (
            <SizesTypesManagement
              key={`sizes-${refreshTrigger}`}
              user={user}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              key={`reports-${refreshTrigger}`}
              user={user}
              onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
            />
          )}

          {(activeTab === 'users' || activeTab === 'settings') && (
            <UsersSettingsView
              key={`settings-${refreshTrigger}`}
              user={user}
            />
          )}
        </main>
      </div>

      {/* Issue Item Modal (Admin) */}
      {showIssueModal && (
        <IssueItemModal
          onClose={() => setShowIssueModal(false)}
          onSuccess={() => {
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {/* Item Detail & Confirm/Problem Modal */}
      {selectedIssueId && (
        <ItemDetailModal
          issueId={selectedIssueId}
          user={user}
          onClose={() => setSelectedIssueId(null)}
          onRefresh={() => {
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
