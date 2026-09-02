const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const proofRoutes = require('./routes/proofRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/proofs', proofRoutes);

// Health Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: "ParcelProof API is healthy" });
});

// Global Error Handler — catches multer errors and other unhandled errors
app.use((err, req, res, next) => {
  // Multer: file too large
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB per image.' });
  }
  // Multer: wrong file type (from our fileFilter)
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ success: false, message: 'Only image files are allowed.' });
  }
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: 'An unexpected server error occurred' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
