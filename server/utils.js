const db = require('./db');

function getOverdueDayOfMonth() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'overdue_day_of_month'").get();
  return row ? parseInt(row.value, 10) : 2;
}

/**
 * Checks if an item is overdue based on issue date and current status.
 * Rule: Not confirmed by the N-th (default 2nd) day of the following month.
 * e.g., Issued 27 Jun -> overdue from 2 Jul.
 */
function isItemOverdue(issueDateStr, status) {
  if (status !== 'Issued' && status !== 'Pending') {
    return false;
  }
  if (!issueDateStr) return false;

  const issueDate = new Date(issueDateStr);
  if (isNaN(issueDate.getTime())) return false;

  const overdueDay = getOverdueDayOfMonth();

  // Following month cutoff date:
  // Month is 0-indexed in JS. Month M + 1, Day = overdueDay
  const cutoffYear = issueDate.getFullYear();
  const cutoffMonth = issueDate.getMonth() + 1; // 0-11 -> next month
  const cutoffDate = new Date(cutoffYear, cutoffMonth, overdueDay, 0, 0, 0, 0);

  const now = new Date();
  return now >= cutoffDate;
}

function computeIssueDisplay(issue) {
  const overdue = isItemOverdue(issue.issue_date, issue.status);
  let displayStatus = issue.status;
  let statusColor = 'grey'; // Pending

  if (issue.status === 'Pending') {
    displayStatus = 'Pending';
    statusColor = 'grey';
  } else if (issue.status === 'Received') {
    displayStatus = 'Received';
    statusColor = 'green';
  } else if (issue.status === 'Problem') {
    displayStatus = 'Problem';
    statusColor = 'red';
  } else if (issue.status === 'Cancelled') {
    displayStatus = 'Cancelled';
    statusColor = 'grey';
  } else if (issue.status === 'Issued') {
    if (overdue) {
      displayStatus = 'Overdue';
      statusColor = 'red';
    } else {
      displayStatus = 'Issued';
      statusColor = 'blue';
    }
  }

  // Days elapsed
  const issueDate = new Date(issue.issue_date);
  const now = new Date();
  const diffTime = Math.max(0, now - issueDate);
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return {
    ...issue,
    is_overdue: overdue ? 1 : 0,
    display_status: displayStatus,
    status_color: statusColor,
    days_elapsed: daysElapsed
  };
}

module.exports = {
  getOverdueDayOfMonth,
  isItemOverdue,
  computeIssueDisplay
};
