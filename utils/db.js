const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db.json');

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Load once into memory when the server starts.
let db = readDb();

function migrateAuditFields() {
  let changed = false;

  ['projects', 'tasks'].forEach((collectionName) => {
    db[collectionName].forEach((record) => {
      if (!Object.prototype.hasOwnProperty.call(record, 'createdAt')) {
        record.createdAt = record.createdDate
          ? `${record.createdDate}T00:00:00.000Z`
          : null;
        changed = true;
      }
      if (!Object.prototype.hasOwnProperty.call(record, 'updatedAt')) {
        record.updatedAt = record.createdAt;
        changed = true;
      }
      if (!Object.prototype.hasOwnProperty.call(record, 'assignedAt')) {
        record.assignedAt = null;
        changed = true;
      }
    });
  });

  if (changed) writeDb(db);
}

migrateAuditFields();

function getCollection(name) {
  return db[name];
}

function setCollection(name, records) {
  db[name] = records;
  writeDb(db);
}

function getNextId(name) {
  const records = db[name];
  if (records.length === 0) return 1;
  return Math.max(...records.map((r) => r.id)) + 1;
}

function getConversations(userId) {
  return db.conversations.filter((conversation) =>
    conversation.participants.some(
      (participant) => String(participant) === String(userId)
    )
  );
}

function createConversation(participants) {
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error('participants must be a non-empty array');
  }

  const conversations = db.conversations;
  const conversation = {
    id: getNextId('conversations'),
    participants,
    createdAt: new Date().toISOString(),
  };

  conversations.push(conversation);
  setCollection('conversations', conversations);
  return conversation;
}

function getMessages(conversationId) {
  return db.messages.filter(
    (message) => String(message.conversationId) === String(conversationId)
  );
}

function addMessage(conversationId, senderId, text) {
  if (conversationId === undefined || conversationId === null) {
    throw new Error('conversationId is required');
  }
  if (senderId === undefined || senderId === null) {
    throw new Error('senderId is required');
  }
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error('text is required');
  }

  const messages = db.messages;
  const message = {
    id: getNextId('messages'),
    conversationId,
    senderId,
    text,
    createdAt: new Date().toISOString(),
  };

  messages.push(message);
  setCollection('messages', messages);
  return message;
}

module.exports = {
  getCollection,
  setCollection,
  getNextId,
  getConversations,
  createConversation,
  getMessages,
  addMessage,
};