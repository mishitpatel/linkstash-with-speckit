// DOM manipulation and rendering functions

export function renderBookmarks(bookmarks, { onFavorite, onEdit, onDelete, onTagClick, isFiltered }) {
  const container = document.getElementById('bookmark-list');
  container.innerHTML = '';

  if (bookmarks.length === 0) {
    const message = isFiltered
      ? 'No bookmarks found.'
      : 'No bookmarks yet. Click Add Bookmark to save your first link!';
    container.innerHTML = `
      <div class="empty-state">
        <p>${message}</p>
      </div>
    `;
    return;
  }

  for (const bookmark of bookmarks) {
    const card = document.createElement('div');
    card.className = 'bookmark-card';
    card.dataset.id = bookmark.id;

    const truncatedUrl = bookmark.url.length > 60
      ? bookmark.url.substring(0, 60) + '...'
      : bookmark.url;

    const tagsHtml = bookmark.tags
      .map(t => `<span class="tag" data-tag="${t}">${t}</span>`)
      .join('');

    const date = new Date(bookmark.created_at).toLocaleDateString();

    card.innerHTML = `
      <div class="bookmark-header">
        <button class="favorite-btn ${bookmark.is_favorite ? 'is-favorite' : ''}"
                data-action="favorite" data-id="${bookmark.id}"
                title="Toggle favorite">
          ${bookmark.is_favorite ? '&#9733;' : '&#9734;'}
        </button>
        <div class="bookmark-info">
          <div class="bookmark-title">
            <a href="${bookmark.url}" target="_blank" rel="noopener">${escapeHtml(bookmark.title)}</a>
          </div>
          <div class="bookmark-url">${escapeHtml(truncatedUrl)}</div>
          ${bookmark.description ? `<div class="bookmark-description">${escapeHtml(bookmark.description)}</div>` : ''}
        </div>
      </div>
      <div class="bookmark-meta">
        ${tagsHtml}
        <span class="bookmark-date">${date}</span>
        <div class="bookmark-actions">
          <button class="btn btn-ghost" data-action="edit" data-id="${bookmark.id}" title="Edit">&#9998;</button>
          <button class="btn btn-ghost" data-action="delete" data-id="${bookmark.id}" title="Delete">&#128465;</button>
        </div>
      </div>
    `;

    // Event delegation within card
    card.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (target) {
        const action = target.dataset.action;
        const id = Number(target.dataset.id);
        if (action === 'favorite') onFavorite(id);
        else if (action === 'edit') onEdit(id);
        else if (action === 'delete') onDelete(id);
        return;
      }
      const tagEl = e.target.closest('.tag');
      if (tagEl) {
        onTagClick(tagEl.dataset.tag);
      }
    });

    container.appendChild(card);
  }
}

export function renderTags(tags, activeTag, onTagClick) {
  const list = document.getElementById('tag-list');
  list.innerHTML = '';

  if (tags.length === 0) {
    list.innerHTML = '<li style="color: var(--text-muted); font-size: 0.85rem;">No tags yet</li>';
    return;
  }

  for (const tag of tags) {
    const li = document.createElement('li');
    li.className = tag.name === activeTag ? 'active' : '';
    li.innerHTML = `<span>${escapeHtml(tag.name)}</span><span class="tag-count">${tag.count}</span>`;
    li.addEventListener('click', () => onTagClick(tag.name));
    list.appendChild(li);
  }
}

export function openModal(bookmark) {
  const modal = document.getElementById('bookmark-modal');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('bookmark-form');
  const idField = document.getElementById('bookmark-id');
  const urlField = document.getElementById('bookmark-url');
  const titleField = document.getElementById('bookmark-title-input');
  const descField = document.getElementById('bookmark-description');
  const tagsField = document.getElementById('bookmark-tags');

  form.reset();

  if (bookmark) {
    title.textContent = 'Edit Bookmark';
    idField.value = bookmark.id;
    urlField.value = bookmark.url;
    titleField.value = bookmark.title;
    descField.value = bookmark.description || '';
    tagsField.value = bookmark.tags.join(', ');
  } else {
    title.textContent = 'Add Bookmark';
    idField.value = '';
  }

  modal.classList.add('open');
  urlField.focus();
}

export function closeModal() {
  document.getElementById('bookmark-modal').classList.remove('open');
}

export function openDeleteConfirm() {
  document.getElementById('delete-modal').classList.add('open');
}

export function closeDeleteConfirm() {
  document.getElementById('delete-modal').classList.remove('open');
}

export function getFormData() {
  const id = document.getElementById('bookmark-id').value;
  const url = document.getElementById('bookmark-url').value;
  const title = document.getElementById('bookmark-title-input').value;
  const description = document.getElementById('bookmark-description').value;
  const tagsRaw = document.getElementById('bookmark-tags').value;
  const tags = tagsRaw
    ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return { id: id ? Number(id) : null, url, title, description, tags };
}

export function renderPagination(pagination, pageOffset, { onNext, onPrev }) {
  let bar = document.getElementById('pagination-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'pagination-bar';
    bar.className = 'pagination-bar';
    document.getElementById('bookmark-list').after(bar);
  }

  if (pagination.total <= pagination.page_size) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = '';

  const start = pageOffset + 1;
  const end = Math.min(pageOffset + pagination.page_size, pagination.total);

  bar.innerHTML = `
    <button class="btn btn-ghost pagination-btn" id="prev-page" ${pagination.prev_cursor ? '' : 'disabled'}>&#8592; Previous</button>
    <span class="pagination-info">Showing ${start}\u2013${end} of ${pagination.total}</span>
    <button class="btn btn-ghost pagination-btn" id="next-page" ${pagination.next_cursor ? '' : 'disabled'}>Next &#8594;</button>
  `;

  bar.querySelector('#prev-page').addEventListener('click', onPrev);
  bar.querySelector('#next-page').addEventListener('click', onNext);
}

export function renderPageSizeSelector(currentSize, total, onChange) {
  let selector = document.getElementById('page-size-selector');
  if (!selector) {
    selector = document.createElement('div');
    selector.id = 'page-size-selector';
    selector.className = 'page-size-selector';
    const bar = document.getElementById('pagination-bar');
    if (bar) bar.after(selector);
  }

  if (total <= currentSize && total <= 10) {
    selector.style.display = 'none';
    return;
  }
  selector.style.display = '';

  selector.innerHTML = `
    <label for="page-size-select">Per page:</label>
    <select id="page-size-select">
      ${[10, 20, 50, 100].map(n => `<option value="${n}" ${n === currentSize ? 'selected' : ''}>${n}</option>`).join('')}
    </select>
  `;

  selector.querySelector('#page-size-select').addEventListener('change', (e) => {
    onChange(Number(e.target.value));
  });
}

export function setFavoritesFilterActive(active) {
  const btn = document.getElementById('favorites-filter');
  btn.classList.toggle('active', active);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
