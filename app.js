function formatDate(dateString) {
  // Accepts YYYY-MM-DD or YYYY-MM-DDTHH:MM — always displays date only
  const base = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const date = new Date(base + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function formatDateTime(article) {
  // Shows date + time if publish_date contains a time component
  const datePart = formatDate(article.date || article.publish_date || '');
  if (article.publish_date && article.publish_date.includes('T')) {
    const timePart = article.publish_date.split('T')[1].substring(0, 5);
    return `${datePart}, ${timePart}`;
  }
  return datePart;
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function getReadingTime(html, wordsPerMinute = 220) {
  const text = stripHtml(html);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

function getFirstParagraph(htmlString) {
  const match = htmlString.match(/<p>(.*?)<\/p>/i);
  return match ? match[1] : '';
}

function createTagList(tags = []) {
  return `
    <div class="tag-list">
      ${tags.map(tag => `
        <a class="tag" href="tag.html?tag=${encodeURIComponent(tag)}">${tag}</a>
      `).join('')}
    </div>
  `;
}

function getAuthorById(authorId) {
  if (!window.oaAuthors) return null;
  return window.oaAuthors.find(author => author.id === authorId) || null;
}

function createAuthorLink(article) {
  if (!article.authorId) return `<span>${article.author}</span>`;
  return `<a class="author-link" href="author.html?id=${article.authorId}">${article.author}</a>`;
}

function isAnchor(article) {
  // Cover images are shown only for anchor articles (story-based long-form pieces).
  // Breaking news, found documents, and social-only pieces never render a cover image.
  // Articles with no format field are treated as anchor for backwards compatibility.
  return !article.format || article.format === 'anchor';
}

function articleImageMarkup(article) {
  if (!article.coverImage || !isAnchor(article)) return '';
  return `
    <div class="article-card-image">
      <img src="${article.coverImage}" alt="${article.coverAlt || article.title}">
    </div>
  `;
}

// --- PUBLISH DATE FILTERING ---
// An article is visible if:
// 1. It has no publish_date (legacy support), OR
// 2. Its publish_date is today or in the past
// Articles with status: "draft" are never shown.
function isPublished(article) {
  if (article.status === 'draft') return false;
  if (!article.publish_date) return true;
  // Supports both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM" formats
  const publishAt = new Date(article.publish_date);
  return publishAt <= new Date();
}

function getPublishedArticles() {
  if (!window.oaArticles) return [];
  return window.oaArticles.filter(isPublished);
}
// --- END PUBLISH DATE FILTERING ---

const FORMAT_LABELS = {
  'anchor':               { label: 'Story',              css: 'anchor' },
  'breaking':             { label: 'Breaking',           css: 'breaking' },
  'found-memo':           { label: 'Found: Memo',        css: 'found' },
  'found-press-release':  { label: 'Found: Press Release', css: 'found' },
  'social-only':          { label: 'Social',             css: 'social' }
};

function articleCard(article) {
  const fmtKey = article.format || 'anchor';
  const fmtInfo = FORMAT_LABELS[fmtKey] || null;
  const isAnchorFmt = fmtKey === 'anchor' || !article.format;
  const badgeHtml = fmtInfo
    ? `<span class="sep">·</span><span class="format-badge format-badge--${fmtInfo.css}">${fmtInfo.label}</span>`
    : '';

  return `
    <article class="article-card${isAnchorFmt ? ' article-card--anchor' : ''}">
      ${articleImageMarkup(article)}
      <div class="article-meta">
        <span>${formatDateTime(article)}</span>
        <span class="sep">·</span>
        ${createAuthorLink(article)}
        <span class="sep">·</span>
        <span>${getReadingTime(article.content)} min</span>
        ${badgeHtml}
      </div>
      <h4>${article.title}</h4>
      <p>${article.excerpt}</p>
      ${createTagList(article.tags)}
      <a class="button secondary" href="article.html?id=${article.id}">Read more →</a>
    </article>
  `;
}

function getThemeSuffix() {
  return document.body.classList.contains('light-theme') ? '_light' : '_dark';
}

function updateThemeImages() {
  const suffix = getThemeSuffix();
  document.querySelectorAll('#brandLogo, #mastheadSeal').forEach(el => {
    if (el) {
      const base = el.src.replace(/_dark\.png|_light\.png/, '');
      el.src = base + suffix + '.png';
    }
  });
}

function initThemeToggle() {
  const savedTheme = localStorage.getItem('oa-theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  }

  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('oa-theme', isLight ? 'light' : 'dark');
    updateThemeImages();
  });
}

const featuredSections = [
  {
    title: "Reviewer 2 Watch",
    tag: "Reviewer 2",
    description: "Harsh criticism, procedural menace, and elegant manuscript destruction."
  },
  {
    title: "Rectorial Decrees",
    tag: "Rector",
    description: "Official statements from the highest levels of institutional unreality."
  },
  {
    title: "Astrid Vox Field Reports",
    tag: "Astrid Vox",
    description: "Broadcast coverage from accreditation borders and beyond."
  },
  {
    title: "Student Translation Desk",
    tag: "Clara Quark",
    description: "Complex academic fog translated into understandable human language."
  }
];

function renderFeaturedSections() {
  const el = document.getElementById('featuredSections');
  if (!el) return;

  el.innerHTML = featuredSections.map(section => `
    <a class="section-card" href="tag.html?tag=${encodeURIComponent(section.tag)}">
      <p class="eyebrow">Featured section</p>
      <h4>${section.title}</h4>
      <p>${section.description}</p>
    </a>
  `).join('');
}

function renderHomepage() {
  if (!window.oaArticles || !document.getElementById('articlesList')) return;

  renderFeaturedSections();

  // Sort by publish_date (with time) when available, fallback to date
  const articles = getPublishedArticles().sort((a, b) => {
    const da = a.publish_date || a.date;
    const db = b.publish_date || b.date;
    return db.localeCompare(da);
  });
  const listEl = document.getElementById('articlesList');
  const featuredEl = document.getElementById('featuredArticle');
  const tagFilter = document.getElementById('tagFilter');
  const searchInput = document.getElementById('searchInput');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const resultsCount = document.getElementById('resultsCount');
  const clearButton = document.getElementById('clearFilters');

  let visibleCount = 10;

  if (tagFilter && tagFilter.options.length === 1) {
    const allTags = [...new Set(articles.flatMap(article => article.tags))].sort();
    allTags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = tag;
      tagFilter.appendChild(option);
    });
  }

  function getFilteredArticles() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const from = startDate.value;
    const to = endDate.value;
    const selectedTag = tagFilter.value;

    return articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm);
      const matchesTag = !selectedTag || article.tags.includes(selectedTag);
      const matchesFrom = !from || article.date >= from;
      const matchesTo = !to || article.date <= to;
      return matchesSearch && matchesTag && matchesFrom && matchesTo;
    });
  }

  function renderVisibleArticles() {
    const filtered = getFilteredArticles();

    resultsCount.textContent = `${filtered.length} article${filtered.length === 1 ? '' : 's'} found`;

    // Always pin the most recent anchor article as "This week's story" (ignores active filters).
    // Articles without a format field are treated as anchor for backwards compatibility.
    const anchorArticle = articles.find(a => a.format === 'anchor' || !a.format);

    if (anchorArticle) {
      featuredEl.innerHTML = `
        <article class="featured-card featured-card--anchor">
          <div class="featured-card-body">
            <div>
              <p class="featured-label">This week\u2019s story</p>
              <div class="article-meta">
                <span>${formatDateTime(anchorArticle)}</span>
                <span class="sep">\u00b7</span>
                ${createAuthorLink(anchorArticle)}
                <span class="sep">\u00b7</span>
                <span>${getReadingTime(anchorArticle.content)} min</span>
              </div>
              <h4>${anchorArticle.title}</h4>
              <p>${anchorArticle.excerpt}</p>
              ${createTagList(anchorArticle.tags)}
            </div>
            <a class="button primary" href="article.html?id=${anchorArticle.id}">Continue reading \u2192</a>
          </div>
          <aside class="featured-side">
            ${anchorArticle.coverImage ? `
              <div class="featured-image">
                <img src="${anchorArticle.coverImage}" alt="${anchorArticle.coverAlt || anchorArticle.title}">
              </div>
            ` : '<div class="featured-anchor-bg"></div>'}
          </aside>
        </article>
      `;
    } else {
      featuredEl.innerHTML = '';
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No articles match the current filters. Try broadening the date range or removing the selected tag.</div>`;
      return;
    }

    // All filtered articles go into the grid (anchor article also appears here for searchability)
    const visibleArticles = filtered.slice(0, visibleCount);
    const hasMore = filtered.length > visibleCount;

    let html = visibleArticles.map(articleCard).join('');

    if (hasMore) {
      html += `
        <div class="load-more-wrap">
          <button class="button secondary" id="loadMoreBtn">Load more articles</button>
        </div>
      `;
    }

    listEl.innerHTML = html;

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        visibleCount += 10;
        renderVisibleArticles();
      });
    }
  }

  renderVisibleArticles();

  [searchInput, tagFilter, startDate, endDate].forEach(el => {
    if (el) el.addEventListener('input', () => {
      visibleCount = 10;
      renderVisibleArticles();
    });
  });

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      searchInput.value = '';
      tagFilter.value = '';
      startDate.value = '';
      endDate.value = '';
      visibleCount = 10;
      renderVisibleArticles();
    });
  }
}

function renderCharactersSection() {
  const grid = document.getElementById('charactersGrid');
  if (!grid || !window.oaCharacters) return;

  grid.innerHTML = window.oaCharacters.map(character => `
      <article class="character-card">
        ${character.image ? `
          <a href="author.html?id=${character.id}" class="character-card-image">
            <img src="${character.image}.png"
                 alt="${character.name}" loading="lazy">
          </a>
        ` : ''}
        <div class="character-card-body">
          <span class="character-role">${character.role}</span>
          <h4><a class="character-name-link" href="author.html?id=${character.id}">${character.name}</a></h4>
          <p>${character.description}</p>
          <a class="button ghost character-btn" href="author.html?id=${character.id}">Profile →</a>
        </div>
      </article>
    `).join('');
}

function getRelatedArticles(currentArticle, articles, limit = 3) {
  return articles
    .filter(article => article.id !== currentArticle.id)
    .map(article => {
      const sharedTags = article.tags.filter(tag => currentArticle.tags.includes(tag)).length;
      const sameAuthor = article.authorId && article.authorId === currentArticle.authorId ? 1 : 0;
      const score = sharedTags * 10 + sameAuthor * 3;
      return { article, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || b.article.date.localeCompare(a.article.date))
    .slice(0, limit)
    .map(item => item.article);
}

function renderArticlePage() {
  if (!document.getElementById('articleContent') || !window.oaArticles) return;

  const params = new URLSearchParams(window.location.search);
  const articleId = params.get('id');

  // Only allow access to published articles
  const published = getPublishedArticles();
  const article = published.find(item => item.id === articleId);

  if (!article) {
    document.getElementById('articleContent').innerHTML = `
      <a href="index.html#latest" class="back-link">\u2190 Back to news</a>
      <div class="article-header">
        <p class="eyebrow">Article not found</p>
        <h2>This document has not been located in the institutional archive.</h2>
      </div>
      <div class="article-body">
        <p>The requested article does not exist, has not yet been published, or has been reclassified under a documentation category that does not permit public access.</p>
        <p>Please return to the <a href="index.html#latest">news archive</a> and try again.</p>
      </div>`;
    return;
  }

  const articleEl = document.getElementById('articleContent');

  document.title = `${article.title} | The Office of Alternate Academia`;

  articleEl.innerHTML = `
    <a href="index.html#latest" class="back-link">← Back to news</a>
    <div class="article-header">
      <p class="eyebrow">Full report</p>
      <div class="article-meta">
        <span>${formatDateTime(article)}</span>
        <span class="sep">·</span>
        ${createAuthorLink(article)}
        <span class="sep">·</span>
        <span>${getReadingTime(article.content)} min</span>
      </div>
      <h2>${article.title}</h2>
      ${createTagList(article.tags)}

      <div class="article-share-row">
        <div class="share-wrap">
          <button id="shareBtn" class="button ghost share-btn" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share
          </button>
          <div class="share-dropdown" id="shareDropdown" hidden>
            <a class="share-option" id="shareFacebook" target="_blank" rel="noopener noreferrer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              Facebook
            </a>
            <a class="share-option" id="shareX" target="_blank" rel="noopener noreferrer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X
            </a>
            <a class="share-option" id="shareWhatsApp" target="_blank" rel="noopener noreferrer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <button class="share-option" id="shareCopyLink" type="button">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span id="copyLinkLabel">Copy link</span>
            </button>
          </div>
        </div>
      </div>

      ${article.coverImage && isAnchor(article) ? `
        <div class="article-cover">
          <img src="${article.coverImage}" alt="${article.coverAlt || article.title}">
          ${article.coverAlt ? `<div class="article-cover-caption">${article.coverAlt}</div>` : ''}
        </div>
      ` : ''}
    </div>
    <div class="article-body">${article.content}</div>
  `;

  const relatedEl = document.getElementById('relatedArticles');
  if (relatedEl) {
    const related = getRelatedArticles(article, published);

    relatedEl.innerHTML = related.length
      ? related.map(articleCard).join('')
      : `<div class="empty-state">No closely related articles were found yet.</div>`;
  }

  initArticleShare();
}

function renderAuthorPage() {
  if (!document.getElementById('authorProfile') || !window.oaAuthors || !window.oaArticles) return;

  const params = new URLSearchParams(window.location.search);
  const authorId = params.get('id');
  const author = window.oaAuthors.find(item => item.id === authorId) || window.oaAuthors[0];

  const profileEl = document.getElementById('authorProfile');
  const authorArticlesEl = document.getElementById('authorArticles');

  document.title = `${author.name} | The Office of Alternate Academia`;

  const bioHtml = (author.bio || '').split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('');

  profileEl.innerHTML = `
    <div class="author-card">
      <div class="author-image-wrap">
        <img class="author-portrait-img"
             src="${author.image}.png"
             alt="${author.imageAlt || author.name}">
      </div>
      <div class="author-bio">
        <a href="index.html#characters" class="back-link">← Back to characters</a>
        <p class="eyebrow">Character profile</p>
        <h2>${author.name}</h2>
        <p class="character-role">${author.role}</p>
        ${createTagList(author.tags || [])}
        <div class="author-bio-text">${bioHtml}</div>
      </div>
    </div>
  `;

  // Only show published articles on author pages too
  const authoredArticles = getPublishedArticles()
    .filter(article => article.authorId === author.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  authorArticlesEl.innerHTML = authoredArticles.length
    ? authoredArticles.map(articleCard).join('')
    : `<div class="empty-state">No published articles are currently assigned to this author.</div>`;
}

function renderTagPage() {
  const listEl = document.getElementById('tagArchiveList');
  const headerEl = document.getElementById('tagArchiveHeader');
  if (!listEl || !window.oaArticles) return;

  const params = new URLSearchParams(window.location.search);
  const tag = params.get('tag') || '';

  // Only show published articles in tag archive
  const matching = getPublishedArticles()
    .filter(article => article.tags.includes(tag))
    .sort((a, b) => b.date.localeCompare(a.date));

  document.title = `${tag} | Tag Archive | The Office of Alternate Academia`;

  headerEl.innerHTML = `
    <div class="section-heading-left">
      <div class="section-rule"></div>
      <h3>${tag}</h3>
    </div>
    <p class="section-note">${matching.length} article${matching.length === 1 ? '' : 's'} filed under this tag.</p>
  `;

  listEl.innerHTML = matching.length
    ? matching.map(articleCard).join('')
    : `<div class="empty-state">No articles found for this tag.</div>`;
}

function renderMediaPage() {
  const grid = document.getElementById('mediaGrid');
  if (!grid || !window.oaMedia) return;

  if (window.oaMedia.length === 0) {
    grid.innerHTML = `<div class="empty-state">No broadcasts have been cleared for public release at this time. The audiovisual division is aware of the situation.</div>`;
    return;
  }

  grid.innerHTML = window.oaMedia.map(item => `
    <article class="media-card">
      <div class="responsive-embed ${item.type === 'short' ? 'portrait-embed' : ''}">
        <iframe
          src="${item.embedUrl}"
          title="${item.title}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      </div>
      <div class="article-meta" style="margin-top: 12px;">
        <span>${formatDate(item.date)}</span>
        <span>•</span>
        <span>${item.category}</span>
      </div>
      <h4>${item.title}</h4>
      <p>${item.description}</p>
    </article>
  `).join('');
}

function initArticleShare() {
  const shareBtn = document.getElementById('shareBtn');
  if (!shareBtn) return;

  const url = window.location.href;
  const title = document.title;

  // Use native share sheet only on genuine touch/mobile devices.
  // navigator.share exists in some desktop browsers (Opera GX, Edge) but
  // the desktop experience is poor — use the dropdown there instead.
  const isMobile = navigator.share && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  if (isMobile) {
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.share({ title, url });
      } catch (e) {
        // User cancelled or share failed — silent
      }
    });
    return;
  }

  // Desktop: toggle dropdown
  const dropdown = document.getElementById('shareDropdown');
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  document.getElementById('shareFacebook').href =
    `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
  document.getElementById('shareX').href =
    `https://x.com/intent/tweet?url=${encoded}&text=${encodedTitle}`;
  document.getElementById('shareWhatsApp').href =
    `https://wa.me/?text=${encodedTitle}%20${encoded}`;

  shareBtn.addEventListener('click', () => {
    const opening = dropdown.hidden;
    dropdown.hidden = !opening;
    shareBtn.classList.toggle('active', opening);

    if (opening) {
      requestAnimationFrame(() => {
        function onOutsideClick(e) {
          if (!dropdown.contains(e.target) && e.target !== shareBtn) {
            dropdown.hidden = true;
            shareBtn.classList.remove('active');
            document.removeEventListener('click', onOutsideClick);
          }
        }
        document.addEventListener('click', onOutsideClick);
      });
    }
  });

  document.getElementById('shareCopyLink').addEventListener('click', async () => {
    const label = document.getElementById('copyLinkLabel');
    try {
      await navigator.clipboard.writeText(url);
      label.textContent = 'Link copied!';
      setTimeout(() => { label.textContent = 'Copy link'; }, 1600);
    } catch {
      label.textContent = 'Copy failed';
      setTimeout(() => { label.textContent = 'Copy link'; }, 1600);
    }
  });
}

function initReadingProgress() {
  const bar = document.getElementById('readingProgressBar');
  const article = document.querySelector('.article-page');
  if (!bar || !article) return;

  function updateProgress() {
    const rect = article.getBoundingClientRect();
    const articleTop = window.scrollY + rect.top;
    const articleHeight = article.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const progress = ((scrollTop - articleTop) / (articleHeight - viewportHeight)) * 100;
    const clamped = Math.max(0, Math.min(100, progress));
    bar.style.width = `${clamped}%`;
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();

  // Masthead date (index.html only)
  const mastheadDate = document.getElementById('mastheadDate');
  if (mastheadDate) {
    const d = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    mastheadDate.textContent = d.toLocaleDateString('en-US', opts).toUpperCase() + ' \u2014 VOL. I';
  }

  renderHomepage();
  renderCharactersSection();
  renderArticlePage();
  renderAuthorPage();
  renderTagPage();
  renderMediaPage();
  initReadingProgress();
});