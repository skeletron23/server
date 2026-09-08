const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET /users
router.get('/', (req, res) => {
  res.json(db.getCollection('users'));
});

// GET /users/:id
router.get('/:id', (req, res) => {
  const users = db.getCollection('users');
  const user = users.find((u) => u.id === parseInt(req.params.id, 10));

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

module.exports = router;