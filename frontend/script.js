/* =====================================================
   Snippet Saver — Frontend Script
   ===================================================== */

const API_BASE = 'http://localhost:5000';

// ─── State ───────────────────────────────────────────
let allSnippets = [];        // full list from server
let activeFilter = 'all';    // 'all' | 'favorites'
let activeTagFilter = null;  // tag string or null
let searchQuery = '';
let sortMode = 'newest';

// ─── DOM refs ────────────────────────────────────────
const form = document.getElementById('snippetForm');
const titleInput = document.getElementById('titleInput');
const contentInput = document.getElementById('contentInput');
const tagsInput = document.getElementById('tagsInput');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const submitIcon = document.getElementById('submitIcon');
const charCount = document.getElementById('charCount');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const snippetsGrid = document.getElementById('snippetsGrid');
const countLabel = document.getElementById('snippetsCountLabel');
const totalCount = document.getElementById('totalCount');
const favCount = document.getElementById('favCount');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sortSelect');
const filterBanner = document.getElementById('filterBanner');
const activeTagLabel = document.getElementById('activeTagLabel');
const clearTagFilter = document.getElementById('clearTagFilter');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const toastIcon = document.getElementById('toastIcon');

// ─── Modal refs ──────────────────────────────────────
let currentModalSnippetId = null;
const previewModal = document.getElementById('previewModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalCopyBtn = document.getElementById('modalCopyBtn');
const modalFavBtn = document.getElementById('modalFavBtn');

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        previewModal.classList.remove('active');
        currentModalSnippetId = null;
    });
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.classList.remove('active');
            currentModalSnippetId = null;
        }
    });
}

if (modalCopyBtn) {
    modalCopyBtn.addEventListener('click', async () => {
        if (!currentModalSnippetId) return;
        const snippet = allSnippets.find(s => s._id === currentModalSnippetId);
        if (snippet) {
            try {
                await navigator.clipboard.writeText(snippet.content);
                showToast('Copied from preview!', 'copy');
                modalCopyBtn.textContent = '✔';
                setTimeout(() => { modalCopyBtn.textContent = '⧉'; }, 1500);
            } catch {
                showToast('Copy failed. Try manually.', 'error');
            }
        }
    });

    modalFavBtn.addEventListener('click', async () => {
        if (!currentModalSnippetId) return;
        await toggleFavorite(currentModalSnippetId);
        const snippet = allSnippets.find(s => s._id === currentModalSnippetId);
        if (snippet) {
            modalFavBtn.textContent = snippet.favorite ? '★' : '☆';
            modalFavBtn.classList.toggle('active', snippet.favorite);
            modalFavBtn.title = snippet.favorite ? 'Unstar' : 'Star';
        }
    });
}

// ─── Toast ───────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', copy: '📋' };
    toastMsg.textContent = msg;
    toastIcon.textContent = icons[type] || icons.info;
    toast.className = `show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = ''; }, 2800);
}

// ─── Char counter ────────────────────────────────────
contentInput.addEventListener('input', () => {
    charCount.textContent = contentInput.value.length;
});

// ─── Fetch all snippets ──────────────────────────────
async function fetchSnippets() {
    try {
        const res = await fetch(`${API_BASE}/snippets`);
        if (!res.ok) throw new Error('Failed to load snippets');
        allSnippets = await res.json();
        renderSnippets();
        updateStats();
    } catch (err) {
        snippetsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Could not connect to server</div>
        <div class="empty-desc">Make sure the backend is running on port 5000</div>
      </div>`;
        showToast('Cannot reach backend. Is it running?', 'error');
    }
}

// ─── Update header stats ─────────────────────────────
function updateStats() {
    totalCount.textContent = allSnippets.length;
    favCount.textContent = allSnippets.filter(s => s.favorite).length;
}

