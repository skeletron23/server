const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../utils/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// POST /auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are all required' });
  }

  const users = db.getCollection('users');
  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.status(409).json({ message: 'An account with that email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: db.getNextId('users'),
    name,
    email,
    password: hashedPassword,
  };

  users.push(newUser);
  db.setCollection('users', users);

  // Never send the password hash back to the client, even hashed
  const { password: _omit, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const users = db.getCollection('users');
  const user = users.find((u) => u.email === email);

  if (!user || !user.password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

module.exports = router;