/**
 * Generic, reusable helpers for filtering, sorting, and paginating
 * an in-memory array of records based on Express req.query params.
 *
 * These are written to be resource-agnostic so the same functions
 * work for /projects, /tasks, etc.
 */

/**
 * Case-insensitive partial match search across one or more fields.
 * @param {Array} data
 * @param {string} searchTerm - value of ?search=...
 * @param {string[]} fields - which fields to search across
 */
function applySearch(data, searchTerm, fields) {
  if (!searchTerm) return data;
  const term = searchTerm.toLowerCase();

  return data.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (value === undefined || value === null) return false;
      return String(value).toLowerCase().includes(term);
    })
  );
}

/**
 * Exact-match filtering for one or more fields, all combined with AND logic.
 * Only applies a filter if the corresponding query param was actually sent.
 * @param {Array} data
 * @param {Object} query - req.query
 * @param {string[]} filterableFields - e.g. ['status', 'priority', 'assignee']
 */
function applyFilters(data, query, filterableFields) {
  let result = data;

  filterableFields.forEach((field) => {
    const filterValue = query[field];
    if (filterValue === undefined || filterValue === '') return;

    result = result.filter(
      (item) =>
        String(item[field]).toLowerCase() === String(filterValue).toLowerCase()
    );
  });

  return result;
}

/**
 * Date range filtering, e.g. ?dueDateFrom=2026-09-01&dueDateTo=2026-09-30
 * @param {Array} data
 * @param {Object} query
 * @param {string} field - the date field to filter on, e.g. 'dueDate'
 */
function applyDateRange(data, query, field) {
  const fromParam = query[`${field}From`];
  const toParam = query[`${field}To`];
  let result = data;

  if (fromParam) {
    const fromDate = new Date(fromParam);
    result = result.filter((item) => new Date(item[field]) >= fromDate);
  }
  if (toParam) {
    const toDate = new Date(toParam);
    result = result.filter((item) => new Date(item[field]) <= toDate);
  }
  return result;
}

/**
 * Sorting by any field, ascending or descending.
 * ?sortBy=createdDate&sortOrder=desc
 * @param {Array} data
 * @param {string} sortBy - field name
 * @param {string} sortOrder - 'asc' | 'desc'
 */
function applySort(data, sortBy, sortOrder = 'asc') {
  if (!sortBy) return data;

  const sorted = [...data].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];

    // Try date comparison first
    const dateA = new Date(valA);
    const dateB = new Date(valB);
    if (!isNaN(dateA) && !isNaN(dateB) && typeof valA === 'string' && valA.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dateA - dateB;
    }

    // Numeric comparison
    if (typeof valA === 'number' && typeof valB === 'number') {
      return valA - valB;
    }

    // Fallback: string comparison
    return String(valA).localeCompare(String(valB));
  });

  return sortOrder === 'desc' ? sorted.reverse() : sorted;
}

/**
 * Real pagination using slice() — not returning the full dataset.
 * ?page=2&limit=10
 * @param {Array} data - the already filtered + sorted array
 * @param {string|number} page
 * @param {string|number} limit
 */
function applyPagination(data, page = 1, limit = 10) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / limitNum) || 1;
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;

  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      currentPage: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  };
}

module.exports = {
  applySearch,
  applyFilters,
  applyDateRange,
  applySort,
  applyPagination,
};