// ─── Filter + sort pipeline ──────────────────────────
function getFilteredSnippets() {
    let list = [...allSnippets];

    // Favorite filter
    if (activeFilter === 'favorites') {
        list = list.filter(s => s.favorite);
    }

    // Tag filter
    if (activeTagFilter) {
        list = list.filter(s =>
            s.tags.some(t => t.toLowerCase() === activeTagFilter.toLowerCase())
        );
    }

    // Search
    if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        list = list.filter(s =>
            s.title.toLowerCase().includes(q) ||
            s.tags.some(t => t.toLowerCase().includes(q))
        );
    }

    // Sort
    if (sortMode === 'oldest') {
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortMode === 'title') {
        list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
}

// ─── Render snippets ─────────────────────────────────
function renderSnippets() {
    const list = getFilteredSnippets();
    countLabel.innerHTML = `Showing <strong>${list.length}</strong> snippet${list.length !== 1 ? 's' : ''}`;

    if (list.length === 0) {
        snippetsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">${allSnippets.length === 0 ? 'No snippets yet' : 'No results found'}</div>
        <div class="empty-desc">${allSnippets.length === 0 ? 'Create your first snippet using the form.' : 'Try a different search or filter.'}</div>
      </div>`;
        return;
    }

    snippetsGrid.innerHTML = list.map(s => buildCard(s)).join('');
    // Syntax highlight after render
    if (window.hljs) {
        document.querySelectorAll('.card-content code').forEach(el => hljs.highlightElement(el));
    }
}

// ─── Build card HTML ─────────────────────────────────
const TAG_COLORS = 6;
const tagColorCache = {};
let tagColorIdx = 0;
function getTagColor(tag) {
    if (!(tag in tagColorCache)) {
        tagColorCache[tag] = tagColorIdx % TAG_COLORS;
        tagColorIdx++;
    }
    return tagColorCache[tag];
}

function buildCard(s) {
    const date = new Date(s.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
    const tagsHTML = s.tags.length
        ? s.tags.map(t => `
        <span class="tag tag-color-${getTagColor(t)}" data-tag="${escapeHtml(t)}" title="Filter by ${escapeHtml(t)}">
          #${escapeHtml(t)}
        </span>`).join('')
        : '';

    const content = escapeHtml(s.content);

    return `
    <article class="snippet-card" role="listitem" data-id="${s._id}">
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(s.title)}</h3>
        <div class="card-actions">
          <button class="action-btn copy-btn" title="Copy content" data-id="${s._id}" aria-label="Copy content">
            ⧉
          </button>
          <button class="action-btn fav-btn ${s.favorite ? 'active' : ''}" title="${s.favorite ? 'Unstar' : 'Star'}" data-id="${s._id}" aria-label="${s.favorite ? 'Remove from favorites' : 'Add to favorites'}">
            ${s.favorite ? '★' : '☆'}
          </button>
          <button class="action-btn del-btn" title="Delete" data-id="${s._id}" aria-label="Delete snippet">
            ✕
          </button>
        </div>
      </div>
      <div class="card-content"><code>${content}</code></div>
      ${tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ''}
      <div class="card-footer">
        <span class="card-date">📅 ${date}</span>
        <span class="fav-indicator ${s.favorite ? 'shown' : ''}">★ Favorite</span>
      </div>
    </article>`;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ─── Event delegation on grid ────────────────────────
snippetsGrid.addEventListener('click', async (e) => {
    // Copy
    const copyBtn = e.target.closest('.copy-btn');
    if (copyBtn) {
        const id = copyBtn.dataset.id;
        const snippet = allSnippets.find(s => s._id === id);
        if (snippet) {
            try {
                await navigator.clipboard.writeText(snippet.content);
                showToast('Copied to clipboard!', 'copy');
                copyBtn.textContent = '✔';
                setTimeout(() => { copyBtn.textContent = '⧉'; }, 1500);
            } catch {
                showToast('Copy failed. Try manually.', 'error');
            }
        }
        return;
    }

    // Favorite
    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
        await toggleFavorite(favBtn.dataset.id);
        return;
    }

    // Delete
    const delBtn = e.target.closest('.del-btn');
    if (delBtn) {
        await deleteSnippet(delBtn.dataset.id);
        return;
    }

    // Tag click — filter
    const tag = e.target.closest('.tag');
    if (tag) {
        setTagFilter(tag.dataset.tag);
        return;
    }

    // Modal Preview
    const card = e.target.closest('.snippet-card');
    if (card && previewModal) {
        const id = card.dataset.id;
        const snippet = allSnippets.find(s => s._id === id);
        if (snippet) {
            currentModalSnippetId = snippet._id;
            modalTitle.textContent = snippet.title;
            modalContent.textContent = snippet.content;

            if (modalFavBtn) {
                modalFavBtn.textContent = snippet.favorite ? '★' : '☆';
                modalFavBtn.classList.toggle('active', snippet.favorite);
                modalFavBtn.title = snippet.favorite ? 'Unstar' : 'Star';
            }

            previewModal.classList.add('active');
            if (window.hljs) hljs.highlightElement(modalContent);
        }
    }
});

// ─── Tag filter ──────────────────────────────────────
function setTagFilter(tag) {
    activeTagFilter = tag;
    activeTagLabel.textContent = tag;
    filterBanner.classList.add('shown');
    renderSnippets();
}
clearTagFilter.addEventListener('click', () => {
    activeTagFilter = null;
    filterBanner.classList.remove('shown');
    renderSnippets();
});

// ─── Favorite toggle ─────────────────────────────────
async function toggleFavorite(id) {
    try {
        const res = await fetch(`${API_BASE}/snippets/${id}/favorite`, { method: 'PATCH' });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        const idx = allSnippets.findIndex(s => s._id === id);
        if (idx !== -1) allSnippets[idx] = updated;
        renderSnippets();
        updateStats();
        showToast(updated.favorite ? '★ Added to favorites' : '☆ Removed from favorites', 'info');
    } catch {
        showToast('Failed to update favorite', 'error');
    }
}

// ─── Delete snippet ──────────────────────────────────
async function deleteSnippet(id) {
    const card = document.querySelector(`.snippet-card[data-id="${id}"]`);
    if (card) {
        card.style.transition = 'all 0.25s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
    }
    try {
        const res = await fetch(`${API_BASE}/snippets/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        allSnippets = allSnippets.filter(s => s._id !== id);
        setTimeout(() => {
            renderSnippets();
            updateStats();
        }, 260);
        showToast('Snippet deleted', 'info');
    } catch {
        if (card) { card.style.opacity = '1'; card.style.transform = ''; }
        showToast('Failed to delete snippet', 'error');
    }
}

