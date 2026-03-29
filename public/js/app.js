import * as api from './api.js';
import * as ui from './ui.js';

// Application state
let state = {
  search: '',
  tag: null,
  favorite: false,
  bookmarks: [],
  tags: [],
  deleteTarget: null,
  pagination: { next_cursor: null, prev_cursor: null, total: 0, page_size: 20 },
  pageOffset: 0,
};

// Debounce helper
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Data fetching
async function loadBookmarks(cursor = null) {
  try {
    const params = {};
    if (state.search) params.search = state.search;
    if (state.tag) params.tag = state.tag;
    if (state.favorite) params.favorite = true;
    if (cursor) params.cursor = cursor;
    if (state.pagination.page_size !== 20) params.page_size = state.pagination.page_size;
    const data = await api.getBookmarks(params);
    state.bookmarks = data.bookmarks;
    state.pagination = data.pagination;
    const isFiltered = !!(state.search || state.tag || state.favorite);
    ui.renderBookmarks(state.bookmarks, {
      onFavorite: handleFavorite,
      onEdit: handleEdit,
      onDelete: handleDeletePrompt,
      onTagClick: handleTagClick,
      isFiltered,
    });
    ui.renderPagination(state.pagination, state.pageOffset, {
      onNext: handleNextPage,
      onPrev: handlePrevPage,
    });
    ui.renderPageSizeSelector(state.pagination.page_size, state.pagination.total, handlePageSizeChange);
  } catch (err) {
    console.error('Failed to load bookmarks:', err);
  }
}

function handleNextPage() {
  if (state.pagination.next_cursor) {
    state.pageOffset += state.pagination.page_size;
    loadBookmarks(state.pagination.next_cursor);
  }
}

function handlePrevPage() {
  if (state.pagination.prev_cursor) {
    state.pageOffset = Math.max(0, state.pageOffset - state.pagination.page_size);
    loadBookmarks(state.pagination.prev_cursor);
  }
}

function handlePageSizeChange(newSize) {
  state.pagination.page_size = newSize;
  resetPagination();
  loadBookmarks();
}

function resetPagination() {
  state.pageOffset = 0;
}

async function loadTags() {
  try {
    const data = await api.getTags();
    state.tags = data.tags;
    ui.renderTags(state.tags, state.tag, handleTagClick);
  } catch (err) {
    console.error('Failed to load tags:', err);
  }
}

async function refresh() {
  await Promise.all([loadBookmarks(), loadTags()]);
}

// Event handlers
async function handleFormSubmit(e) {
  e.preventDefault();
  const formData = ui.getFormData();

  try {
    if (formData.id) {
      await api.updateBookmark(formData.id, {
        url: formData.url,
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
      });
    } else {
      await api.createBookmark({
        url: formData.url,
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
      });
    }
    ui.closeModal();
    await refresh();
  } catch (err) {
    alert(err.message);
  }
}

async function handleFavorite(id) {
  try {
    await api.toggleFavorite(id);
    await refresh();
  } catch (err) {
    console.error('Failed to toggle favorite:', err);
  }
}

async function handleEdit(id) {
  try {
    const data = await api.getBookmark(id);
    ui.openModal(data.bookmark);
  } catch (err) {
    console.error('Failed to load bookmark for editing:', err);
  }
}

function handleDeletePrompt(id) {
  state.deleteTarget = id;
  ui.openDeleteConfirm();
}

async function handleDeleteConfirm() {
  if (!state.deleteTarget) return;
  try {
    await api.deleteBookmark(state.deleteTarget);
    state.deleteTarget = null;
    ui.closeDeleteConfirm();
    await refresh();
  } catch (err) {
    console.error('Failed to delete bookmark:', err);
  }
}

function handleTagClick(tagName) {
  state.tag = state.tag === tagName ? null : tagName;
  resetPagination();
  ui.renderTags(state.tags, state.tag, handleTagClick);
  loadBookmarks();
}

function handleFavoritesFilter() {
  state.favorite = !state.favorite;
  resetPagination();
  ui.setFavoritesFilterActive(state.favorite);
  loadBookmarks();
}

const handleSearch = debounce((value) => {
  state.search = value;
  resetPagination();
  loadBookmarks();
}, 300);

// Auto-fetch title on URL blur
async function handleUrlBlur() {
  const urlField = document.getElementById('bookmark-url');
  const titleField = document.getElementById('bookmark-title-input');
  const url = urlField.value.trim();

  if (url && !titleField.value.trim()) {
    titleField.placeholder = 'Fetching title...';
    try {
      const data = await api.fetchTitle(url);
      if (data.title && !titleField.value.trim()) {
        titleField.value = data.title;
      }
    } catch {
      // Ignore - user can enter title manually
    }
    titleField.placeholder = 'Page title';
  }
}

// Initialize
function init() {
  // Add bookmark button
  document.getElementById('add-bookmark-btn').addEventListener('click', () => ui.openModal());

  // Modal controls
  document.getElementById('cancel-modal').addEventListener('click', ui.closeModal);
  document.getElementById('bookmark-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) ui.closeModal();
  });

  // Form submission
  document.getElementById('bookmark-form').addEventListener('submit', handleFormSubmit);

  // Delete confirmation
  document.getElementById('confirm-delete').addEventListener('click', handleDeleteConfirm);
  document.getElementById('cancel-delete').addEventListener('click', () => {
    state.deleteTarget = null;
    ui.closeDeleteConfirm();
  });
  document.getElementById('delete-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      state.deleteTarget = null;
      ui.closeDeleteConfirm();
    }
  });

  // Search
  document.getElementById('search-input').addEventListener('input', (e) => {
    handleSearch(e.target.value.trim());
  });

  // Favorites filter
  document.getElementById('favorites-filter').addEventListener('click', handleFavoritesFilter);

  // URL blur for title auto-fetch
  document.getElementById('bookmark-url').addEventListener('blur', handleUrlBlur);

  // Initial load
  refresh();
}

init();
