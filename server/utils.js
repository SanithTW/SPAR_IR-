const { supabase, run } = require('./db');

async function getOverdueDayOfMonth() {
  const row = await run(
    supabase.from('settings').select('value').eq('key', 'overdue_day_of_month').maybeSingle()
  );
  const day = row ? parseInt(row.value, 10) : NaN;
  return isNaN(day) ? 2 : day;
}

/**
 * Checks if an item is overdue based on issue date and current status.
 * Rule: Not confirmed by the N-th (default 2nd) day of the following month.
 * e.g., Issued 27 Jun -> overdue from 2 Jul.
 */
function isItemOverdue(issueDateStr, status, overdueDay = 2) {
  if (status !== 'Issued' && status !== 'Pending') {
    return false;
  }
  if (!issueDateStr) return false;

  const issueDate = new Date(issueDateStr);
  if (isNaN(issueDate.getTime())) return false;

  // Following month cutoff date (month is 0-indexed, so +1 is next month)
  const cutoffDate = new Date(issueDate.getFullYear(), issueDate.getMonth() + 1, overdueDay, 0, 0, 0, 0);

  return new Date() >= cutoffDate;
}

function computeIssueDisplay(issue, overdueDay = 2) {
  const overdue = isItemOverdue(issue.issue_date, issue.status, overdueDay);
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
  const diffTime = Math.max(0, new Date() - issueDate);
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return {
    ...issue,
    is_overdue: overdue ? 1 : 0,
    display_status: displayStatus,
    status_color: statusColor,
    days_elapsed: daysElapsed
  };
}

// Compute display fields for a list of issues using the current overdue setting.
async function computeIssuesDisplay(issues) {
  const overdueDay = await getOverdueDayOfMonth();
  return issues.map((i) => computeIssueDisplay(i, overdueDay));
}

module.exports = {
  getOverdueDayOfMonth,
  isItemOverdue,
  computeIssueDisplay,
  computeIssuesDisplay
};
