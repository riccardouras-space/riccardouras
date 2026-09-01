// ==== Language ====
const LANG_KEY = 'site_lang';
const LANGS = ['en', 'it', 'fr', 'de'];
function getLang() {
  const saved = localStorage.getItem(LANG_KEY);
  return LANGS.includes(saved) ? saved : 'en';
}
function setLang(lang) { localStorage.setItem(LANG_KEY, lang); applyLang(lang); }

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to load ' + path);
  return res.json();
}

let STRINGS_CACHE = null;
async function getStrings() {
  if (!STRINGS_CACHE) STRINGS_CACHE = await fetchJSON('data/strings.json');
  return STRINGS_CACHE;
}

let RESEARCH_CACHE = null;
async function getResearch() {
  if (!RESEARCH_CACHE) RESEARCH_CACHE = sortByDateDesc(await fetchJSON('data/research.json'));
  return RESEARCH_CACHE;
}

let EDUCATIONAL_CACHE = null;
async function getEducational() {
  if (!EDUCATIONAL_CACHE) EDUCATIONAL_CACHE = await fetchJSON('data/educational.json');
  return EDUCATIONAL_CACHE;
}

function formatDate(dateStr, lang) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const localeMap = { en: 'en-GB', it: 'it-IT', fr: 'fr-FR', de: 'de-DE' };
  return d.toLocaleDateString(localeMap[lang] || 'en-GB', { year: 'numeric', month: 'long' });
}

function sortByDateDesc(arr) {
  return [...arr].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ==== Master render / language apply ====
async function applyLang(lang) {
  document.documentElement.lang = lang;
  const strings = await getStrings();
  const dict = strings[lang] || strings.en;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  if (document.getElementById('latest-research')) {
    await renderHomeContent(lang, dict);
  }

  if (document.getElementById('all-research')) {
    await renderResearchPage(lang, dict);
    if (CURRENT_ARTICLE_ID) await showArticle(CURRENT_ARTICLE_ID, lang, dict, false);
  }

  if (document.getElementById('educational-tree')) {
    await renderEducationalPage(lang, dict);
    if (CURRENT_EDU_ENTRY) await showEduEntry(CURRENT_EDU_ENTRY.categoryId, CURRENT_EDU_ENTRY.entryId, lang, dict, false);
  }
}

function initLangSwitch() {
  document.querySelectorAll('.lang-switch').forEach(switcher => {
    switcher.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
  });
}

// ==== Research: list + article cards ====
function researchItemHTML(r, lang, dict) {
  const title = r.title[lang] || r.title.en;
  const summary = r.summary[lang] || r.summary.en;
  const tags = (r.tags || []).map(t => '<span class="tag">' + t + '</span>').join('');
  return (
    '<div class="research-item" data-tags="' + (r.tags || []).join(',').toLowerCase() + '" data-article-id="' + r.id + '">' +
      '<h3>' + title + '</h3>' +
      '<div class="meta">' + formatDate(r.date, lang) + '</div>' +
      '<p>' + summary + '</p>' +
      '<div class="tag-row">' + tags + '</div>' +
      '<span class="card-link">' + dict.read_article + '</span>' +
    '</div>'
  );
}

async function renderHomeContent(lang, dict) {
  try {
    const research = await getResearch();
    const latest = research.slice(0, 3);
    const container = document.getElementById('latest-research');
    container.innerHTML = latest.map(function(r) { return researchItemHTML(r, lang, dict); }).join('') || ('<p>' + dict.no_research + '</p>');
    container.querySelectorAll('.research-item').forEach(function(item) {
      item.addEventListener('click', function() {
        window.location.href = 'research.html#' + item.dataset.articleId;
      });
    });
  } catch (e) { console.error(e); }
}

async function renderResearchPage(lang, dict) {
  try {
    const research = await getResearch();
    const container = document.getElementById('all-research');
    container.innerHTML = research.map(function(r) { return researchItemHTML(r, lang, dict); }).join('') || ('<p>' + dict.no_research + '</p>');

    container.querySelectorAll('.research-item').forEach(function(item) {
      item.addEventListener('click', function() {
        showArticle(item.dataset.articleId, getLang(), dict, true);
      });
    });

    const allTags = Array.from(new Set(research.flatMap(function(r) { return r.tags || []; }))).sort();
    renderFilters('tag-filters-research', allTags, dict, function(tag) { filterCards(container, '.research-item', tag); });
  } catch (e) { console.error(e); }
}

function renderFilters(containerId, tags, dict, onSelect) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const allLabel = dict.filter_all;
  const buttons = [allLabel].concat(tags).map(function(tag) {
    return '<button class="filter-btn' + (tag === allLabel ? ' active' : '') + '" data-tag="' + tag + '">' + tag + '</button>';
  }).join('');
  el.innerHTML = buttons;
  el.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      el.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      onSelect(btn.dataset.tag === allLabel ? '__ALL__' : btn.dataset.tag);
    });
  });
}

function filterCards(container, selector, tag) {
  container.querySelectorAll(selector).forEach(function(card) {
    if (tag === '__ALL__') { card.style.display = ''; return; }
    const tags = (card.dataset.tags || '').split(',');
    card.style.display = tags.includes(tag.toLowerCase()) ? '' : 'none';
  });
}

