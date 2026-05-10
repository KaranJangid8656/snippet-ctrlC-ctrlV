/* =====================================================
   Snippet Saver — Frontend Script
   ===================================================== */

const API_BASE = 'http://localhost:5001';

// ─── State ───────────────────────────────────────────
let allSnippets = [];        // full list from server
let activeFilter = 'all';    // 'all' | 'favorites'
let activeTagFilter = null;  // tag string or null
let activeFolderFilter = null; // folder ID or null
let searchQuery = '';
let sortMode = 'newest';
let allFolders = [];

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
const languageChartEl = document.getElementById('languageChart');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sortSelect');
const filterBanner = document.getElementById('filterBanner');
const activeTagLabel = document.getElementById('activeTagLabel');
const clearTagFilter = document.getElementById('clearTagFilter');

const toastIcon = document.getElementById('toastIcon');

const foldersPanel = document.getElementById('foldersPanel');
const foldersList = document.getElementById('foldersList');
const addFolderBtn = document.getElementById('addFolderBtn');
const folderSelect = document.getElementById('folderSelect');

// ─── Modal refs ──────────────────────────────────────
let currentModalSnippetId = null;
const previewModal = document.getElementById('previewModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalCopyBtn = document.getElementById('modalCopyBtn');
const modalFavBtn = document.getElementById('modalFavBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const featuredPanel = document.getElementById('featuredPanel');
const featuredContent = document.getElementById('featuredContent');

// ─── Auth refs ───────────────────────────────────────
let authMode = 'login'; // 'login' | 'register'
const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authForm = document.getElementById('authForm');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleBtn = document.getElementById('authToggleBtn');
const closeAuthModal = document.getElementById('closeAuthModal');
const authModalTitle = document.getElementById('authModalTitle');
const authToggleText = document.getElementById('authToggleText');
const nameGroup = document.getElementById('nameGroup');
const userProfile = document.getElementById('userProfile');
const userNameDisplay = document.getElementById('userName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authName = document.getElementById('authName');

// ─── Folder Modal refs ───────────────────────────────
const folderModal = document.getElementById('folderModal');
const folderForm = document.getElementById('folderForm');
const closeFolderModal = document.getElementById('closeFolderModal');
const newFolderName = document.getElementById('newFolderName');

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
    const icons = {
        success: '<i data-lucide="check-circle" style="width:16px;height:16px;color:var(--success)"></i>',
        error: '<i data-lucide="x-circle" style="width:16px;height:16px;color:var(--danger)"></i>',
        info: '<i data-lucide="info" style="width:16px;height:16px;color:var(--accent)"></i>',
        copy: '<i data-lucide="clipboard-check" style="width:16px;height:16px;color:var(--accent)"></i>'
    };
    toastMsg.textContent = msg;
    toastIcon.innerHTML = icons[type] || icons.info;
    toast.className = `show ${type}`;
    if (window.lucide) window.lucide.createIcons();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = ''; }, 2800);
}

// ─── Char counter ────────────────────────────────────
contentInput.addEventListener('input', () => {
    charCount.textContent = contentInput.value.length;
});

// ─── Fetch all snippets ──────────────────────────────
async function fetchSnippets(sortBy = 'createdAt', order = 'desc') {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        let url = `${API_BASE}/snippets?sortBy=${sortBy}&order=${order}`;
        if (activeFolderFilter) url += `&folderId=${activeFolderFilter}`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error('Failed to load snippets');

        const data = await res.json();
        // Handle both new { snippets: [] } and old [] formats
        allSnippets = Array.isArray(data) ? data : (data.snippets || []);

        renderSnippets();
        updateStats();
    } catch (err) {
        console.error('Fetch error:', err);
        snippetsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i data-lucide="server-crash" style="width:48px;height:48px;"></i></div>
        <div class="empty-title">Could not connect to server</div>
        <div class="empty-desc">Make sure the backend is running on port 5000</div>
      </div>`;
        if (window.lucide) window.lucide.createIcons();
        showToast('Cannot reach backend. Is it running?', 'error');
    }
}

// ─── Update header stats ─────────────────────────────
async function updateStats() {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE}/snippets/stats`, { headers });
        if (!res.ok) throw new Error();
        const stats = await res.json();

        totalCount.textContent = stats.totalCount[0]?.count || 0;
        favCount.textContent = stats.favoriteStats.find(s => s._id === true)?.count || 0;

        renderStatsLists(stats.tagClouds, stats.languageStats);
    } catch (err) {
        console.error('Failed to fetch stats:', err);
        totalCount.textContent = allSnippets.length;
        favCount.textContent = allSnippets.filter(s => s.favorite).length;
    }
}

let myLanguageChart = null;

