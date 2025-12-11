console.log('Library script loaded');

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const libraryForm = document.getElementById('library-form');
    const libraryTableBody = document.getElementById('library-table-body');
    const librarySearch = document.getElementById('library-search');
    const selectAllLibrary = document.getElementById('select-all-library');

    // API helper
    async function apiFetch(url, options = {}) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${window.API_CONFIG?.BASE_URL || ''}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(options.headers || {})
            }
        });
        if (!res.ok) throw new Error('API Error: ' + res.status);
        return res.json();
    }

    // Render a book row
    function renderBookRow(book) {
        return `
            <tr>
                <td><input type="checkbox" data-id="${book._id}"></td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.year}</td>
                <td>${book.genre}</td>
                <td>${book.status}</td>
                <td>${book.copies}</td>
                <td>${book.available}</td>
                <td>
                    <button class="issue-book-btn" data-id="${book._id}">Issue</button>
                    <button class="delete-book-btn" data-id="${book._id}">Delete</button>
                </td>
            </tr>
        `;
    }

    // Load books
    async function loadBooks() {
        try {
            libraryTableBody.innerHTML = '<tr><td colspan="9">Loading...</td></tr>';
            const books = await apiFetch('/api/books');
            if (books.length === 0) {
                libraryTableBody.innerHTML = '<tr><td colspan="9">No books found.</td></tr>';
                return;
            }
            libraryTableBody.innerHTML = books.map(renderBookRow).join('');
        } catch (err) {
            console.error('Error loading books:', err);
            libraryTableBody.innerHTML = `<tr><td colspan="9">Error loading books</td></tr>`;
        }
    }

    // Add new book
    libraryForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const year = parseInt(document.getElementById('book-year').value) || 2025;
        const genre = document.getElementById('book-genre').value;
        const className = document.getElementById('book-class').value;
        const copies = parseInt(document.getElementById('book-copies').value) || 1;
        const status = document.getElementById('book-status').value;

        if (!title || !author || !className) {
            alert('Please fill all required fields');
            return;
        }

        try {
            await apiFetch('/api/books', {
                method: 'POST',
                body: JSON.stringify({
                    title, author, year, genre, className,
                    copies, available: copies, status
                })
            });
            alert('Book added successfully');
            libraryForm.reset();
            await loadBooks();
        } catch (err) {
            console.error(err);
            alert('Failed to add book');
        }
    });

    // Handle issue/delete buttons
    libraryTableBody?.addEventListener('click', async (e) => {
        const btn = e.target.closest('.issue-book-btn, .delete-book-btn');
        if (!btn) return;

        const bookId = btn.getAttribute('data-id');

        if (btn.classList.contains('issue-book-btn')) {
            const studentId = prompt('Enter Student ID:');
            if (!studentId) return;
            try {
                await apiFetch('/api/books/issue', {
                    method: 'POST',
                    body: JSON.stringify({ bookId, studentId })
                });
                alert('Book issued successfully');
                await loadBooks();
            } catch (err) {
                console.error(err);
                alert('Failed to issue book');
            }
        }

        if (btn.classList.contains('delete-book-btn')) {
            if (!confirm('Delete this book?')) return;
            try {
                await apiFetch(`/api/books/${bookId}`, { method: 'DELETE' });
                alert('Book deleted');
                await loadBooks();
            } catch (err) {
                console.error(err);
                alert('Failed to delete book');
            }
        }
    });

    // Initial load
    loadBooks();
});
