// ==== Language state ====
const LANG_KEY = 'site_lang';

function getLang() {
  return localStorage.getItem(LANG_KEY) || 'it';
}

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyLang(lang);
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('Errore caricando ' + path);
  return res.json();
}

let STRINGS_CACHE = null;
async function getStrings() {
  if (!STRINGS_CACHE) STRINGS_CACHE = await fetchJSON('data/strings.json');
  return STRINGS_CACHE;
}

function formatDate(dateStr, lang) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const locale = lang === 'en' ? 'en-GB' : 'it-IT';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
}

function sortByDateDesc(arr) {
  return [...arr].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ==== Apply static text translations (data-i18n attributes) + re-render dynamic content ====
async function applyLang(lang) {
  document.documentElement.lang = lang;
  const strings = await getStrings();
  const dict = strings[lang] || strings.it;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Re-render whichever dynamic content exists on this page
  if (document.getElementById('latest-projects')) await renderHomeContent(lang, dict);
  if (document.getElementById('all-projects')) await renderProjectsPage(lang, dict);
  if (document.getElementById('all-research')) await renderResearchPage(lang, dict);
}

function initLangSwitch() {
  const switcher = document.querySelector('.lang-switch');
  if (!switcher) return;
  switcher.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
}

// ==== Card templates ====
function projectCard(p, lang, dict) {
  const title = lang === 'en' ? p.title_en : p.title_it;
  const role = lang === 'en' ? p.role_en : p.role_it;
  const desc = lang === 'en' ? p.description_en : p.description_it;
  const tags = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const link = p.link
    ? `<a class="card-link" href="${p.link}" target="_blank" rel="noopener">${dict.details_link}</a>`
    : '';
  return `
    <div class="card" data-tags="${(p.tags || []).join(',').toLowerCase()}">
      <h3>${title}</h3>
      <div class="meta">${formatDate(p.date, lang)}${role ? ' &middot; ' + role : ''}</div>
      <p>${desc}</p>
      <div class="tag-row">${tags}</div>
      ${link}
    </div>
  `;
}

function researchItem(r, lang, dict) {
  const title = lang === 'en' ? r.title_en : r.title_it;
  const summary = lang === 'en' ? r.summary_en : r.summary_it;
  const tags = (r.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const link = r.link
    ? `<a class="card-link" href="${r.link}" target="_blank" rel="noopener">${dict.learn_more_link}</a>`
    : '';
  return `
    <div class="research-item" data-tags="${(r.tags || []).join(',').toLowerCase()}">
      <h3>${title}</h3>
      <div class="meta">${formatDate(r.date, lang)}</div>
      <p>${summary}</p>
      <div class="tag-row">${tags}</div>
      ${link}
    </div>
  `;
}

// ==== Home page ====
async function renderHomeContent(lang, dict) {
  try {
    const [projects, research] = await Promise.all([
      fetchJSON('data/projects.json'),
      fetchJSON('data/research.json')
    ]);
    const latestProjects = sortByDateDesc(projects).slice(0, 3);
    const latestResearch = sortByDateDesc(research).slice(0, 3);

    document.getElementById('latest-projects').innerHTML =
      latestProjects.map(p => projectCard(p, lang, dict)).join('') || `<p>${dict.no_projects}</p>`;
    document.getElementById('latest-research').innerHTML =
      latestResearch.map(r => researchItem(r, lang, dict)).join('') || `<p>${dict.no_research}</p>`;
  } catch (e) {
    console.error(e);
  }
}

// ==== Projects page ====
let PROJECTS_CACHE = null;
async function renderProjectsPage(lang, dict) {
  try {
    if (!PROJECTS_CACHE) PROJECTS_CACHE = sortByDateDesc(await fetchJSON('data/projects.json'));
    const container = document.getElementById('all-projects');
    container.innerHTML = PROJECTS_CACHE.map(p => projectCard(p, lang, dict)).join('') || `<p>${dict.no_projects}</p>`;

    const allTags = [...new Set(PROJECTS_CACHE.flatMap(p => p.tags || []))].sort();
    renderFilters('tag-filters', allTags, dict, (tag) => filterCards(container, '.card', tag));
  } catch (e) {
    console.error(e);
  }
}

// ==== Research page ====
let RESEARCH_CACHE = null;
async function renderResearchPage(lang, dict) {
  try {
    if (!RESEARCH_CACHE) RESEARCH_CACHE = sortByDateDesc(await fetchJSON('data/research.json'));
    const container = document.getElementById('all-research');
    container.innerHTML = RESEARCH_CACHE.map(r => researchItem(r, lang, dict)).join('') || `<p>${dict.no_research}</p>`;

    const allTags = [...new Set(RESEARCH_CACHE.flatMap(r => r.tags || []))].sort();
    renderFilters('tag-filters-research', allTags, dict, (tag) => filterCards(container, '.research-item', tag));
  } catch (e) {
    console.error(e);
  }
}

// ==== Filters ====
function renderFilters(containerId, tags, dict, onSelect) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const allLabel = dict.filter_all;
  const buttons = [allLabel, ...tags].map(tag =>
    `<button class="filter-btn${tag === allLabel ? ' active' : ''}" data-tag="${tag}">${tag}</button>`
  ).join('');
  el.innerHTML = buttons;

  el.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(btn.dataset.tag === allLabel ? '__ALL__' : btn.dataset.tag);
    });
  });
}

function filterCards(container, selector, tag) {
  container.querySelectorAll(selector).forEach(card => {
    if (tag === '__ALL__') {
      card.style.display = '';
      return;
    }
    const tags = (card.dataset.tags || '').split(',');
    card.style.display = tags.includes(tag.toLowerCase()) ? '' : 'none';
  });
}

// ==== Init on every page ====
document.addEventListener('DOMContentLoaded', () => {
  initLangSwitch();
  applyLang(getLang());
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
