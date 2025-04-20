const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoute = require('./firebase/authRoutes');
const userRoutes = require('./firebase/userRoutes');
const progressRoutes = require('./firebase/progressRoutes');
const leaderboardRoutes = require('./firebase/leaderboardRoutes');
const notificationRoutes = require('./firebase/notificationRoute');
const contentRoutes = require('./firebase/contentRoutes');
const googleRoutes = require('./firebaseModel/googleRoutes');
const openaiRouter = require('./utils/openaiWorkflow');
const { authenticate } = require('./firebase/firebaseMiddleware');
const app = express();

// Initialize Firebase connection before starting the server
const initializeFirebase = async () => {
  try {
    console.log('Firebase connected successfully');
  } catch (error) {
    console.error('Error connecting to Firebase:', error);
    process.exit(1);
  }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define CORS options
const corsOptions = {
  origin: 'exp://172.20.10.3:8081',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

// Error handling for malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next();
});

// Static file directory for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the Learning Platform API!');
});

// Mount routes
app.use('/api/auth', authRoute);
app.use('/api/user', userRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/content', contentRoutes);
app.use('/api', googleRoutes);
app.use('/api/open', authenticate, openaiRouter);

// Views setup for password reset and verification
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Debug logging middleware
app.use((req, res, next) => {
  console.log('Request Body:', req.body);
  next();
});

// Initialize Firebase first, then start the server
initializeFirebase().then(() => {
  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
  });
});