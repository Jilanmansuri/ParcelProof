const mongoose = require('mongoose');

const proofSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  courier: {
    type: String,
  },
  condition: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  photo: {
    type: String,
  },
  photos: {
    type: [String],
    default: [],
  },
  latitude: {
    type: String,
  },
  longitude: {
    type: String,
  },
  address: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Submitted', 'In Progress', 'Resolved', 'Closed'],
    default: 'Submitted',
  },
  capturedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Proof', proofSchema);