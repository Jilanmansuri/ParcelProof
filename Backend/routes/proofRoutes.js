const express = require('express');
const router = express.Router();

const { createProof, getProofs, getProofById, updateProofStatus, editProof, deleteProof } = require('../controllers/proofController');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, upload.array('photos', 5), createProof);
router.get('/', protect, getProofs);
router.get('/:id', protect, getProofById);
router.patch('/:id/status', protect, updateProofStatus);
router.patch('/:id', protect, editProof);
router.delete('/:id', protect, deleteProof);

module.exports = router;