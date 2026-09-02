const fs = require('fs');
const Proof = require('../models/Proof');
const { uploadImage, deleteImage } = require('../services/cloudinary');

exports.createProof = async (req, res) => {
  try {
    const { orderId, courier, condition, description, latitude, longitude, address } = req.body;
    const uploadedPhotos = [];

    if (req.files?.length) {
      for (const file of req.files) {
        const url = await uploadImage(file.path);
        uploadedPhotos.push(url);

        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      }
    } else if (req.file) {
      const url = await uploadImage(req.file.path);
      uploadedPhotos.push(url);

      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    } else if (req.body.photo) {
      uploadedPhotos.push(req.body.photo);
    }

    const reportId = `PP-${Date.now()}`;
    const newProof = new Proof({
      reportId,
      user: req.user._id,
      orderId,
      courier,
      condition,
      description,
      photo: uploadedPhotos[0] || '',
      photos: uploadedPhotos,
      latitude,
      longitude,
      address,
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
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const proof = await Proof.findOne({ reportId: req.params.id });

    if (!proof) {
      return res.status(404).json({ success: false, message: 'Proof not found' });
    }

    if (proof.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this proof' });
    }

    const validTransitions = {
      Submitted: ['In Progress'],
      'In Progress': ['Resolved'],
      Resolved: ['Closed'],
      Closed: [],
    };

    const allowed = validTransitions[proof.status] || [];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${proof.status}" to "${status}". Valid next status: ${allowed.length ? allowed.join(', ') : 'none (this proof is closed)'}`,
      });
    }

    proof.status = status;
    const updatedProof = await proof.save();

    res.status(200).json({ success: true, data: updatedProof });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.editProof = async (req, res) => {
  try {
    const { description, courier } = req.body;
    const proof = await Proof.findOne({ reportId: req.params.id });

    if (!proof) {
      return res.status(404).json({ success: false, message: 'Proof not found' });
    }

    if (proof.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this proof' });
    }

    if (description !== undefined) proof.description = description;
    if (courier !== undefined) proof.courier = courier;

    const updatedProof = await proof.save();
    res.status(200).json({ success: true, data: updatedProof });
  } catch (error) {
    console.error('Error editing proof:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteProof = async (req, res) => {
  try {
    const proof = await Proof.findOne({ reportId: req.params.id });

    if (!proof) {
      return res.status(404).json({ success: false, message: 'Proof not found' });
    }

    if (proof.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this proof' });
    }

    const allPhotos = proof.photos?.length
      ? proof.photos
      : proof.photo
        ? [proof.photo]
        : [];

    for (const photoUrl of allPhotos) {
      if (photoUrl) await deleteImage(photoUrl);
    }

    await Proof.deleteOne({ reportId: req.params.id });
    res.status(200).json({ success: true, message: 'Proof deleted successfully' });
  } catch (error) {
    console.error('Error deleting proof:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};