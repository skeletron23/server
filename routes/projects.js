const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const {
  applySearch,
  applyFilters,
  applySort,
  applyPagination,
} = require('../utils/queryHelpers');

/**
 * GET /projects
 * Query params supported:
 *   search    - matches against projectName, description
 *   status    - exact match filter
 *   sortBy    - field to sort by (e.g. createdDate, projectName)
 *   sortOrder - asc | desc
 *   page, limit - pagination
 */
router.get('/', (req, res) => {
  let projects = db.getCollection('projects');

  projects = applySearch(projects, req.query.search, ['projectName', 'assignedUsers']);
  projects = applyFilters(projects, req.query, ['status']);
  projects = applySort(projects, req.query.sortBy, req.query.sortOrder);

  const { data, pagination } = applyPagination(projects, req.query.page, req.query.limit);

  res.json({ data, pagination });
});

// GET /projects/:id
router.get('/:id', (req, res) => {
  const projects = db.getCollection('projects');
  const project = projects.find((p) => p.id === parseInt(req.params.id, 10));

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  res.json(project);
});

// GET /projects/:id/tasks  (all tasks belonging to a project)
router.get('/:id/tasks', (req, res) => {
  const tasks = db.getCollection('tasks');
  const projectTasks = tasks.filter((t) => t.projectId === parseInt(req.params.id, 10));
  res.json(projectTasks);
});

// POST /projects
router.post('/', (req, res) => {
  const projects = db.getCollection('projects');
  const newProject = {
    id: db.getNextId('projects'),
    projectName: req.body.projectName,
    description: req.body.description || '',
    status: req.body.status || 'Active',
    createdDate: req.body.createdDate || new Date().toISOString().split('T')[0],
    assignedUsers: req.body.assignedUsers || [],
  };

  if (!newProject.projectName) {
    return res.status(400).json({ message: 'projectName is required' });
  }

  projects.push(newProject);
  db.setCollection('projects', projects);
  res.status(201).json(newProject);
});

// PUT /projects/:id
router.put('/:id', (req, res) => {
  const projects = db.getCollection('projects');
  const index = projects.findIndex((p) => p.id === parseInt(req.params.id, 10));

  if (index === -1) {
    return res.status(404).json({ message: 'Project not found' });
  }

  projects[index] = { ...projects[index], ...req.body, id: projects[index].id };
  db.setCollection('projects', projects);
  res.json(projects[index]);
});

// DELETE /projects/:id
router.delete('/:id', (req, res) => {
  const projects = db.getCollection('projects');
  const index = projects.findIndex((p) => p.id === parseInt(req.params.id, 10));

  if (index === -1) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const deleted = projects.splice(index, 1);
  db.setCollection('projects', projects);
  res.json({ message: 'Project deleted', project: deleted[0] });
});

module.exports = router;