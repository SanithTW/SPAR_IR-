const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const branchRoutes = require('./routes/branches');
const issueRoutes = require('./routes/issues');
const typesAndSizesRoutes = require('./routes/typesAndSizes');
const reportsRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const uploadRoutes = require('./routes/upload');
const { createLibraryRouter } = require('./routes/library');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api', typesAndSizesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/private-labels', createLibraryRouter('private_labels', 'Private label'));
app.use('/api/leaflets', createLibraryRouter('leaflets', 'Leaflet'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SPAR POSM Tracker API',
    timestamp: new Date().toISOString()
  });
});

// Unhandled errors (including rejected async handlers) -> JSON 500
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`SPAR POSM Tracker Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

