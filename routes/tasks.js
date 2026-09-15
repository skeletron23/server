const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { createAuditFields, updateAuditFields } = require('../utils/audit');
const {
  applyFilters,
  applyDateRange,
  applySort,
  applyPagination,
} = require('../utils/queryHelpers');

/**
 * Search across task title, project name (joined via projectId), and assignee.
 * Written separately from the generic applySearch helper because it needs
 * the project name, which lives on a different collection.
 */
function searchTasks(tasks, projects, searchTerm) {
  if (!searchTerm) return tasks;
  const term = searchTerm.toLowerCase();

  return tasks.filter((task) => {
    const project = projects.find((p) => p.id === task.projectId);
    const projectName = project ? project.projectName : '';

    return (
      task.taskTitle.toLowerCase().includes(term) ||
      projectName.toLowerCase().includes(term) ||
      task.assignee.toLowerCase().includes(term)
    );
  });
}

/**
 * GET /tasks
 * Query params supported:
 *   search      - matches taskTitle, project name, assignee
 *   status      - exact match (Todo | In Progress | Review | Done)
 *   priority    - exact match (Low | Medium | High)
 *   assignee    - exact match
 *   projectId   - exact match, useful for the project details page
 *   dueDateFrom, dueDateTo - date range filter
 *   sortBy, sortOrder - sorting
 *   page, limit - pagination
 *
 * All filters combine with AND logic, e.g.
 * /tasks?status=In Progress&priority=High&assignee=John Doe
 */
router.get('/', (req, res) => {
  const projects = db.getCollection('projects');
  let tasks = db.getCollection('tasks');

  tasks = searchTasks(tasks, projects, req.query.search);
  tasks = applyFilters(tasks, req.query, ['status', 'priority', 'assignee', 'projectId']);
  tasks = applyDateRange(tasks, req.query, 'dueDate');
  tasks = applySort(tasks, req.query.sortBy, req.query.sortOrder);

  const { data, pagination } = applyPagination(tasks, req.query.page, req.query.limit);

  res.json({ data, pagination });
});

// GET /tasks/:id
router.get('/:id', (req, res) => {
  const tasks = db.getCollection('tasks');
  const task = tasks.find((t) => t.id === parseInt(req.params.id, 10));

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  res.json(task);
});

// POST /tasks
router.post('/', (req, res) => {
  const tasks = db.getCollection('tasks');
  const newTask = {
    id: db.getNextId('tasks'),
    projectId: req.body.projectId,
    taskTitle: req.body.taskTitle,
    description: req.body.description || '',
    priority: req.body.priority || 'Medium',
    status: req.body.status || 'Todo',
    assignee: req.body.assignee || '',
    dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
    ...createAuditFields(Boolean(req.body.assignee)),
  };

  if (!newTask.taskTitle || !newTask.projectId) {
    return res.status(400).json({ message: 'taskTitle and projectId are required' });
  }

  tasks.push(newTask);
  db.setCollection('tasks', tasks);
  res.status(201).json(newTask);
});

// PUT /tasks/:id  (full update, also used for Kanban drag-and-drop status change)
router.put('/:id', (req, res) => {
  const tasks = db.getCollection('tasks');
  const index = tasks.findIndex((t) => t.id === parseInt(req.params.id, 10));

  if (index === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  tasks[index] = updateAuditFields(tasks[index], req.body, 'assignee');
  db.setCollection('tasks', tasks);
  res.json(tasks[index]);
});

// PATCH /tasks/:id  (partial update — handy for just changing status from the Kanban board)
router.patch('/:id', (req, res) => {
  const tasks = db.getCollection('tasks');
  const index = tasks.findIndex((t) => t.id === parseInt(req.params.id, 10));

  if (index === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  tasks[index] = updateAuditFields(tasks[index], req.body, 'assignee');
  db.setCollection('tasks', tasks);
  res.json(tasks[index]);
});

// DELETE /tasks/:id
router.delete('/:id', (req, res) => {
  const tasks = db.getCollection('tasks');
  const index = tasks.findIndex((t) => t.id === parseInt(req.params.id, 10));

  if (index === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const deleted = tasks.splice(index, 1);
  db.setCollection('tasks', tasks);
  res.json({ message: 'Task deleted', task: deleted[0] });
});

module.exports = router;