// ==== Language ====
var LANG_KEY = 'site_lang';
var LANGS = ['en', 'it', 'fr', 'de'];
function getLang() {
  var saved = localStorage.getItem(LANG_KEY);
  return LANGS.indexOf(saved) !== -1 ? saved : 'en';
}
function setLang(lang) { localStorage.setItem(LANG_KEY, lang); applyLang(lang); }

function fetchJSON(path) {
  return fetch(path).then(function(res) {
    if (!res.ok) throw new Error('Failed to load ' + path);
    return res.json();
  });
}

var STRINGS_CACHE = null;
function getStrings() {
  if (STRINGS_CACHE) return Promise.resolve(STRINGS_CACHE);
  return fetchJSON('data/strings.json').then(function(data) { STRINGS_CACHE = data; return data; });
}

var RESEARCH_CACHE = null;
function getResearch() {
  if (RESEARCH_CACHE) return Promise.resolve(RESEARCH_CACHE);
  return fetchJSON('data/research.json').then(function(data) { RESEARCH_CACHE = sortByDateDesc(data); return RESEARCH_CACHE; });
}

var EDUCATIONAL_CACHE = null;
function getEducational() {
  if (EDUCATIONAL_CACHE) return Promise.resolve(EDUCATIONAL_CACHE);
  return fetchJSON('data/educational.json').then(function(data) { EDUCATIONAL_CACHE = data; return data; });
}

function formatDate(dateStr, lang) {
  var d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  var localeMap = { en: 'en-GB', it: 'it-IT', fr: 'fr-FR', de: 'de-DE' };
  return d.toLocaleDateString(localeMap[lang] || 'en-GB', { year: 'numeric', month: 'long' });
}

function sortByDateDesc(arr) {
  return arr.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
}

function applyLang(lang) {
  document.documentElement.lang = lang;
  return getStrings().then(function(strings) {
    var dict = strings[lang] || strings.en;

    var i18nEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < i18nEls.length; i++) {
      var key = i18nEls[i].getAttribute('data-i18n');
      if (dict[key] !== undefined) i18nEls[i].textContent = dict[key];
    }

    var langBtns = document.querySelectorAll('.lang-switch button');
    for (var j = 0; j < langBtns.length; j++) {
      if (langBtns[j].dataset.lang === lang) { langBtns[j].classList.add('active'); }
      else { langBtns[j].classList.remove('active'); }
    }

    var tasks = [];
    if (document.getElementById('latest-research')) tasks.push(renderHomeContent(lang, dict));
    if (document.getElementById('research-grid')) {
      tasks.push(renderResearchPage(lang, dict).then(function() {
        if (CURRENT_ARTICLE_ID) return showArticle(CURRENT_ARTICLE_ID, lang, dict, false);
      }));
    }
    if (document.getElementById('educational-tree')) {
      tasks.push(renderEducationalPage(lang, dict).then(function() {
        if (CURRENT_EDU_ENTRY) return showEduEntry(CURRENT_EDU_ENTRY.categoryId, CURRENT_EDU_ENTRY.entryId, lang, dict, false);
      }));
    }
    return Promise.all(tasks);
  });
}

function initLangSwitch() {
  var switchers = document.querySelectorAll('.lang-switch');
  for (var i = 0; i < switchers.length; i++) {
    var buttons = switchers[i].querySelectorAll('button');
    for (var j = 0; j < buttons.length; j++) {
      (function(btn) { btn.addEventListener('click', function() { setLang(btn.dataset.lang); }); })(buttons[j]);
    }
  }
}

var PLACEHOLDER_GRADIENTS = [
  'linear-gradient(135deg, #0f5b78, #1a8fa8)',
  'linear-gradient(135deg, #7a4f9e, #b06fc9)',
  'linear-gradient(135deg, #1c7a5e, #35b389)',
  'linear-gradient(135deg, #a8622a, #d99552)',
  'linear-gradient(135deg, #444d5e, #6b7688)'
];

