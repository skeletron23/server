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

module.exports = {
  getCollection,
  setCollection,
  getNextId,
};