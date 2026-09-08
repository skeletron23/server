const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { applySort } = require('../utils/queryHelpers');

// GET /dashboard
router.get('/', (req, res) => {
  const projects = db.getCollection('projects');
  const tasks = db.getCollection('tasks');
  const today = new Date();

  const completedTasks = tasks.filter((t) => t.status === 'Done');
  const pendingTasks = tasks.filter((t) => t.status !== 'Done');
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'Done' && new Date(t.dueDate) < today
  );

  const recentProjects = applySort(projects, 'createdDate', 'desc').slice(0, 5);
  const recentTasks = applySort(tasks, 'dueDate', 'desc').slice(0, 5);

  const taskStatusSummary = ['Todo', 'In Progress', 'Review', 'Done'].map((status) => ({
    status,
    count: tasks.filter((t) => t.status === status).length,
  }));

  res.json({
    totalProjects: projects.length,
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    pendingTasks: pendingTasks.length,
    overdueTasks: overdueTasks.length,
    recentProjects,
    recentTasks,
    taskStatusSummary,
  });
});

module.exports = router;