function hashString(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function articleCardHTML(r, lang, dict) {
  var title = r.title[lang] || r.title.en;
  var summary = r.summary[lang] || r.summary.en;
  var tags = (r.tags || []).map(function(t) { return '<span class="tag">' + t + '</span>'; }).join('');
  var imageBlock;
  if (r.image) {
    imageBlock = '<div class="article-card-image" style="background-image:url(\'' + r.image + '\');"></div>';
  } else {
    var gradient = PLACEHOLDER_GRADIENTS[hashString(r.id) % PLACEHOLDER_GRADIENTS.length];
    var initial = title.charAt(0).toUpperCase();
    imageBlock = '<div class="article-card-image article-card-placeholder" style="background-image:' + gradient + ';"><span class="placeholder-initial">' + initial + '</span></div>';
  }
  return (
    '<div class="article-card" data-tags="' + (r.tags || []).join(',').toLowerCase() + '" data-article-id="' + r.id + '">' +
      imageBlock +
      '<div class="article-card-body">' +
        '<div class="meta">' + formatDate(r.date, lang) + '</div>' +
        '<h3>' + title + '</h3>' +
        '<p>' + summary + '</p>' +
        '<div class="tag-row">' + tags + '</div>' +
      '</div>' +
    '</div>'
  );
}

function attachCardHandlers(container, dict) {
  var cards = container.querySelectorAll('.article-card');
  for (var i = 0; i < cards.length; i++) {
    (function(card) {
      card.addEventListener('click', function() { showArticle(card.dataset.articleId, getLang(), dict, true); });
    })(cards[i]);
  }
}

function renderHomeContent(lang, dict) {
  return getResearch().then(function(research) {
    var latest = research.slice(0, 4);
    var container = document.getElementById('latest-research');
    container.innerHTML = latest.map(function(r) { return articleCardHTML(r, lang, dict); }).join('') || ('<p>' + dict.no_research + '</p>');
    var cards = container.querySelectorAll('.article-card');
    for (var i = 0; i < cards.length; i++) {
      (function(card) {
        card.addEventListener('click', function() { window.location.href = 'research.html#' + card.dataset.articleId; });
      })(cards[i]);
    }
  });
}

var RESEARCH_PAGE_STATE = { allItems: [], filteredItems: [], loadedCount: 0, batchSize: 8, activeTag: '__ALL__' };
var scrollObserver = null;

function renderResearchPage(lang, dict) {
  return getResearch().then(function(research) {
    RESEARCH_PAGE_STATE.allItems = research;
    RESEARCH_PAGE_STATE.filteredItems = research;
    RESEARCH_PAGE_STATE.loadedCount = 0;

    var allTags = [];
    for (var i = 0; i < research.length; i++) {
      var tags = research[i].tags || [];
      for (var t = 0; t < tags.length; t++) {
        if (allTags.indexOf(tags[t]) === -1) allTags.push(tags[t]);
      }
    }
    allTags.sort();
    renderFilters('tag-filters-research', allTags, dict, function(tag) {
      RESEARCH_PAGE_STATE.activeTag = tag;
      applyResearchFilter(lang, dict);
    });

    applyResearchFilter(lang, dict);
  });
}

function applyResearchFilter(lang, dict) {
  var tag = RESEARCH_PAGE_STATE.activeTag;
  if (tag === '__ALL__') {
    RESEARCH_PAGE_STATE.filteredItems = RESEARCH_PAGE_STATE.allItems;
  } else {
    RESEARCH_PAGE_STATE.filteredItems = RESEARCH_PAGE_STATE.allItems.filter(function(r) {
      return (r.tags || []).map(function(x){return x.toLowerCase();}).indexOf(tag.toLowerCase()) !== -1;
    });
  }
  RESEARCH_PAGE_STATE.loadedCount = 0;
  var grid = document.getElementById('research-grid');
  var statusEl = document.getElementById('grid-status');
  grid.innerHTML = '';
  if (statusEl) grid.appendChild(statusEl);
  loadNextBatch(lang, dict);
  setupInfiniteScroll(lang, dict);
}

function loadNextBatch(lang, dict) {
  var state = RESEARCH_PAGE_STATE;
  var grid = document.getElementById('research-grid');
  var statusEl = document.getElementById('grid-status');
  var remaining = state.filteredItems.length - state.loadedCount;

  if (remaining <= 0) {
    if (statusEl) statusEl.textContent = state.filteredItems.length === 0 ? dict.no_research : dict.end_of_list;
    return;
  }

  var batch = state.filteredItems.slice(state.loadedCount, state.loadedCount + state.batchSize);
  var wrapper = document.createElement('div');
  wrapper.innerHTML = batch.map(function(r) { return articleCardHTML(r, lang, dict); }).join('');
  while (wrapper.firstChild) {
    if (statusEl && statusEl.parentNode === grid) {
      grid.insertBefore(wrapper.firstChild, statusEl);
    } else {
      grid.appendChild(wrapper.firstChild);
    }
  }
  attachCardHandlers(grid, dict);
  state.loadedCount += batch.length;

  if (statusEl) statusEl.textContent = state.loadedCount >= state.filteredItems.length ? dict.end_of_list : '';
}

function setupInfiniteScroll(lang, dict) {
  if (scrollObserver) scrollObserver.disconnect();
  var sentinel = document.getElementById('grid-sentinel');
  if (!sentinel) return;
  scrollObserver = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) loadNextBatch(lang, dict);
  }, { rootMargin: '200px' });
  scrollObserver.observe(sentinel);
}

