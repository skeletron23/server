const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./utils/db');

const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/users');
const dashboardRouter = require('./routes/dashboard');
const authRouter = require('./routes/auth');
const chatRouter = require('./routes/chat');

const app = express();
const corsOptions = { origin: '*' };
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: corsOptions });
const PORT = process.env.PORT || 3001;

io.on('connection', (socket) => {
  const { userId, username } = socket.handshake.auth || {};
  socket.userId = userId;
  socket.username = username;

  if (userId !== undefined && userId !== null) {
    socket.join(String(userId));
  }

  socket.on('sendMessage', ({ recipientId, text } = {}) => {
    if (socket.userId === undefined || socket.userId === null) {
      return socket.emit('messageError', { message: 'userId is required' });
    }

    try {
      const message = db.addMessage(socket.userId, recipientId, text);

      io.to(String(recipientId)).emit('newMessage', message);
      io.to(String(socket.userId)).emit('newMessage', message);
    } catch (error) {
      socket.emit('messageError', { message: error.message });
    }
  });

  console.log(
    `Socket connected: ${socket.id} (userId: ${userId ?? 'unknown'}, username: ${username ?? 'unknown'})`
  );
});

app.use(cors(corsOptions));
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
app.use('/messages', chatRouter);

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

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});