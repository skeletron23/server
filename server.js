const express = require('express');
const cors = require('cors');

const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/users');
const dashboardRouter = require('./routes/dashboard');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Simple request logger — handy while developing
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use('/projects', projectsRouter);
app.use('/tasks', tasksRouter);
app.use('/users', usersRouter);
app.use('/dashboard', dashboardRouter);
app.use('/auth', authRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Project Management Dashboard API is running' });
});

// Basic 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});