function renderFilters(containerId, tags, dict, onSelect) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var allLabel = dict.filter_all;
  var allTagsList = [allLabel].concat(tags);
  el.innerHTML = allTagsList.map(function(tag) {
    return '<button class="filter-btn' + (tag === allLabel ? ' active' : '') + '" data-tag="' + tag + '">' + tag + '</button>';
  }).join('');
  var buttons = el.querySelectorAll('.filter-btn');
  for (var i = 0; i < buttons.length; i++) {
    (function(btn) {
      btn.addEventListener('click', function() {
        var all = el.querySelectorAll('.filter-btn');
        for (var k = 0; k < all.length; k++) all[k].classList.remove('active');
        btn.classList.add('active');
        onSelect(btn.dataset.tag === allLabel ? '__ALL__' : btn.dataset.tag);
      });
    })(buttons[i]);
  }
}

var CURRENT_ARTICLE_ID = null;

function showArticle(id, lang, dict, scrollToTop) {
  return getResearch().then(function(research) {
    var article = null;
    for (var i = 0; i < research.length; i++) { if (research[i].id === id) { article = research[i]; break; } }
    if (!article) return;

    CURRENT_ARTICLE_ID = id;
    document.getElementById('research-list-view').classList.add('hidden');
    document.getElementById('article-view').classList.add('visible');

    var title = article.title[lang] || article.title.en;
    var body = article.body[lang] || article.body.en;
    var tags = (article.tags || []).map(function(t) { return '<span class="tag">' + t + '</span>'; }).join('');

    var imgHtml = '';
    if (article.image) {
      imgHtml = '<img class="detail-hero-image" src="' + article.image + '" alt="">';
    } else {
      var gradient = PLACEHOLDER_GRADIENTS[hashString(article.id) % PLACEHOLDER_GRADIENTS.length];
      imgHtml = '<div class="detail-hero-image detail-hero-placeholder" style="background-image:' + gradient + ';"></div>';
    }

    document.getElementById('article-reading-title').textContent = title;
    document.getElementById('article-content').innerHTML =
      imgHtml + '<h1>' + title + '</h1>' +
      '<div class="meta">' + formatDate(article.date, lang) + '</div>' +
      '<div class="tag-row">' + tags + '</div>' +
      '<p>' + body + '</p>';

    if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function closeArticle() {
  CURRENT_ARTICLE_ID = null;
  document.getElementById('article-view').classList.remove('visible');
  document.getElementById('research-list-view').classList.remove('hidden');
  history.replaceState(null, '', window.location.pathname);
}

function renderEducationalTree(data, lang, dict) {
  var container = document.getElementById('educational-tree');
  container.innerHTML = data.categories.map(function(cat) {
    var catName = cat.name[lang] || cat.name.en;
    var entries = cat.entries.map(function(entry) {
      var entryTitle = entry.title[lang] || entry.title.en;
      return '<div class="tree-entry" data-cat="' + cat.id + '" data-entry="' + entry.id + '">' + entryTitle + '</div>';
    }).join('');
    return (
      '<div class="tree-category" data-cat-id="' + cat.id + '">' +
        '<div class="tree-category-header"><h3>' + catName + '</h3>' +
        '<span class="tree-category-count">' + cat.entries.length + ' <span class="tree-chevron">&#9656;</span></span></div>' +
        '<div class="tree-entries">' + entries + '</div>' +
      '</div>'
    );
  }).join('');

  var headers = container.querySelectorAll('.tree-category-header');
  for (var i = 0; i < headers.length; i++) {
    (function(header) { header.addEventListener('click', function() { header.closest('.tree-category').classList.toggle('expanded'); }); })(headers[i]);
  }

  var entryEls = container.querySelectorAll('.tree-entry');
  for (var j = 0; j < entryEls.length; j++) {
    (function(entryEl) {
      entryEl.addEventListener('click', function(e) {
        e.stopPropagation();
        showEduEntry(entryEl.dataset.cat, entryEl.dataset.entry, getLang(), null, true);
      });
    })(entryEls[j]);
  }
}

function renderEducationalPage(lang, dict) {
  return getEducational().then(function(data) { renderEducationalTree(data, lang, dict); });
}

var CURRENT_EDU_ENTRY = null;

function showEduEntry(categoryId, entryId, lang, dictParam, scrollToTop) {
  return getStrings().then(function(strings) {
    var d = dictParam || strings[lang] || strings.en;
    return getEducational().then(function(data) {
      var category = null;
      for (var i = 0; i < data.categories.length; i++) { if (data.categories[i].id === categoryId) { category = data.categories[i]; break; } }
      if (!category) return;
      var entry = null;
      for (var j = 0; j < category.entries.length; j++) { if (category.entries[j].id === entryId) { entry = category.entries[j]; break; } }
      if (!entry) return;

      CURRENT_EDU_ENTRY = { categoryId: categoryId, entryId: entryId };
      document.getElementById('educational-list-view').classList.add('hidden');
      document.getElementById('educational-entry-view').classList.add('visible');

      var catName = category.name[lang] || category.name.en;
      var entryTitle = entry.title[lang] || entry.title.en;
      var entryBody = entry.body[lang] || entry.body.en;

      document.getElementById('edu-breadcrumb').innerHTML = d.nav_educational + ' &rsaquo; ' + catName + ' &rsaquo; <strong>' + entryTitle + '</strong>';
      document.getElementById('educational-entry-content').innerHTML =
        '<span class="draft-badge">' + d.draft_badge + '</span><h1>' + entryTitle + '</h1><p>' + entryBody + '</p>';

      if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function closeEduEntry() {
  CURRENT_EDU_ENTRY = null;
  document.getElementById('educational-entry-view').classList.remove('visible');
  document.getElementById('educational-list-view').classList.remove('hidden');
  history.replaceState(null, '', window.location.pathname);
}

function initDetailViews() {
  var backArticle = document.getElementById('back-to-list-link');
  if (backArticle) backArticle.addEventListener('click', closeArticle);

  var backEdu = document.getElementById('back-to-educational-link');
  if (backEdu) backEdu.addEventListener('click', closeEduEntry);

  if (document.getElementById('research-grid') && window.location.hash) {
    var id = window.location.hash.replace('#', '');
    getStrings().then(function(strings) {
      var lang = getLang();
      showArticle(id, lang, strings[lang] || strings.en, false);
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  initLangSwitch();
  applyLang(getLang()).then(function() { initDetailViews(); });
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
