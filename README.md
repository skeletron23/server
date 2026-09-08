# Project Management Dashboard — Local API Server

A real Express server (no mock service) providing full CRUD, server-side
search, filtering, sorting, and pagination for the Project Management
Dashboard task.

## Setup

```bash
npm install
npm start
```

Server runs at `http://localhost:3001`.

For auto-restart on file changes during development:
```bash
npm run dev
```

## Endpoints

### Projects — `/projects`
| Method | Path | Description |
|--------|------|--------------|
| GET | `/projects` | List with search/filter/sort/pagination |
| GET | `/projects/:id` | Single project |
| GET | `/projects/:id/tasks` | All tasks belonging to a project |
| POST | `/projects` | Create |
| PUT | `/projects/:id` | Update |
| DELETE | `/projects/:id` | Delete |

Query params on `GET /projects`:
- `search` — matches `projectName`, `description`
- `status` — exact match filter
- `sortBy`, `sortOrder` — e.g. `?sortBy=createdDate&sortOrder=desc`
- `page`, `limit` — pagination

### Tasks — `/tasks`
| Method | Path | Description |
|--------|------|--------------|
| GET | `/tasks` | List with search/filter/sort/pagination |
| GET | `/tasks/:id` | Single task |
| POST | `/tasks` | Create |
| PUT | `/tasks/:id` | Full update |
| PATCH | `/tasks/:id` | Partial update (used by Kanban drag-and-drop) |
| DELETE | `/tasks/:id` | Delete |

Query params on `GET /tasks` (all combine with AND logic):
- `search` — matches `taskTitle`, the linked project's name, and `assignee`
- `status`, `priority`, `assignee`, `projectId` — exact match filters
- `dueDateFrom`, `dueDateTo` — date range filter
- `sortBy`, `sortOrder`
- `page`, `limit`

Example combining everything:
```
GET /tasks?search=api&status=In Progress&priority=High&sortBy=dueDate&sortOrder=asc&page=1&limit=10
```

### Users — `/users`
| Method | Path | Description |
|--------|------|--------------|
| GET | `/users` | List all users |
| GET | `/users/:id` | Single user |

### Dashboard — `/dashboard`
Returns computed stats in one call:
```json
{
  "totalProjects": 40,
  "totalTasks": 40,
  "completedTasks": 7,
  "pendingTasks": 33,
  "overdueTasks": 10,
  "recentProjects": [...],
  "recentTasks": [...],
  "taskStatusSummary": [
    { "status": "Todo", "count": 8 },
    { "status": "In Progress", "count": 12 },
    { "status": "Review", "count": 13 },
    { "status": "Done", "count": 7 }
  ]
}
```

## How pagination actually works

`utils/queryHelpers.js` → `applyPagination()` uses real `Array.slice()`
after filtering and sorting have already run — it never returns the full
dataset to the client:

```js
const startIndex = (pageNum - 1) * limitNum;
const endIndex = startIndex + limitNum;
const paginatedData = data.slice(startIndex, endIndex);
```

The response includes a `pagination` object (`currentPage`, `totalItems`,
`totalPages`, `hasNextPage`, `hasPrevPage`) so the frontend never needs to
compute pagination math itself — it just reads these fields.

## Data persistence

`utils/db.js` loads `db.json` into memory on startup and writes back to
that same file on every create/update/delete — so changes survive a
server restart, same as a real (if simple) backend.

## Note on debouncing

Debouncing belongs on the **frontend** (your `useDebounce` hook delays
firing the request), not here — this server just responds to whatever
request eventually arrives.