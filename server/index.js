const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const authRoutes = require('./routes/auth');
const branchRoutes = require('./routes/branches');
const issueRoutes = require('./routes/issues');
const typesAndSizesRoutes = require('./routes/typesAndSizes');
const reportsRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const uploadRoutes = require('./routes/upload');
const privateLabelRoutes = require('./routes/privateLabels');

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
app.use('/api/private-labels', privateLabelRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SPAR POSM Tracker API',
    timestamp: new Date().toISOString()
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`SPAR POSM Tracker Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

