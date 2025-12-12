/* library-module.js
   Unified, robust library management frontend module.
   Expects token in localStorage ("token") and optional window.API_CONFIG.BASE_URL.
   Uses these DOM ids/classes: #library-form, #library-table-body, #library-search,
   #select-all-library, #issued-books-list, #book-count, #issued-books-count, #book-*
*/

(function () {
  'use strict';

  const LOG_PREFIX = '[LibraryModule]';

  // ---------- Config ----------
  const BASE = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL.replace(/\/$/, '') : '';
  const ENDPOINTS = {
    books: `${BASE}/api/books`,
    issue: `${BASE}/api/books/issue`,
    issued: `${BASE}/api/books/issued`,
    return: (issueId) => `${BASE}/library/return/${issueId}`
  };

  // ---------- Internal state ----------
  let initialized = false;
  let libraryTableBody = null;
  let libraryForm = null;
  let librarySearch = null;
  let selectAllLibrary = null;
  let issuedBooksList = null;
  let bookCountEl = null;
  let issuedBooksCountEl = null;

  // Track selected book ids for bulk actions
  const selectedBookIds = new Set();

  // ---------- Helpers ----------
  function log(...args) { console.debug(LOG_PREFIX, ...args); }
  function info(...args) { console.info(LOG_PREFIX, ...args); }
  function warn(...args) { console.warn(LOG_PREFIX, ...args); }
  function error(...args) { console.error(LOG_PREFIX, ...args); }

  function authHeaders(extra = {}) {
    const token = localStorage.getItem('token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...extra
    };
  }

  async function apiFetch(url, options = {}) {
    const opts = {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...authHeaders(options.headers)
      }
    };

    log('apiFetch', url, opts.method || 'GET');
    const res = await fetch(url, opts);

    const text = await res.clone().text().catch(() => '');
    log('apiFetch response', { url, status: res.status, bodyPreview: text.slice(0, 300) });

    if (!res.ok) {
      // Try to parse JSON error
      let errData = null;
      try { errData = await res.json(); } catch (e) { /* ignore */ }
      const msg = (errData && (errData.msg || errData.message)) || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = errData;
      throw err;
    }

    // If no JSON content, return null
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    return res.json();
  }

  function formatKES(n) {
    if (n === null || n === undefined) return 'Ksh 0';
    if (typeof n === 'number') return `Ksh ${n.toLocaleString()}`;
    const parsed = Number(n);
    if (!isFinite(parsed)) return `Ksh ${n}`;
    return `Ksh ${parsed.toLocaleString()}`;
  }

  function showNotification(msg, type = 'info') {
    // Minimal inline notification: append to #notification-container if exists
    const container = document.getElementById('notification-container') || document.body;
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = msg;
    el.style.cssText = 'position:relative;padding:8px 12px;border-radius:6px;margin:6px;background:#222;color:#fff;opacity:0.95';
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // ---------- Rendering ----------
  function renderBookRow(book = {}) {
    const id = book._id || book.id || '';
    const available = (book.available !== undefined ? book.available : (book.copies || 0));
    const copies = book.copies || 0;
    const status = book.status || 'available';
    // sanitize text quickly
    const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<tr data-id="${esc(id)}" data-title="${esc(book.title)}" data-class="${esc(book.className || '')}">
      <td><input type="checkbox" class="library-select-checkbox" data-id="${esc(id)}"></td>
      <td>${esc(book.title)}</td>
      <td>${esc(book.author || '')}</td>
      <td>${esc(book.year || 'N/A')}</td>
      <td>${esc(book.genre || '')}</td>
      <td class="status-${esc(status)}">${esc(status)}</td>
      <td>${esc(copies)}</td>
      <td>${esc(available)}</td>
      <td class="actions-cell">
        <button class="btn btn-sm edit-book-btn" data-id="${esc(id)}">Edit</button>
        <button class="btn btn-sm issue-book-btn" data-id="${esc(id)}" data-available="${available}" ${available < 1 ? 'disabled' : ''}>Issue</button>
        <button class="btn btn-sm delete-book-btn" data-id="${esc(id)}">Delete</button>
      </td>
    </tr>`;
  }

  function updateBookCounts(totalBooks = 0, issuedCount = 0) {
    if (bookCountEl) bookCountEl.textContent = String(totalBooks);
    if (issuedBooksCountEl) issuedBooksCountEl.textContent = String(issuedCount);
  }

  // ---------- Core flows ----------
  async function loadLibraryWithFilters() {
    try {
      if (!libraryTableBody) libraryTableBody = document.getElementById('library-table-body');
      if (!libraryTableBody) {
        warn('library-table-body not found');
        return;
      }
      libraryTableBody.innerHTML = `<tr><td colspan="9">Loading books...</td></tr>`;

      // build filters: only class filter supported per your confirmation
      const classFilterEl = document.getElementById('library-class') || document.getElementById('library-class-filter');
      let qs = '';
      if (classFilterEl && classFilterEl.value) {
        qs = `?className=${encodeURIComponent(classFilterEl.value)}`;
      } else if (librarySearch && librarySearch.value) {
        qs = `?search=${encodeURIComponent(librarySearch.value.trim())}`;
      }

      // call API: either /api/books (GET) with query string
      const response = await apiFetch(`${ENDPOINTS.books}${qs}`);
      // API might return array or {data:[]}
      const books = Array.isArray(response) ? response : (response && response.data ? response.data : []);

      if (!Array.isArray(books)) {
        libraryTableBody.innerHTML = `<tr><td colspan="9">Invalid books response</td></tr>`;
        return;
      }

      if (books.length === 0) {
        libraryTableBody.innerHTML = `<tr><td colspan="9">No books found in the library.</td></tr>`;
      } else {
        libraryTableBody.innerHTML = books.map(renderBookRow).join('');
      }

      // update counters
      const totalBooks = books.length;
      // issued count we retrieve separately (or infer zero)
      let issuedCount = 0;
      try {
        const issued = await apiFetch(ENDPOINTS.issued);
        issuedCount = Array.isArray(issued) ? issued.length : (issued && issued.data ? issued.data.length : 0);
      } catch (err) {
        warn('Could not load issued count:', err.message || err);
      }
      updateBookCounts(totalBooks, issuedCount);

      attachBookTableListeners(); // re-attach events safely

    } catch (err) {
      error('Error loading library:', err);
      if (libraryTableBody) libraryTableBody.innerHTML = `<tr><td colspan="9" class="text-danger">Error loading books: ${err.message}</td></tr>`;
      showNotification('Failed to load library books', 'error');
    }
  }

  async function addBookFromForm(ev) {
    ev.preventDefault();
    if (!libraryForm) return;

    const title = (document.getElementById('book-title')?.value || '').trim();
    const author = (document.getElementById('book-author')?.value || '').trim();
    const year = parseInt(document.getElementById('book-year')?.value) || new Date().getFullYear();
    const genre = (document.getElementById('book-genre')?.value || '').trim();
    const className = (document.getElementById('book-class')?.value || '').trim();
    const copies = parseInt(document.getElementById('book-copies')?.value) || 1;
    const status = (document.getElementById('book-status')?.value || 'available');

    if (!title || !author || !className) {
      alert('Please fill required fields: title, author and class.');
      return;
    }

    try {
      const payload = { title, author, year, genre, className, copies, available: copies, status };

      const res = await apiFetch(ENDPOINTS.books, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showNotification('Book added successfully', 'success');
      libraryForm.reset();
      await loadLibraryWithFilters();
    } catch (err) {
      error('Add book failed', err);
      showNotification(err.message || 'Failed to add book', 'error');
    }
  }

  async function issueBookFlow(bookId) {
    try {
      const studentId = prompt('Enter Student ID (or admission number):');
      if (!studentId) return;

      const res = await apiFetch(ENDPOINTS.issue, {
        method: 'POST',
        body: JSON.stringify({ bookId, studentId })
      });

      showNotification('Book issued successfully', 'success');
      await loadLibraryWithFilters();
    } catch (err) {
      error('Issue book failed', err);
      showNotification(err.message || 'Failed to issue book', 'error');
    }
  }

  async function deleteBookFlow(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      await apiFetch(`${ENDPOINTS.books}/${encodeURIComponent(bookId)}`, { method: 'DELETE' });
      showNotification('Book deleted', 'success');
      await loadLibraryWithFilters();
    } catch (err) {
      error('Delete book failed', err);
      showNotification(err.message || 'Failed to delete book', 'error');
    }
  }

  // Return flow uses your endpoint POST /library/return/:issueId
  async function returnBookFlow(issueId) {
    try {
      // ask confirmation / optionally ask fine paid
      const ok = confirm('Confirm return of this issued book?');
      if (!ok) return;

      await apiFetch(ENDPOINTS.return(issueId), { method: 'POST' });
      showNotification('Book returned successfully', 'success');
      await loadLibraryWithFilters();
      await loadIssuedBooks();
    } catch (err) {
      error('Return failed', err);
      showNotification(err.message || 'Failed to return book', 'error');
    }
  }

  // ---------- Issued books ----------
  async function loadIssuedBooks() {
    try {
      if (!issuedBooksList) issuedBooksList = document.getElementById('issued-books-list');
      if (!issuedBooksList) {
        warn('issued-books-list not found');
        return;
      }
      issuedBooksList.innerHTML = `<tr><td colspan="8">Loading issued books...</td></tr>`;
      const res = await apiFetch(ENDPOINTS.issued);
      const issued = Array.isArray(res) ? res : (res && res.data ? res.data : []);
      if (!Array.isArray(issued) || issued.length === 0) {
        issuedBooksList.innerHTML = `<tr><td colspan="8">No issued books found.</td></tr>`;
        return;
      }

      const rows = issued.map(item => {
        // Expecting each item has fields like: _id(issue id), title, borrowerName, className, issueDate, dueDate, returned, fine
        const issueId = item._id || item.issueId || '';
        const title = item.title || item.doc?.title || item.book?.title || 'Unknown';
        const borrower = item.borrowerName || item.borrower || 'Unknown';
        const className = item.className || item.doc?.className || item.book?.className || 'Ungrouped';
        const issueDate = item.issueDate ? new Date(item.issueDate).toLocaleDateString() : 'N/A';
        const dueDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A';
        const returned = !!item.returned;
        const fine = item.fine || 0;

        return `<tr data-issueid="${issueId}">
          <td>${title}</td>
          <td>${borrower}</td>
          <td>${className}</td>
          <td>${issueDate}</td>
          <td>${dueDate}${(!returned && new Date(item.dueDate) < new Date() ? ` <span style="color:red">Overdue</span>` : '')}</td>
          <td>${returned ? 'Returned' : 'Issued'}</td>
          <td>${fine ? `Ksh ${Number(fine).toFixed(2)}` : '-'}</td>
          <td>${!returned ? `<button class="btn btn-sm return-book-btn" data-issueid="${issueId}">Return</button>` : ''}</td>
        </tr>`;
      });

      issuedBooksList.innerHTML = rows.join('');
    } catch (err) {
      error('Error loading issued books', err);
      if (issuedBooksList) issuedBooksList.innerHTML = `<tr><td colspan="8" class="text-danger">Failed to load issued books</td></tr>`;
    }
  }

  // ---------- Event binding (idempotent) ----------
  function attachBookTableListeners() {
    if (!libraryTableBody) libraryTableBody = document.getElementById('library-table-body');
    if (!libraryTableBody) return;

    // Avoid re-binding: we attach once by setting a flag on the element
    if (libraryTableBody._bound) return;
    libraryTableBody._bound = true;

    libraryTableBody.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('button');
      if (!btn) return;

      if (btn.classList.contains('issue-book-btn')) {
        const bookId = btn.getAttribute('data-id');
        await issueBookFlow(bookId);
        return;
      }

      if (btn.classList.contains('delete-book-btn')) {
        const bookId = btn.getAttribute('data-id');
        await deleteBookFlow(bookId);
        return;
      }

      if (btn.classList.contains('edit-book-btn')) {
        alert('Edit book not implemented in this module — add your edit flow here.');
        return;
      }
    });

    // Checkbox selection
    libraryTableBody.addEventListener('change', (ev) => {
      const cb = ev.target.closest('.library-select-checkbox');
      if (!cb) return;
      const id = cb.getAttribute('data-id');
      if (cb.checked) selectedBookIds.add(id);
      else selectedBookIds.delete(id);
      updateBulkToolbar();
    });
  }

  function updateBulkToolbar() {
    const toolbar = document.getElementById('library-bulk-toolbar');
    const deleteBtn = document.getElementById('library-bulk-delete');
    const exportBtn = document.getElementById('library-bulk-export');
    if (!toolbar) return;
    const show = selectedBookIds.size > 0;
    toolbar.style.display = show ? 'block' : 'none';
    if (deleteBtn) deleteBtn.disabled = !show;
    if (exportBtn) exportBtn.disabled = !show;
  }

  // Bulk delete handler (simple)
  async function handleBulkDelete() {
    if (selectedBookIds.size === 0) return;
    if (!confirm(`Delete ${selectedBookIds.size} selected book(s)?`)) return;

    try {
      const ids = Array.from(selectedBookIds);
      for (const id of ids) {
        await apiFetch(`${ENDPOINTS.books}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      }
      showNotification('Selected books deleted', 'success');
      selectedBookIds.clear();
      updateBulkToolbar();
      await loadLibraryWithFilters();
    } catch (err) {
      error('Bulk delete error', err);
      showNotification('Some deletions failed', 'error');
    }
  }

  // Bulk export simple CSV
  async function handleBulkExport() {
    if (selectedBookIds.size === 0) {
      showNotification('Select books to export', 'warning');
      return;
    }
    try {
      // fetch all books then filter locally to avoid extra endpoints
      const res = await apiFetch(ENDPOINTS.books);
      const books = Array.isArray(res) ? res : (res && res.data ? res.data : []);
      const selected = books.filter(b => selectedBookIds.has(String(b._id || b.id)));
      if (!selected.length) throw new Error('No matching books found');

      const headers = ['Title', 'Author', 'Class', 'Status', 'Available', 'Genre'];
      let csv = headers.join(',') + '\n';
      selected.forEach(b => {
        const row = [
          `"${(b.title||'').replace(/"/g,'""')}"`,
          `"${(b.author||'').replace(/"/g,'""')}"`,
          `"${(b.className||'').replace(/"/g,'""')}"`,
          `"${(b.status||'').replace(/"/g,'""')}"`,
          `${b.available||0}`,
          `"${(b.genre||'').replace(/"/g,'""')}"`,
        ];
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `library_export_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showNotification('Exported selected books', 'success');
    } catch (err) {
      error('Export failed', err);
      showNotification(err.message || 'Export failed', 'error');
    }
  }

  // Attach issued book return listener
  function attachIssuedBooksListeners() {
    if (!issuedBooksList) issuedBooksList = document.getElementById('issued-books-list');
    if (!issuedBooksList) return;
    if (issuedBooksList._bound) return;
    issuedBooksList._bound = true;
    issuedBooksList.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('.return-book-btn');
      if (!btn) return;
      const issueId = btn.getAttribute('data-issueid');
      await returnBookFlow(issueId);
    });
  }

  // ---------- Initialization ----------
  function wireFormAndControls() {
    // DOM element references (lazy)
    libraryForm = document.getElementById('library-form');
    libraryTableBody = document.getElementById('library-table-body') || libraryTableBody;
    librarySearch = document.getElementById('library-search') || librarySearch;
    selectAllLibrary = document.getElementById('select-all-library') || selectAllLibrary;
    issuedBooksList = document.getElementById('issued-books-list') || issuedBooksList;
    bookCountEl = document.getElementById('book-count') || bookCountEl;
    issuedBooksCountEl = document.getElementById('issued-books-count') || issuedBooksCountEl;

    // form submit
    if (libraryForm && !libraryForm._bound) {
      libraryForm._bound = true;
      libraryForm.addEventListener('submit', addBookFromForm);
    }

    // search debounce
    if (librarySearch && !librarySearch._bound) {
      librarySearch._bound = true;
      let t;
      librarySearch.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => loadLibraryWithFilters(), 300);
      });
    }

    // select all checkbox
    if (selectAllLibrary && !selectAllLibrary._bound) {
      selectAllLibrary._bound = true;
      selectAllLibrary.addEventListener('change', (ev) => {
        const checked = !!ev.target.checked;
        document.querySelectorAll('.library-select-checkbox').forEach(cb => {
          cb.checked = checked;
          const id = cb.getAttribute('data-id');
          if (checked) selectedBookIds.add(id); else selectedBookIds.delete(id);
        });
        updateBulkToolbar();
      });
    }

    // bulk buttons
    const bulkDelete = document.getElementById('library-bulk-delete');
    if (bulkDelete && !bulkDelete._bound) {
      bulkDelete._bound = true;
      bulkDelete.addEventListener('click', handleBulkDelete);
    }
    const bulkExport = document.getElementById('library-bulk-export');
    if (bulkExport && !bulkExport._bound) {
      bulkExport._bound = true;
      bulkExport.addEventListener('click', handleBulkExport);
    }
  }

  async function initLibrary() {
    if (initialized) {
      log('Already initialized');
      return;
    }
    initialized = true;
    log('initLibrary start');

    // Wire DOM controls
    wireFormAndControls();

    // Load data
    await loadLibraryWithFilters();
    await loadIssuedBooks();

    // Attach listeners
    attachBookTableListeners();
    attachIssuedBooksListeners();

    // update bulk toolbar initial
    updateBulkToolbar();

    log('initLibrary done');
  }

  // Public init that is safe to call multiple times
  function initializeLibrary() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initLibrary().catch(err => error(err)));
    } else {
      initLibrary().catch(err => error(err));
    }
  }

  // auto-init
  initializeLibrary();

  // expose a couple of helpers for debugging if needed
  window.__LIBRARY_MODULE = {
    reloadBooks: loadLibraryWithFilters,
    reloadIssued: loadIssuedBooks,
    apiFetch,
    config: { BASE, ENDPOINTS }
  };

})();
