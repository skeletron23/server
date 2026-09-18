const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET /conversations?userId=1
router.get('/', (req, res) => {
  const { userId } = req.query;

  if (userId === undefined || userId === '') {
    return res.status(400).json({ message: 'userId is required' });
  }

  res.json(db.getConversations(userId));
});

// GET /conversations/:id/messages
router.get('/:id/messages', (req, res) => {
  res.json(db.getMessages(req.params.id));
});

// POST /conversations
router.post('/', (req, res) => {
  try {
    const conversation = db.createConversation(req.body.participants);
    res.status(201).json(conversation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;