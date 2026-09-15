function now() {
  return new Date().toISOString();
}

function createAuditFields(isAssigned) {
  const timestamp = now();
  return {
    createdAt: timestamp,
    updatedAt: timestamp,
    assignedAt: isAssigned ? timestamp : null,
  };
}

function updateAuditFields(existing, changes, assignmentField) {
  const updated = {
    ...existing,
    ...changes,
    id: existing.id,
    createdAt: existing.createdAt || null,
    assignedAt: existing.assignedAt || null,
    updatedAt: now(),
  };

  if (
    Object.prototype.hasOwnProperty.call(changes, assignmentField) &&
    JSON.stringify(changes[assignmentField]) !== JSON.stringify(existing[assignmentField])
  ) {
    updated.assignedAt = now();
  }

  return updated;
}

module.exports = {
  createAuditFields,
  updateAuditFields,
};