// ─── Add snippet ─────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const tagsRaw = tagsInput.value.trim();
    const tags = tagsRaw
        ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
        : [];

    if (!title || !content) {
        showToast('Title and content are required!', 'error');
        if (!title) titleInput.focus();
        else contentInput.focus();
        return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Saving…';
    if (submitIcon) submitIcon.textContent = '⏳';

    try {
        const res = await fetch(`${API_BASE}/snippets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, tags }),
        });
        if (!res.ok) throw new Error();
        const newSnippet = await res.json();
        allSnippets.unshift(newSnippet);
        form.reset();
        charCount.textContent = '0';
        renderSnippets();
        updateStats();
        showToast('Snippet saved! ✨', 'success');
        // scroll to top of grid on mobile
        if (window.innerWidth < 900) {
            document.querySelector('.content-area').scrollIntoView({ behavior: 'smooth' });
        }
    } catch {
        showToast('Failed to save snippet', 'error');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Save Snippet';
        if (submitIcon) submitIcon.textContent = '＋';
    }
});

// ─── Search ──────────────────────────────────────────
let searchDebounce;
searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    clearSearch.style.display = searchQuery ? 'block' : 'none';
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(renderSnippets, 200);
});
clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearch.style.display = 'none';
    renderSnippets();
});

// ─── Filter buttons ──────────────────────────────────
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderSnippets();
    });
});

// ─── Sort ────────────────────────────────────────────
sortSelect.addEventListener('change', () => {
    sortMode = sortSelect.value;
    renderSnippets();
});

// ─── Init ────────────────────────────────────────────
fetchSnippets();
