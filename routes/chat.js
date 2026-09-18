const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /messages/:otherUserId
router.get('/:otherUserId', verifyToken, (req, res) => {
  const { id: userId } = req.user;
  const { otherUserId } = req.params;

  if (otherUserId === '') {
    return res.status(400).json({ message: 'otherUserId is required' });
  }

  res.json(db.getMessagesBetweenUsers(userId, otherUserId));
});

// POST /messages
router.post('/', verifyToken, (req, res) => {
  try {
    const message = db.addMessage(req.user.id, req.body.recipientId, req.body.text);
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;