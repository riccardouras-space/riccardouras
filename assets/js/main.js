// ==== Data loading helpers ====
async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('Errore caricando ' + path);
  return res.json();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('it-IT', { year: 'numeric', month: 'long' });
}

function sortByDateDesc(arr) {
  return [...arr].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ==== Project card ====
function projectCard(p) {
  const tags = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const link = p.link
    ? `<a class="card-link" href="${p.link}" target="_blank" rel="noopener">Vedi dettagli &rarr;</a>`
    : '';
  return `
    <div class="card" data-tags="${(p.tags || []).join(',').toLowerCase()}">
      <h3>${p.title}</h3>
      <div class="meta">${formatDate(p.date)}${p.role ? ' &middot; ' + p.role : ''}</div>
      <p>${p.description}</p>
      <div class="tag-row">${tags}</div>
      ${link}
    </div>
  `;
}

// ==== Research item ====
function researchItem(r) {
  const tags = (r.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const link = r.link
    ? `<a class="card-link" href="${r.link}" target="_blank" rel="noopener">Approfondisci &rarr;</a>`
    : '';
  return `
    <div class="research-item" data-tags="${(r.tags || []).join(',').toLowerCase()}">
      <h3>${r.title}</h3>
      <div class="meta">${formatDate(r.date)}</div>
      <p>${r.summary}</p>
      <div class="tag-row">${tags}</div>
      ${link}
    </div>
  `;
}

// ==== Home page ====
async function loadHomeContent() {
  try {
    const [projects, research] = await Promise.all([
      fetchJSON('data/projects.json'),
      fetchJSON('data/research.json')
    ]);

    const latestProjects = sortByDateDesc(projects).slice(0, 3);
    const latestResearch = sortByDateDesc(research).slice(0, 3);

    document.getElementById('latest-projects').innerHTML =
      latestProjects.map(projectCard).join('') || '<p>Nessun progetto ancora.</p>';

    document.getElementById('latest-research').innerHTML =
      latestResearch.map(researchItem).join('') || '<p>Nessuna ricerca ancora.</p>';
  } catch (e) {
    console.error(e);
  }
}

// ==== Projects page ====
async function loadProjectsPage() {
  try {
    const projects = sortByDateDesc(await fetchJSON('data/projects.json'));
    const container = document.getElementById('all-projects');
    container.innerHTML = projects.map(projectCard).join('') || '<p>Nessun progetto ancora.</p>';

    const allTags = [...new Set(projects.flatMap(p => p.tags || []))].sort();
    renderFilters('tag-filters', allTags, (tag) => filterCards(container, '.card', tag));
  } catch (e) {
    console.error(e);
  }
}

// ==== Research page ====
async function loadResearchPage() {
  try {
    const research = sortByDateDesc(await fetchJSON('data/research.json'));
    const container = document.getElementById('all-research');
    container.innerHTML = research.map(researchItem).join('') || '<p>Nessuna ricerca ancora.</p>';

    const allTags = [...new Set(research.flatMap(r => r.tags || []))].sort();
    renderFilters('tag-filters-research', allTags, (tag) => filterCards(container, '.research-item', tag));
  } catch (e) {
    console.error(e);
  }
}

// ==== Filters ====
function renderFilters(containerId, tags, onSelect) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const buttons = ['Tutti', ...tags].map(tag =>
    `<button class="filter-btn${tag === 'Tutti' ? ' active' : ''}" data-tag="${tag}">${tag}</button>`
  ).join('');
  el.innerHTML = buttons;

  el.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(btn.dataset.tag);
    });
  });
}

function filterCards(container, selector, tag) {
  container.querySelectorAll(selector).forEach(card => {
    if (tag === 'Tutti') {
      card.style.display = '';
      return;
    }
    const tags = (card.dataset.tags || '').split(',');
    card.style.display = tags.includes(tag.toLowerCase()) ? '' : 'none';
  });
}
