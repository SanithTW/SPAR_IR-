import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarMonth({
  currentDate,
  onDateChange,
  issues = [],
  onSelectIssue,
  showBranchName = true,
  isMini = false
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days in month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    onDateChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onDateChange(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Map issues by day string "YYYY-MM-DD"
  const issuesByDate = {};
  issues.forEach((iss) => {
    const dStr = iss.issue_date ? iss.issue_date.slice(0, 10) : '';
    if (!issuesByDate[dStr]) issuesByDate[dStr] = [];
    issuesByDate[dStr].push(iss);
  });

  // Build grid calendar cells (42 cells: 6 rows of 7)
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({
      dayNum,
      dateStr,
      isCurrentMonth: false,
      items: issuesByDate[dateStr] || []
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({
      dayNum: i,
      dateStr,
      isCurrentMonth: true,
      items: issuesByDate[dateStr] || []
    });
  }

  // Next month leading days to complete grid
  const remaining = 42 - calendarCells.length;
  for (let i = 1; i <= remaining; i++) {
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({
      dayNum: i,
      dateStr,
      isCurrentMonth: false,
      items: issuesByDate[dateStr] || []
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}
    >
      {/* Calendar Header with Navigation */}
      <div
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
          background: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CalendarIcon size={20} color="#d51e27" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            {monthNames[month]} {year}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={handleToday}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextMonth}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          textAlign: 'center'
        }}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            style={{
              padding: '0.6rem 0.25rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          background: '#e2e8f0',
          gap: '1px'
        }}
      >
        {calendarCells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          return (
            <div
              key={idx}
              style={{
                background: cell.isCurrentMonth ? '#ffffff' : '#f8fafc',
                minHeight: isMini ? '80px' : '105px',
                padding: '0.45rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                opacity: cell.isCurrentMonth ? 1 : 0.45
              }}
            >
              {/* Day Number */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: isToday ? 800 : 600,
                    color: isToday ? '#ffffff' : cell.isCurrentMonth ? '#1e293b' : '#94a3b8',
                    background: isToday ? '#d51e27' : 'transparent',
                    width: isToday ? '22px' : 'auto',
                    height: isToday ? '22px' : 'auto',
                    borderRadius: isToday ? '50%' : '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {cell.dayNum}
                </span>

                {cell.items.length > 0 && (
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                    {cell.items.length} {cell.items.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              {/* Items chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', maxHeight: isMini ? '65px' : '85px' }}>
                {cell.items.map((item) => {
                  const chipClass =
                    item.status === 'Received'
                      ? 'chip-received'
                      : item.status === 'Problem' || item.is_overdue
                      ? 'chip-problem'
                      : item.status === 'Issued'
                      ? 'chip-issued'
                      : 'chip-pending';

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectIssue && onSelectIssue(item)}
                      className={`cal-chip ${chipClass}`}
                      title={`${item.campaign} - ${item.branch_name} (${item.display_status})`}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.item_type_name || 'POSM'}
                        {showBranchName && item.branch_name && ` · ${item.branch_name}`}
                      </span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.85, flexShrink: 0 }}>
                        {item.qty ? `${item.qty} pcs` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          background: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          fontSize: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#16a34a' }}></span>
          <span style={{ color: '#166534', fontWeight: 600 }}>Received (Branch Confirmed)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#2563eb' }}></span>
          <span style={{ color: '#1e40af', fontWeight: 600 }}>Issued (Waiting for Branch)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#94a3b8' }}></span>
          <span style={{ color: '#475569', fontWeight: 600 }}>Pending (Planned)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#dc2626' }}></span>
          <span style={{ color: '#991b1b', fontWeight: 600 }}>Problem / Overdue (Post-2nd)</span>
        </div>
      </div>
    </div>
  );
}