function renderStatsLists(tags, languages) {
    // Render Language Chart
    if (languageChartEl && window.Chart) {
        const ctx = languageChartEl.getContext('2d');
        const labels = (languages || []).map(l => l._id);
        const data = (languages || []).map(l => l.count);
        const colors = labels.map(l => getLangColor(l));

        if (myLanguageChart) {
            myLanguageChart.destroy();
        }

        myLanguageChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'left',
                        labels: {
                            color: '#4b5175',
                            font: { size: 10, family: "'Inter', sans-serif" },
                            boxWidth: 10,
                            padding: 10
                        }
                    }
                }
            }
        });
    }
}

function getLangColor(lang) {
    const colors = {
        javascript: '#f7df1e',
        python: '#3776ab',
        html: '#e34f26',
        css: '#1572b6',
        sql: '#336791',
        markdown: '#083fa1',
        other: '#9ca3c0'
    };
    return colors[lang.toLowerCase()] || '#9ca3c0';
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

    return list;
}

// ─── Render snippets ─────────────────────────────────
function renderSnippets() {
    const list = getFilteredSnippets();
    countLabel.innerHTML = `Showing <strong>${list.length}</strong> snippet${list.length !== 1 ? 's' : ''}`;

    if (list.length === 0) {
        snippetsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i data-lucide="inbox" style="width:48px;height:48px;opacity:0.5"></i></div>
        <div class="empty-title">${allSnippets.length === 0 ? 'No snippets yet' : 'No results found'}</div>
        <div class="empty-desc">${allSnippets.length === 0 ? 'Create your first snippet using the form.' : 'Try a different search or filter.'}</div>
      </div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    snippetsGrid.innerHTML = list.map(s => buildCard(s)).join('');
    if (window.lucide) window.lucide.createIcons();
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
            <i data-lucide="copy" style="width:14px;height:14px;"></i>
          </button>
          <button class="action-btn fav-btn ${s.favorite ? 'active' : ''}" title="${s.favorite ? 'Unstar' : 'Star'}" data-id="${s._id}" aria-label="${s.favorite ? 'Remove from favorites' : 'Add to favorites'}">
            <i data-lucide="star" style="width:14px;height:14px; ${s.favorite ? 'fill: currentColor;' : ''}"></i>
          </button>
          <button class="action-btn del-btn" title="Delete" data-id="${s._id}" aria-label="Delete snippet">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </div>
      </div>
      <div class="card-content"><code>${content}</code></div>
      ${tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ''}
      <div class="card-footer">
        <span class="card-date" style="display:flex;align-items:center;gap:4px"><i data-lucide="calendar" style="width:12px;height:12px;"></i> ${date}</span>
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
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE}/snippets/${id}/favorite`, {
            method: 'PATCH',
            headers
        });
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
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE}/snippets/${id}`, {
            method: 'DELETE',
            headers
        });
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
    const folderId = folderSelect.value;
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
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/snippets`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ title, content, tags, folderId }),
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
    searchDebounce = setTimeout(async () => {
        if (searchQuery.trim()) {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const res = await fetch(`${API_BASE}/snippets/search?q=${encodeURIComponent(searchQuery)}`, { headers });
                if (!res.ok) throw new Error();
                const data = await res.json();
                allSnippets = Array.isArray(data) ? data : (data.snippets || []);
                renderSnippets();
            } catch (err) {
                console.error('Search failed:', err);
            }
        } else {
            fetchSnippets();
        }
    }, 300);
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
    let sortBy = 'createdAt';
    let order = 'desc';

    if (sortMode === 'oldest') {
        order = 'asc';
    } else if (sortMode === 'title') {
        sortBy = 'title';
        order = 'asc';
    }

    fetchSnippets(sortBy, order);
});

// ─── Update Featured Snippet ────────────────────────
function updateFeaturedSnippet() {
    if (!featuredPanel || !featuredContent) return;

    // Pick a random favorite snippet, or just a random one if no favorites
    const favorites = allSnippets.filter(s => s.favorite);
    const pool = favorites.length > 0 ? favorites : allSnippets;

    if (pool.length === 0) {
        featuredPanel.style.display = 'none';
        return;
    }

    const snippet = pool[Math.floor(Math.random() * pool.length)];
    featuredPanel.style.display = 'block';

    featuredContent.innerHTML = `
        <div style="margin-bottom: 8px;">
            <p style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${escapeHtml(snippet.title)}</p>
            <div style="font-size: 0.72rem; color: var(--text-muted); display:flex; gap:8px;">
                <span>#${snippet.language}</span>
                <span>${snippet.tags.slice(0, 2).map(t => '#' + t).join(' ')}</span>
            </div>
        </div>
        <div class="card-content" style="max-height: 80px; font-size: 0.7rem; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border);">
            <code>${escapeHtml(snippet.content)}</code>
        </div>
        <button class="btn btn-primary" style="margin-top: 10px; padding: 6px; font-size: 0.75rem;" onclick="copyToClipboard('${escapeHtml(snippet.content).replace(/'/g, "\\'")}')">
            Copy Quick Reference
        </button>
    `;

    if (window.lucide) window.lucide.createIcons();
    if (window.hljs) {
        featuredContent.querySelectorAll('code').forEach(el => hljs.highlightElement(el));
    }
}

// Global copy helper for the featured snippet button
window.copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied reference!', 'copy');
    } catch {
        showToast('Copy failed', 'error');
    }
};

// ─── Auth Logic ──────────────────────────────────────
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        authModal.classList.add('active');
    });
}

if (closeAuthModal) {
    closeAuthModal.addEventListener('click', () => {
        authModal.classList.remove('active');
    });
}

if (authToggleBtn) {
    authToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        authMode = authMode === 'login' ? 'register' : 'login';
        authModalTitle.textContent = authMode === 'login' ? 'Login' : 'Create Account';
        authSubmitBtn.textContent = authMode === 'login' ? 'Login' : 'Sign Up';
        authToggleText.textContent = authMode === 'login' ? "Don't have an account?" : "Already have an account?";
        authToggleBtn.textContent = authMode === 'login' ? "Sign Up" : "Login";
        nameGroup.style.display = authMode === 'register' ? 'block' : 'none';
        if (authMode === 'register') authName.required = true;
        else authName.required = false;
    });
}

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value;
        const password = authPassword.value;
        const name = authName.value;

        const url = authMode === 'login' ? `${API_BASE}/api/v1/auth/login` : `${API_BASE}/api/v1/auth/register`;
        const body = authMode === 'login' ? { email, password } : { name, email, password };

        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = 'Processing...';

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Auth failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showToast(`Welcome back, ${data.user.name}!`, 'success');
            authModal.classList.remove('active');
            authForm.reset();
            checkAuth();
            fetchSnippets(); // Reload snippets with user context
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = authMode === 'login' ? 'Login' : 'Sign Up';
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast('Logged out successfully', 'info');
        checkAuth();
        fetchSnippets(); // Reload snippets to show only public ones
    });
}

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        loginBtn.style.display = 'none';
        userProfile.style.display = 'flex';
        userNameDisplay.textContent = user.name;
        foldersPanel.style.display = 'block';
        fetchFolders();
    } else {
        loginBtn.style.display = 'block';
        userProfile.style.display = 'none';
        foldersPanel.style.display = 'none';
        activeFolderFilter = null;
    }
}

// ─── Folders Logic ──────────────────────────────────
async function fetchFolders() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/v1/folders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        allFolders = await res.json();
        renderFolders();
    } catch (err) {
        console.error('Failed to fetch folders:', err);
    }
}

function renderFolders() {
    // Render Sidebar List
    foldersList.innerHTML = `
        <div class="folder-item ${!activeFolderFilter ? 'active' : ''}" data-id="all">
            <span>All Snippets</span>
        </div>
        ${allFolders.map(f => `
            <div class="folder-item ${activeFolderFilter === f._id ? 'active' : ''}" data-id="${f._id}">
                <span>${escapeHtml(f.name)}</span>
                <div class="folder-actions">
                    <button class="action-btn delete-folder" data-id="${f._id}"><i data-lucide="trash-2" style="width:10px;height:10px"></i></button>
                </div>
            </div>
        `).join('')}
    `;

    // Render Dropdown in Form
    const currentVal = folderSelect.value;
    folderSelect.innerHTML = `
        <option value="">No Folder</option>
        ${allFolders.map(f => `<option value="${f._id}">${escapeHtml(f.name)}</option>`).join('')}
    `;
    folderSelect.value = currentVal;

    if (window.lucide) window.lucide.createIcons();
}

if (addFolderBtn) {
    addFolderBtn.addEventListener('click', () => {
        folderModal.classList.add('active');
        newFolderName.focus();
    });
}

if (closeFolderModal) {
    closeFolderModal.addEventListener('click', () => {
        folderModal.classList.remove('active');
    });
}

if (folderForm) {
    folderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = newFolderName.value.trim();
        if (!name) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/v1/folders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });

            if (!res.ok) throw new Error('Duplicate folder name or server error');

            newFolderName.value = '';
            folderModal.classList.remove('active');
            fetchFolders();
            showToast(`Folder "${name}" created`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

if (foldersList) {
    foldersList.addEventListener('click', async (e) => {
        const delBtn = e.target.closest('.delete-folder');
        if (delBtn) {
            e.stopPropagation();
            if (!confirm('Are you sure? Snippets in this folder will be unassigned.')) return;
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/v1/folders/${delBtn.dataset.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error();
                if (activeFolderFilter === delBtn.dataset.id) activeFolderFilter = null;
                fetchFolders();
                fetchSnippets();
            } catch {
                showToast('Failed to delete folder', 'error');
            }
            return;
        }

        const item = e.target.closest('.folder-item');
        if (item) {
            activeFolderFilter = item.dataset.id === 'all' ? null : item.dataset.id;
            renderFolders();
            fetchSnippets();
        }
    });
}

// ─── Init ────────────────────────────────────────────
checkAuth();
fetchSnippets().then(() => {
    // Small delay to ensure snippets are loaded before picking featured
    setTimeout(updateFeaturedSnippet, 500);
});
