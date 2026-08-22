const mongoose = require('mongoose');
const Proof = require('../models/Proof');
const { uploadImage } = require('../services/cloudinary');

exports.createProof = async (req, res) => {
  try {
    const { orderId, courier, condition, description, latitude, longitude, address } = req.body;
    let photoUrl = '';
    
    if (req.file) {
      photoUrl = await uploadImage(req.file.path);
    } else if (req.body.photo) {
      photoUrl = req.body.photo;
    }

    const reportId = `PP-${Date.now()}`;

    const newProof = new Proof({
      reportId, 
      user: req.user._id,
      orderId, 
      courier, 
      condition, 
      description, 
      photo: photoUrl, 
      latitude, 
      longitude, 
      address
    });

    const savedProof = await newProof.save();
    res.status(201).json({ success: true, data: savedProof });
  } catch (error) {
    console.error('Error creating proof:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getProofs = async (req, res) => {
  try {
    const proofs = await Proof.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: proofs });
  } catch (error) {
    console.error('Error fetching proofs:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getProofById = async (req, res) => {
  try {
    const proof = await Proof.findOne({ reportId: req.params.id });
    
    if (!proof) {
      return res.status(404).json({ success: false, message: 'Proof not found' });
    }
    
    if (proof.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this proof' });
    }

    res.status(200).json({ success: true, data: proof });
  } catch (error) {
    console.error('Error fetching proof details:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateProofStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Submitted', 'In Progress', 'Resolved', 'Closed'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const proof = await Proof.findOne({ reportId: req.params.id });
    if (!proof) {
      return res.status(404).json({ success: false, message: 'Proof not found' });
    }

    if (proof.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this proof' });
    }

    proof.status = status;
    const updatedProof = await proof.save();

    res.status(200).json({ success: true, data: updatedProof });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