// ==== Research: in-page article detail ====
let CURRENT_ARTICLE_ID = null;

async function showArticle(id, lang, dict, scrollToTop) {
  const research = await getResearch();
  const article = research.find(function(r) { return r.id === id; });
  if (!article) return;

  CURRENT_ARTICLE_ID = id;
  document.getElementById('research-list-view').classList.add('hidden');
  document.getElementById('article-view').classList.add('visible');

  const title = article.title[lang] || article.title.en;
  const body = article.body[lang] || article.body.en;
  const tags = (article.tags || []).map(function(t) { return '<span class="tag">' + t + '</span>'; }).join('');

  document.getElementById('article-reading-title').textContent = title;
  document.getElementById('article-content').innerHTML =
    '<h1>' + title + '</h1>' +
    '<div class="meta">' + formatDate(article.date, lang) + '</div>' +
    '<div class="tag-row">' + tags + '</div>' +
    '<p>' + body + '</p>';

  if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeArticle() {
  CURRENT_ARTICLE_ID = null;
  document.getElementById('article-view').classList.remove('visible');
  document.getElementById('research-list-view').classList.remove('hidden');
  history.replaceState(null, '', window.location.pathname);
}

// ==== Educational: tree + entry detail ====
function renderEducationalTree(data, lang, dict) {
  const container = document.getElementById('educational-tree');
  container.innerHTML = data.categories.map(function(cat) {
    const catName = cat.name[lang] || cat.name.en;
    const entries = cat.entries.map(function(entry) {
      const entryTitle = entry.title[lang] || entry.title.en;
      return '<div class="tree-entry" data-cat="' + cat.id + '" data-entry="' + entry.id + '">' + entryTitle + '</div>';
    }).join('');
    return (
      '<div class="tree-category" data-cat-id="' + cat.id + '">' +
        '<div class="tree-category-header">' +
          '<h3>' + catName + '</h3>' +
          '<span class="tree-category-count">' + cat.entries.length + ' &nbsp;<span class="tree-chevron">&#9656;</span></span>' +
        '</div>' +
        '<div class="tree-entries">' + entries + '</div>' +
      '</div>'
    );
  }).join('');

  container.querySelectorAll('.tree-category-header').forEach(function(header) {
    header.addEventListener('click', function() {
      header.closest('.tree-category').classList.toggle('expanded');
    });
  });

  container.querySelectorAll('.tree-entry').forEach(function(entryEl) {
    entryEl.addEventListener('click', function(e) {
      e.stopPropagation();
      showEduEntry(entryEl.dataset.cat, entryEl.dataset.entry, getLang(), null, true);
    });
  });
}

async function renderEducationalPage(lang, dict) {
  try {
    const data = await getEducational();
    renderEducationalTree(data, lang, dict);
  } catch (e) { console.error(e); }
}

let CURRENT_EDU_ENTRY = null;

async function showEduEntry(categoryId, entryId, lang, dict, scrollToTop) {
  const strings = await getStrings();
  const d = dict || strings[lang] || strings.en;
  const data = await getEducational();
  const category = data.categories.find(function(c) { return c.id === categoryId; });
  if (!category) return;
  const entry = category.entries.find(function(e) { return e.id === entryId; });
  if (!entry) return;

  CURRENT_EDU_ENTRY = { categoryId: categoryId, entryId: entryId };
  document.getElementById('educational-list-view').classList.add('hidden');
  document.getElementById('educational-entry-view').classList.add('visible');

  const catName = category.name[lang] || category.name.en;
  const entryTitle = entry.title[lang] || entry.title.en;
  const entryBody = entry.body[lang] || entry.body.en;

  document.getElementById('edu-breadcrumb').innerHTML =
    d.nav_educational + ' &rsaquo; ' + catName + ' &rsaquo; <strong>' + entryTitle + '</strong>';

  document.getElementById('educational-entry-content').innerHTML =
    '<span class="draft-badge">' + d.draft_badge + '</span>' +
    '<h1>' + entryTitle + '</h1>' +
    '<p>' + entryBody + '</p>';

  if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeEduEntry() {
  CURRENT_EDU_ENTRY = null;
  document.getElementById('educational-entry-view').classList.remove('visible');
  document.getElementById('educational-list-view').classList.remove('hidden');
  history.replaceState(null, '', window.location.pathname);
}

// ==== Deep linking + init ====
function initDetailViews() {
  const backArticle = document.getElementById('back-to-list-link');
  if (backArticle) backArticle.addEventListener('click', closeArticle);

  const backEdu = document.getElementById('back-to-educational-link');
  if (backEdu) backEdu.addEventListener('click', closeEduEntry);

  if (document.getElementById('all-research') && window.location.hash) {
    const id = window.location.hash.replace('#', '');
    getStrings().then(function(strings) {
      const lang = getLang();
      showArticle(id, lang, strings[lang] || strings.en, false);
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  initLangSwitch();
  applyLang(getLang()).then(function() { initDetailViews(); });
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
