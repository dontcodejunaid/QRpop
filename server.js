const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'qrpop_jwt_secret_dev';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected successfully to MongoDB Atlas!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ==================== SCHEMAS & MODELS ====================

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// History Record Schema
const HistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['generated', 'scanned'], required: true },
  category: { type: String, default: 'Text' },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const History = mongoose.model('History', HistorySchema);

// ==================== AUTH MIDDLEWARE ====================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ==================== AUTH API ROUTES ====================

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    let { name, email, password } = req.body;
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Sign up error:', err);
    res.status(500).json({ success: false, message: 'Server error during sign up.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    email = (email || '').trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Verify Current Token Session
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== HISTORY API ROUTES ====================

// Get User History
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const records = await History.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(50);

    const formatted = records.map(r => ({
      id: r._id.toString(),
      userId: r.userId.toString(),
      type: r.type,
      category: r.category,
      content: r.content,
      timestamp: r.timestamp.toISOString()
    }));

    res.json({ success: true, records: formatted });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve history.' });
  }
});

// Add History Record
app.post('/api/history', authenticateToken, async (req, res) => {
  try {
    const { type, category, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required.' });
    }

    // Check duplicate recent record
    const latest = await History.findOne({ userId: req.user.id }).sort({ timestamp: -1 });
    if (latest && latest.content === content && latest.type === type) {
      return res.json({ success: true, record: latest });
    }

    const record = new History({
      userId: req.user.id,
      type: type || 'generated',
      category: category || 'Text',
      content: content.trim()
    });

    await record.save();

    res.status(201).json({
      success: true,
      record: {
        id: record._id.toString(),
        userId: record.userId.toString(),
        type: record.type,
        category: record.category,
        content: record.content,
        timestamp: record.timestamp.toISOString()
      }
    });
  } catch (err) {
    console.error('Add history error:', err);
    res.status(500).json({ success: false, message: 'Failed to save history record.' });
  }
});

// Delete Single Record
app.delete('/api/history/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await History.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) {
    console.error('Delete history error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete record.' });
  }
});

// Clear All User History
app.delete('/api/history', authenticateToken, async (req, res) => {
  try {
    await History.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: 'History cleared.' });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ success: false, message: 'Failed to clear history.' });
  }
});

// Fallback to index.html for static SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`QRpop server running at http://localhost:${PORT}`);
});
