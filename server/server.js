const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const seedInitialData = require('./config/seedData');

const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const locationRoutes = require('./routes/locationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const instituteRoutes = require('./routes/instituteRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'Smart Campus QuickFix API',
    event: 'BPUT Tech Carnival 2026',
    venue: 'GIFT Autonomous, Bhubaneswar',
    timestamp: new Date(),
    cloudinaryActive: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    mongoStatus: require('mongoose').connection.readyState === 1 ? 'connected' : 'connecting/fallback',
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚀 Smart Campus QuickFix Backend API is running',
    event: 'BPUT Tech Carnival 2026',
    documentation: '/api/health',
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const startServer = async () => {
  await connectDB();
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Smart Campus QuickFix Server live on port: ${PORT}`);
    console.log(`📍 Venue: GIFT Autonomous Campus, Bhubaneswar`);
    console.log(`🛡️ JWT Session Validity: 7 Days`);
    console.log(`📡 1-Sec Geolocation logging endpoint: /api/location/log`);
    console.log(`☁️ Cloudinary Media Integration Ready`);
    console.log(`====================================================`);
  });
};

startServer();

module.exports = app;
