const express = require('express');
const router = express.Router();
const db = require('../utils/db');

function addTasksToUser(user) {
  const tasks = db.getCollection('tasks');
  return {
    ...user,
    tasks: tasks.filter((task) => task.assignee === user.name),
  };
}

// GET /users
router.get('/', (req, res) => {
  res.json(db.getCollection('users').map(addTasksToUser));
});

// GET /users/:id
router.get('/:id', (req, res) => {
  const users = db.getCollection('users');
  const user = users.find((u) => u.id === parseInt(req.params.id, 10));

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(addTasksToUser(user));
});

module.exports = router;