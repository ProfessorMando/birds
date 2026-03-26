// app.js — Birds of Yorba Linda SPA
(function() {
'use strict';

// ===== STATE =====
let currentTheme = 'light';
let quizState = null;
const THEME_STORAGE_KEY = 'themePreference';

// ===== INIT =====
function init() {
  // Theme
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    currentTheme = savedTheme;
  } else {
    currentTheme = getInitialThemeFromTimeZone();
  }
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeButton();

  // Router
  window.addEventListener('hashchange', onRoute);
  onRoute();
}

// ===== THEME TOGGLE =====
window.toggleTheme = function() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  window.localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
  updateThemeButton();
};

function getInitialThemeFromTimeZone() {
  // Browser Date values are already localized to the user's time zone.
  // Default to light between 7:00 and 18:59 local time, dark otherwise.
  const hour = new Date().getHours();
  return (hour >= 7 && hour < 19) ? 'light' : 'dark';
}

function updateThemeButton() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark = currentTheme === 'dark';
  btn.setAttribute('aria-label', 'Switch to ' + (isDark ? 'light' : 'dark') + ' mode');
  btn.innerHTML = isDark
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

// ===== MOBILE MENU =====
window.toggleMobileMenu = function() {
  const nav = document.getElementById('nav-main');
  nav.classList.toggle('open');
};

// ===== ROUTING =====
function navigate(hash) {
  window.location.hash = hash;
}
window.navigate = navigate;

function onRoute() {
  const hash = window.location.hash || '#home';
  const main = document.getElementById('main-content');
  if (!main) return;

  // Close mobile menu
  const nav = document.getElementById('nav-main');
  if (nav) nav.classList.remove('open');

  // Update active nav
  const navLinks = document.querySelectorAll('.nav-main a');
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === hash || hash.startsWith(href + '/'));
  });

  // Route
  const parts = hash.slice(1).split('/');
  const page = parts[0];
  const id = parts[1];

  window.scrollTo(0, 0);

  switch(page) {
    case 'home': case '': renderHome(main); break;
    case 'birds': renderBirds(main); break;
    case 'bird': renderBirdDetail(main, id); break;
    case 'wildlife': renderWildlife(main); break;
    case 'wildlifeDetail': renderWildlifeDetail(main, id); break;
    case 'parks': renderParks(main); break;
    case 'park': renderParkDetail(main, id); break;
    case 'rare': renderRare(main); break;
    case 'learn': renderLearn(main); break;
    case 'quiz': renderQuiz(main); break;
    case 'about': renderAbout(main); break;
    case 'search': renderSearch(main); break;
    default: renderHome(main);
  }

  requestAnimationFrame(activateLazyImages);
}

// ===== HELPERS =====
function encounterBadge(enc) {
  const map = { 'Very likely': 'badge-green', 'Likely': 'badge-blue', 'Possible': 'badge-earth', 'Uncommon': 'badge-warm', 'Rare': 'badge-danger' };
  return map[enc] || 'badge-earth';
}

function statusBadge(status) {
  if (status === 'Conservation Concern') return 'badge-danger';
  if (status === 'Migratory') return 'badge-blue';
  return 'badge-green';
}

function seasonIcon(s) {
  const icons = { 'Year-round': '☀', 'Winter': '❄', 'Spring': '🌱', 'Summer': '🌻', 'Fall': '🍂', 'Fall-Winter': '🍂' };
  return icons[s] || '☀';
}

function seasonBadge(s) {
  const map = {
    'Year-round': 'badge-green',
    'Winter': 'badge-blue',
    'Spring': 'badge-warm',
    'Summer': 'badge-earth',
    'Fall': 'badge-danger',
    'Fall-Winter': 'badge-blue'
  };
  return map[s] || 'badge-earth';
}

const WILDLIFE_HABITAT_GROUPS = {
  'western-fence-lizard': 'Desert/Scrubland Species',
  'california-ground-squirrel': 'Desert/Scrubland Species',
  'desert-cottontail': 'Desert/Scrubland Species',
  'southern-pacific-rattlesnake': 'Desert/Scrubland Species',
  'pacific-gopher-snake': 'Forest/Woodland Species',
  'coyote': 'Forest/Woodland Species',
  'bobcat': 'Forest/Woodland Species',
  'gray-fox': 'Forest/Woodland Species',
  'mountain-lion': 'Forest/Woodland Species',
  'mule-deer': 'Mixed Habitat Species'
};

const WILDLIFE_DIET_GROUPS = {
  'coyote': 'Carnivores',
  'bobcat': 'Carnivores',
  'gray-fox': 'Carnivores',
  'mountain-lion': 'Carnivores',
  'california-ground-squirrel': 'Herbivores',
  'desert-cottontail': 'Herbivores',
  'mule-deer': 'Herbivores',
  'pacific-gopher-snake': 'Omnivores',
  'southern-pacific-rattlesnake': 'Omnivores'
};

function wildlifeHabitatCategory(wildlife) {
  return WILDLIFE_HABITAT_GROUPS[wildlife.id] || 'Mixed Habitat Species';
}

function wildlifeDietCategory(wildlife) {
  return WILDLIFE_DIET_GROUPS[wildlife.id] || 'Omnivores';
}

function wildlifeRarityBadge(status) {
  const map = {
    'Very Common': 'badge-green',
    'Common': 'badge-blue',
    'Occasional': 'badge-warm',
    'Uncommon': 'badge-earth',
    'Rare': 'badge-danger'
  };
  return map[status] || 'badge-earth';
}

function renderSources(sources) {
  if (!sources || !sources.length) return '';
  return `<div class="sources-list"><h3>Sources</h3><p>${sources.map((s,i) => `[${i+1}] <a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.text}</a>`).join(' &nbsp;')}</p></div>`;
}

const BIRD_DIRECTORY_ORDER = [
  // Ground birds
  'california-quail',
  'mourning-dove',
  // Hummingbirds
  'annas-hummingbird',
  'allens-hummingbird',
  'costas-hummingbird',
  'rufous-hummingbird',
  // Flycatchers
  'black-phoebe',
  'says-phoebe',
  // Corvids
  'california-scrub-jay',
  'american-crow',
  // Smaller songbirds
  'bushtit',
  'california-gnatcatcher',
  'cactus-wren',
  'northern-mockingbird',
  // Sparrows and finches
  'california-towhee',
  'white-crowned-sparrow',
  'house-finch',
  'lesser-goldfinch',
  // Other passerines
  'yellow-rumped-warbler',
  'cedar-waxwing',
  'western-bluebird',
  'nuttalls-woodpecker',
  // Hawks and falcons
  'red-tailed-hawk',
  'red-shouldered-hawk',
  'coopers-hawk',
  'osprey',
  'turkey-vulture',
  'american-kestrel',
  'peregrine-falcon',
  // Owls
  'great-horned-owl',
  'barn-owl',
  'western-screech-owl',
  'burrowing-owl',
  // Herons and egrets
  'great-blue-heron',
  'great-egret',
  'snowy-egret',
  'black-crowned-night-heron',
  // Other waterbirds and shorebirds
  'double-crested-cormorant',
  'mallard',
  'american-coot',
  'western-grebe',
  'black-necked-stilt',
  'killdeer'
];

const BIRD_BY_ID = new Map(BIRDS.map((bird) => [bird.id, bird]));
const PARK_BY_ID = new Map(PARKS.map((park) => [park.id, park]));
const BIRD_BY_NAME = new Map(BIRDS.map((bird) => [bird.name, bird]));
const DIRECTORY_BIRDS = getBirdDirectoryList();
const FILTER_OPTIONS = {
  habitats: [...new Set(BIRDS.flatMap((bird) => bird.habitat))].sort(),
  seasons: [...new Set(BIRDS.map((bird) => bird.season))].sort(),
  groups: [...new Set(BIRDS.map((bird) => bird.group))].sort()
};
const RARE_BIRDS = BIRDS.filter((bird) => ['Uncommon', 'Rare', 'Possible'].includes(bird.encounter));
const PARKS_BY_TIER = [1, 2, 3].map((tier) => PARKS.filter((park) => park.tier === tier));
const SEARCH_INDEX = {
  birds: BIRDS.map((bird) => ({
    item: bird,
    haystack: [bird.name, bird.scientific, bird.group, ...bird.habitat].join(' ').toLowerCase()
  })),
  wildlife: WILDLIFE.map((wildlife) => ({
    item: wildlife,
    haystack: [wildlife.name, wildlife.scientific, wildlifeHabitatCategory(wildlife), wildlifeDietCategory(wildlife)].join(' ').toLowerCase()
  })),
  parks: PARKS.map((park) => ({
    item: park,
    haystack: [park.name, park.location, park.habitat].join(' ').toLowerCase()
  }))
};

let searchDebounceTimer = null;

function getBirdDirectoryList() {
  const byId = new Map(BIRDS.map(b => [b.id, b]));
  const ordered = BIRD_DIRECTORY_ORDER.map(id => byId.get(id)).filter(Boolean);
  const included = new Set(ordered.map(b => b.id));
  const remaining = BIRDS.filter(b => !included.has(b.id));
  return [...ordered, ...remaining];
}

function birdCard(bird) {
  return `<a href="#bird/${bird.id}" class="species-card fade-in" aria-label="Learn about ${bird.name}">
    <div class="species-card-img" data-name="${bird.name}"><img referrerpolicy="no-referrer" data-src="${bird.image}" alt="${bird.name}" loading="lazy" decoding="async" width="400" height="300" onerror="this.parentElement.classList.add('img-error');this.dataset.error='true'"></div>
    <div class="species-card-body">
      <h3>${bird.name}</h3>
      <p class="scientific">${bird.scientific}</p>
      <div class="badges">
        <span class="badge ${statusBadge(bird.status)}">◌ ${bird.status}</span>
        <span class="badge ${encounterBadge(bird.encounter)}">◇ ${bird.encounter}</span>
        <span class="badge ${seasonBadge(bird.season)}">○ ${bird.season}</span>
      </div>
    </div>
  </a>`;
}

function wildlifeCard(w) {
  return `<a href="#wildlifeDetail/${w.id}" class="species-card fade-in" aria-label="Learn about ${w.name}">
    <div class="species-card-img" data-name="${w.name}"><img referrerpolicy="no-referrer" data-src="${w.image}" alt="${w.name}" loading="lazy" decoding="async" width="400" height="300" onerror="this.parentElement.classList.add('img-error');this.dataset.error='true'"></div>
    <div class="species-card-body">
      <h3>${w.name}</h3>
      <p class="scientific">${w.scientific}</p>
      <div class="badges">
        <span class="badge badge-habitat">${wildlifeHabitatCategory(w)}</span>
        <span class="badge badge-diet">${wildlifeDietCategory(w)}</span>
        <span class="badge ${wildlifeRarityBadge(w.status)}">${w.status}</span>
      </div>
    </div>
  </a>`;
}

const PARK_TIER_COLORS = { 1: 'badge-green', 2: 'badge-blue', 3: 'badge-earth' };
const PARK_TIER_LABELS = { 1: 'Must-Visit', 2: 'Important', 3: 'Notable' };

function parkCard(park) {
  return `<a href="#park/${park.id}" class="park-card fade-in" aria-label="Learn about ${park.name}">
    <span class="badge ${PARK_TIER_COLORS[park.tier]} tier-badge">Tier ${park.tier} — ${PARK_TIER_LABELS[park.tier]}</span>
    <h3>${park.name}</h3>
    <p class="location">${park.location} — ${park.distance}</p>
    <span class="habitat-tag">${park.habitat}</span>
    <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-top:var(--space-2)">${park.whyGood.slice(0, 120)}...</p>
  </a>`;
}

// ===== PAGE RENDERERS =====

function renderHome(el) {
  const featured = ['california-quail', 'red-tailed-hawk', 'annas-hummingbird', 'great-blue-heron', 'western-bluebird', 'peregrine-falcon'];
  const featuredBirds = featured.map((id) => BIRD_BY_ID.get(id)).filter(Boolean);
  const featuredParks = ['chino-hills-state-park', 'yorba-regional-park', 'san-joaquin-wildlife-sanctuary'];
  const fParks = featuredParks.map((id) => PARK_BY_ID.get(id)).filter(Boolean);

  el.innerHTML = `
    <div class="hero">
      <div class="hero-content">
        <div class="hero-badge">${seasonIcon('Year-round')} Southern California Wildlife Guide</div>
        <h1>Birds of Yorba Linda</h1>
        <p>Discover the rich birdlife and wildlife of Yorba Linda, California — at the ecological crossroads of coastal sage scrub, oak woodland, and the Puente-Chino Hills corridor.</p>
        <div style="display:flex;gap:var(--space-3);justify-content:center;flex-wrap:wrap">
          <a href="#birds" class="btn-primary">Explore ${BIRDS.length} Species</a>
          <a href="#quiz" class="btn-secondary" style="background:rgba(255,255,255,0.15);color:white;border-color:rgba(255,255,255,0.3)">Take the Quiz</a>
        </div>
      </div>
    </div>

    <div style="max-width:var(--content-wide);margin:0 auto;padding:var(--space-8) var(--space-4)">

      <div class="section-header">
        <h2>Featured Species</h2>
        <p>Some of the most remarkable birds you can find in the Yorba Linda area</p>
      </div>
      <div class="featured-grid">${featuredBirds.map(b => birdCard(b)).join('')}</div>

      <div class="section-header" style="margin-top:var(--space-12)">
        <h2>Top Birding Spots</h2>
        <p>The best parks and natural areas near Yorba Linda for wildlife watching</p>
      </div>
      <div class="card-grid">${fParks.map(p => parkCard(p)).join('')}</div>

      <div class="section-header" style="margin-top:var(--space-12)">
        <h2>Explore the Guide</h2>
        <p>Navigate the different sections of this wildlife resource</p>
      </div>
      <div class="nav-cards">
        <a href="#birds" class="nav-card">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19c2-4 5-8 10-10 2-.6 3.5-.4 4.5.4 1 .8 1 2.4 0 3.6-1.5 1.5-4 3-7 4-2 .6-3.5 1.7-4.5 3.5"/><circle cx="18" cy="10.5" r=".8" fill="currentColor"/></svg>
          <h3>Bird Directory</h3>
          <p>${BIRDS.length} species</p>
        </a>
        <a href="#wildlife" class="nav-card">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3c-3 0-6 3-6 7 0 5 6 11 6 11s6-6 6-11c0-4-3-7-6-7z"/><circle cx="12" cy="10" r="2"/></svg>
          <h3>Other Wildlife</h3>
          <p>${WILDLIFE.length} species</p>
        </a>
        <a href="#parks" class="nav-card">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/></svg>
          <h3>Parks & Hotspots</h3>
          <p>${PARKS.length} locations</p>
        </a>
        <a href="#rare" class="nav-card">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <h3>Rare Sightings</h3>
          <p>Uncommon finds</p>
        </a>
        <a href="#learn" class="nav-card">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <h3>Birding Basics</h3>
          <p>ID tips & guides</p>
        </a>
        <a href="#quiz" class="nav-card">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>
          <h3>Quiz</h3>
          <p>Test your knowledge</p>
        </a>
      </div>

      <div class="learn-section" style="margin-top:var(--space-12)">
        <h2>${seasonIcon('Year-round')} Seasonal Note</h2>
        <p>Yorba Linda's wildlife changes with the seasons. Winter brings sparrows, warblers, and waterfowl from the north. Spring and fall see migrating hummingbirds and songbirds passing through. Summer features nesting orioles and swallows. Year-round residents like California Quail, Anna's Hummingbird, and Red-tailed Hawk are always here to greet you.</p>
      </div>
    </div>`;
}

function renderBirds(el) {
  const habitats = FILTER_OPTIONS.habitats;
  const seasons = FILTER_OPTIONS.seasons;
  const encounters = ['Very likely', 'Likely', 'Possible', 'Uncommon', 'Rare'];
  const groups = FILTER_OPTIONS.groups;

  el.innerHTML = `
    <div class="section-header"><h2>Bird Directory</h2><p>All ${BIRDS.length} documented species in the Yorba Linda area</p></div>
    <div class="filter-bar" role="search" aria-label="Filter birds">
      <div class="filter-group">
        <label for="filter-habitat">Habitat</label>
        <select id="filter-habitat" onchange="filterBirds()"><option value="">All Habitats</option>${habitats.map(h => `<option value="${h}">${h}</option>`).join('')}</select>
      </div>
      <div class="filter-group">
        <label for="filter-season">Season</label>
        <select id="filter-season" onchange="filterBirds()"><option value="">All Seasons</option>${seasons.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
      </div>
      <div class="filter-group">
        <label for="filter-encounter">Encounter Odds</label>
        <select id="filter-encounter" onchange="filterBirds()"><option value="">All</option>${encounters.map(e => `<option value="${e}">${e}</option>`).join('')}</select>
      </div>
      <div class="filter-group">
        <label for="filter-group">Group</label>
        <select id="filter-group" onchange="filterBirds()"><option value="">All Groups</option>${groups.map(g => `<option value="${g}">${g}</option>`).join('')}</select>
      </div>
    </div>
    <div id="birds-grid" class="card-grid">${DIRECTORY_BIRDS.map(b => birdCard(b)).join('')}</div>
    <p id="birds-count" style="margin-top:var(--space-4);color:var(--color-text-muted);font-size:var(--text-sm)">Showing ${BIRDS.length} species</p>`;
}

window.filterBirds = function() {
  const h = document.getElementById('filter-habitat')?.value || '';
  const s = document.getElementById('filter-season')?.value || '';
  const e = document.getElementById('filter-encounter')?.value || '';
  const g = document.getElementById('filter-group')?.value || '';

  let filtered = DIRECTORY_BIRDS;
  if (h) filtered = filtered.filter(b => b.habitat.includes(h));
  if (s) filtered = filtered.filter(b => b.season === s);
  if (e) filtered = filtered.filter(b => b.encounter === e);
  if (g) filtered = filtered.filter(b => b.group === g);

  const grid = document.getElementById('birds-grid');
  const count = document.getElementById('birds-count');
  if (grid) grid.innerHTML = filtered.length ? filtered.map(b => birdCard(b)).join('') : '<div class="empty-state"><h3>No species match these filters</h3><p>Try adjusting your filter criteria</p></div>';
  if (count) count.textContent = `Showing ${filtered.length} species`;
};

function renderBirdDetail(el, id) {
  const bird = BIRD_BY_ID.get(id);
  if (!bird) { el.innerHTML = '<div class="empty-state"><h3>Species not found</h3><a href="#birds" class="btn-primary" style="margin-top:var(--space-4)">Browse all birds</a></div>'; return; }


  el.innerHTML = `
    <div class="detail-page fade-in">
      <a href="#birds" class="back-link">← Back to Bird Directory</a>
      <div class="detail-hero">
        <img referrerpolicy="no-referrer" data-src="${bird.image}" alt="${bird.name}" width="960" height="540" onerror="this.parentElement.classList.add('img-error');this.parentElement.dataset.name='${bird.name}';this.dataset.error='true'">
        <div class="detail-hero-overlay">
          <h1>${bird.name}</h1>
          <p class="scientific"><em>${bird.scientific}</em></p>
        </div>
      </div>

      <div class="detail-badges">
        <span class="badge ${statusBadge(bird.status)}">${bird.status}</span>
        <span class="badge ${encounterBadge(bird.encounter)}">Encounter: ${bird.encounter}</span>
        <span class="badge badge-earth">${seasonIcon(bird.season)} ${bird.season}</span>
        <span class="badge badge-blue">${bird.group}</span>
        ${bird.conservation && bird.conservation !== 'Least Concern' ? `<span class="badge badge-danger">${bird.conservation}</span>` : ''}
      </div>

      <div class="detail-section">
        <h2><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> Quick Facts</h2>
        <p><strong>Size:</strong> ${bird.size}</p>
        <p><strong>Diet:</strong> ${bird.diet}</p>
        <p><strong>Voice:</strong> ${bird.voice}</p>
      </div>

      <div class="detail-section">
        <h2><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> How to Identify</h2>
        <p>${bird.fieldMarks}</p>
        ${bird.similar ? `<p ><strong>Similar species:</strong> ${bird.similar}</p>` : ''}
      </div>

      <div class="detail-section">
        <h2><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> Behavior & Habitat</h2>
        <p>${bird.behavior}</p>
        ${bird.localNotes ? `<p><strong>Local notes:</strong> ${bird.localNotes}</p>` : ''}
      </div>

      <div class="detail-section">
        <h2><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Where to Find</h2>
        <p>${bird.localParks.join(', ')}</p>
      </div>

      ${bird.conservationNotes ? `<div class="detail-section"><h2><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Conservation</h2><p>${bird.conservationNotes}</p></div>` : ''}

      ${renderSources(bird.sources)}
    </div>`;
}

function renderWildlife(el) {
  el.innerHTML = `
    <div class="section-header"><h2>Other Wildlife</h2><p>Non-bird wildlife of the Yorba Linda area and their relationship to local bird ecology</p></div>
    <div class="card-grid">${WILDLIFE.map(w => wildlifeCard(w)).join('')}</div>`;
}

function renderWildlifeDetail(el, id) {
  const w = WILDLIFE.find(a => a.id === id);
  if (!w) { el.innerHTML = '<div class="empty-state"><h3>Species not found</h3></div>'; return; }


  el.innerHTML = `
    <div class="detail-page fade-in">
      <a href="#wildlife" class="back-link">← Back to Wildlife</a>
      <div class="detail-hero">
        <img referrerpolicy="no-referrer" data-src="${w.image}" alt="${w.name}" width="960" height="540" onerror="this.parentElement.classList.add('img-error');this.parentElement.dataset.name='${w.name}';this.dataset.error='true'">
        <div class="detail-hero-overlay">
          <h1>${w.name}</h1>
          <p class="scientific"><em>${w.scientific}</em></p>
        </div>
      </div>

      <div class="detail-badges">
        <span class="badge badge-habitat">${wildlifeHabitatCategory(w)}</span>
        <span class="badge badge-diet">${wildlifeDietCategory(w)}</span>
        <span class="badge ${wildlifeRarityBadge(w.status)}">${w.status}</span>
      </div>

      <div class="detail-section">
        <h2>Identification</h2>
        <p><strong>Size:</strong> ${w.size}</p>
        <p>${w.identification}</p>
      </div>

      <div class="detail-section">
        <h2>Habitat</h2>
        <p>${w.habitat}</p>
      </div>

      <div class="detail-section">
        <h2>Ecological Role</h2>
        <p>${w.ecologicalRole}</p>
      </div>

      <div class="detail-section">
        <h2>Relationship to Birds</h2>
        <p>${w.birdRelationship}</p>
      </div>

      ${renderSources(w.sources)}
    </div>`;
}

function renderParks(el) {
  const tierHeadings = { 1: 'Tier 1 — Must-Visit', 2: 'Tier 2 — Important', 3: 'Tier 3 — Notable' };

  let html = '<div class="section-header"><h2>Parks & Birding Hotspots</h2><p>The best natural areas near Yorba Linda for wildlife watching</p></div>';

  PARKS_BY_TIER.forEach((tierParks, index) => {
    const tier = index + 1;
    if (tierParks.length) {
      html += `<h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin:var(--space-8) 0 var(--space-4);color:var(--color-primary)">${tierHeadings[tier]}</h3>`;
      html += `<div class="card-grid">${tierParks.map((park) => parkCard(park)).join('')}</div>`;
    }
  });

  el.innerHTML = html;
}

function renderParkDetail(el, id) {
  const park = PARK_BY_ID.get(id);
  if (!park) { el.innerHTML = '<div class="empty-state"><h3>Park not found</h3></div>'; return; }


  el.innerHTML = `
    <div class="detail-page fade-in">
      <a href="#parks" class="back-link">← Back to Parks</a>
      <h1 style="font-family:var(--font-display);font-size:var(--text-2xl);margin-bottom:var(--space-2)">${park.name}</h1>
      <p style="color:var(--color-text-muted);font-size:var(--text-lg);margin-bottom:var(--space-4)">${park.location} — ${park.distance}</p>

      <div class="detail-badges">
        <span class="badge badge-green">Tier ${park.tier} — ${PARK_TIER_LABELS[park.tier]}</span>
        <span class="badge badge-earth">${park.habitat}</span>
        <span class="badge badge-blue">Best: ${park.bestSeason}</span>
        ${park.fee ? `<span class="badge badge-warm">${park.fee}</span>` : ''}
        ${park.familyFriendly ? '<span class="badge badge-green">Family Friendly</span>' : ''}
      </div>

      <div class="detail-section">
        <h2>Why Visit</h2>
        <p>${park.whyGood}</p>
      </div>

      <div class="detail-section">
        <h2>Species to Look For</h2>
        <p>${park.exampleSpecies.map(s => {
          const bird = BIRD_BY_NAME.get(s);
          return bird ? `<a href="#bird/${bird.id}" style="color:var(--color-primary);text-decoration:none;font-weight:600">${s}</a>` : s;
        }).join(', ')}</p>
      </div>

      ${renderSources(park.sources)}
    </div>`;
}

function renderRare(el) {
  el.innerHTML = `
    <div class="section-header"><h2>Rare & Uncommon Sightings</h2><p>Species that require patience, searching, or lucky timing to encounter in the Yorba Linda area</p></div>
    <div class="card-grid">${RARE_BIRDS.map((bird) => birdCard(bird)).join('')}</div>`;
}

function renderLearn(el) {
  el.innerHTML = `
    <div class="section-header"><h2>Birding Basics & ID Tips</h2><p>Everything you need to start identifying birds in Yorba Linda</p></div>

    <div class="learn-section">
      <h2>Getting Started with Birding</h2>
      <p>Birding — or birdwatching — is one of the most accessible outdoor activities. You don't need expensive equipment to start. Here's what helps:</p>
      <ul>
        <li><strong>Binoculars</strong> — Even an inexpensive pair (8x42 is a great starter size) makes a huge difference</li>
        <li><strong>A field guide</strong> — The Sibley Guide to Birds or Merlin Bird ID app (free from Cornell Lab)</li>
        <li><strong>Patience and stillness</strong> — Birds are more likely to appear when you're quiet and still</li>
        <li><strong>Early mornings</strong> — The first few hours after sunrise are peak bird activity</li>
      </ul>
    </div>

    <div class="learn-section">
      <h2>The Four Keys to Bird Identification</h2>
      <h3>1. Size & Shape</h3>
      <p>Compare the bird to familiar species. Is it sparrow-sized, robin-sized, or crow-sized? Note the body shape — chunky or slim? Tail long or short?</p>
      <h3>2. Color Pattern</h3>
      <p>Note the overall color, then look for distinctive markings: wing bars, eye rings, breast streaks, rump patches. Don't try to memorize every detail — just note the most obvious features.</p>
      <h3>3. Behavior</h3>
      <p>How does it move? Does it hop or walk? Does it pump its tail (phoebes)? Does it creep up tree trunks (woodpeckers, nuthatches)? Forage on the ground or in trees?</p>
      <h3>4. Habitat</h3>
      <p>Where are you seeing it? Water birds stay near water. Chaparral specialists stick to brushy hillsides. Many birds are predictable based on habitat alone.</p>
    </div>

    <div class="learn-section">
      <h2>Listening to Bird Songs</h2>
      <p>Most experienced birders identify the majority of birds by sound alone. Start with common species:</p>
      <ul>
        <li><strong>California Quail:</strong> "Chi-ca-go!" — three distinct syllables</li>
        <li><strong>Red-tailed Hawk:</strong> The classic movie scream — "keeeeaaarrrr"</li>
        <li><strong>Mourning Dove:</strong> Soft, mournful "coo-OOO-oo-oo-oo"</li>
        <li><strong>Northern Mockingbird:</strong> Endless medley of copied songs, each repeated 3-5 times</li>
        <li><strong>Great Horned Owl:</strong> Deep "hoo hoo hoo-hoo, hoo hoo" at night</li>
      </ul>
    </div>

    <div class="learn-section">
      <h2>Encounter Odds Explained</h2>
      <p>Throughout this guide, we use encounter odds to help you set expectations:</p>
      <ul>
        <li><strong>Very likely</strong> — Present on >75% of appropriate visits in season</li>
        <li><strong>Likely</strong> — Present on 40–75% of appropriate visits</li>
        <li><strong>Possible</strong> — Present on 15–40% of visits; may require searching</li>
        <li><strong>Uncommon</strong> — Present on <15% of visits; requires patience</li>
        <li><strong>Rare</strong> — <10 records per year in area; well-documented when found</li>
      </ul>
    </div>

    <div class="learn-section">
      <h2>Best Times for Birding in Yorba Linda</h2>
      <ul>
        <li><strong>Year-round:</strong> California Quail, Anna's Hummingbird, Black Phoebe, Red-tailed Hawk</li>
        <li><strong>Winter (Oct–Apr):</strong> White-crowned Sparrow, Yellow-rumped Warbler, waterfowl</li>
        <li><strong>Spring (Mar–May):</strong> Migrating warblers, hummingbirds, tanagers</li>
        <li><strong>Summer (Apr–Sep):</strong> Hooded Oriole, swallows, Black-chinned Hummingbird</li>
      </ul>
    </div>`;
}

// ===== QUIZ =====
function renderQuiz(el) {
  if (quizState && quizState.active) {
    renderQuizQuestion(el);
    return;
  }

  el.innerHTML = `
    <div class="quiz-container">
      <div class="section-header" style="text-align:center">
        <h2>Test Your Knowledge</h2>
        <p>5 random questions from our bank of ${QUIZ_QUESTIONS.length} questions. You have 5 minutes!</p>
      </div>
      <div style="text-align:center">
        <button class="btn-primary" onclick="startQuiz()" style="font-size:var(--text-lg);padding:var(--space-4) var(--space-8)">Start Quiz</button>
      </div>
    </div>`;
}

window.startQuiz = function() {
  // Pick 5 random questions
  const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
  quizState = {
    active: true,
    questions: shuffled.slice(0, 5),
    current: 0,
    score: 0,
    answers: [],
    startTime: Date.now(),
    timeLimit: 300000 // 5 minutes
  };
  renderQuizQuestion(document.getElementById('main-content'));
  startQuizTimer();
};

function startQuizTimer() {
  if (quizState.timerInterval) clearInterval(quizState.timerInterval);
  quizState.timerInterval = setInterval(() => {
    const elapsed = Date.now() - quizState.startTime;
    const remaining = Math.max(0, quizState.timeLimit - elapsed);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    const timerEl = document.getElementById('quiz-timer');
    if (timerEl) {
      timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      timerEl.classList.toggle('warning', remaining < 60000);
    }
    if (remaining <= 0) {
      clearInterval(quizState.timerInterval);
      endQuiz();
    }
  }, 1000);
}

function renderQuizQuestion(el) {
  if (!quizState || quizState.current >= quizState.questions.length) {
    endQuiz();
    return;
  }

  const q = quizState.questions[quizState.current];
  const qText = q.q;
  const elapsed = Date.now() - quizState.startTime;
  const remaining = Math.max(0, quizState.timeLimit - elapsed);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  el.innerHTML = `
    <div class="quiz-container fade-in">
      <div class="quiz-header">
        <span class="quiz-progress">Question ${quizState.current + 1} of ${quizState.questions.length}</span>
        <span class="quiz-timer" id="quiz-timer">${mins}:${secs.toString().padStart(2, '0')}</span>
      </div>
      <div class="quiz-question">
        <h3>${qText}</h3>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `<button class="quiz-option" onclick="answerQuiz(${i})" data-correct="${opt === q.a}">${opt}</button>`).join('')}
        </div>
      </div>
    </div>`;
}

window.answerQuiz = function(idx) {
  if (!quizState) return;
  const q = quizState.questions[quizState.current];
  const selected = q.options[idx];
  const correct = selected === q.a;
  if (correct) quizState.score++;
  quizState.answers.push({ question: q.q, selected, correct: q.a, isCorrect: correct });

  // Show feedback
  const buttons = document.querySelectorAll('.quiz-option');
  buttons.forEach((btn, i) => {
    btn.classList.add('disabled');
    if (q.options[i] === q.a) btn.classList.add('correct');
    if (i === idx && !correct) btn.classList.add('incorrect');
  });

  setTimeout(() => {
    quizState.current++;
    if (quizState.current >= quizState.questions.length) {
      endQuiz();
    } else {
      renderQuizQuestion(document.getElementById('main-content'));
    }
  }, 1200);
};

function endQuiz() {
  if (quizState && quizState.timerInterval) clearInterval(quizState.timerInterval);
  const el = document.getElementById('main-content');
  if (!quizState) { renderQuiz(el); return; }

  const pct = Math.round((quizState.score / quizState.questions.length) * 100);
  let msg = pct >= 80 ? 'Excellent! You really know your birds!' : pct >= 60 ? 'Good job! You\'re learning fast!' : 'Keep exploring — every birder starts somewhere!';

  el.innerHTML = `
    <div class="quiz-container">
      <div class="quiz-score fade-in">
        <h2>Quiz Complete!</h2>
        <div class="score-num">${quizState.score} / ${quizState.questions.length}</div>
        <p style="margin:var(--space-4) 0;color:var(--color-text-muted)">${msg}</p>

        <div style="margin:var(--space-6) 0;text-align:left">
          ${quizState.answers.map((a, i) => `
            <div style="padding:var(--space-3);border-bottom:1px solid var(--color-divider);display:flex;gap:var(--space-3);align-items:start">
              <span style="font-size:var(--text-lg)">${a.isCorrect ? '✓' : '✗'}</span>
              <div>
                <p style="font-weight:600;margin-bottom:var(--space-1)">${a.question}</p>
                ${!a.isCorrect ? `<p style="color:var(--color-danger);font-size:var(--text-sm)">Your answer: ${a.selected}</p>` : ''}
                <p style="color:var(--color-success);font-size:var(--text-sm)">Correct: ${a.correct}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:var(--space-3);justify-content:center;flex-wrap:wrap">
          <button class="btn-primary" onclick="quizState=null;startQuiz()">Try Again</button>
          <a href="#birds" class="btn-secondary">Explore Birds</a>
        </div>
      </div>
    </div>`;
  quizState = null;
}

function renderSearch(el) {
  el.innerHTML = `
    <div class="section-header" style="text-align:center"><h2>Search</h2><p>Find birds, wildlife, and parks</p></div>
    <div class="search-input-wrap">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="search" id="search-input" placeholder="Search species, parks, habitats..." aria-label="Search" oninput="scheduleSearch()" autofocus>
    </div>
    <div id="search-results"></div>`;
}

window.scheduleSearch = function() {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer);
  searchDebounceTimer = window.setTimeout(() => {
    window.doSearch();
  }, 120);
};

window.doSearch = function() {
  const q = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const results = document.getElementById('search-results');
  if (!results) return;

  if (!q || q.length < 2) {
    results.innerHTML = '<div class="empty-state"><p>Type at least 2 characters to search</p></div>';
    return;
  }

  const matchBirds = SEARCH_INDEX.birds.filter((entry) => entry.haystack.includes(q)).map((entry) => entry.item);
  const matchWildlife = SEARCH_INDEX.wildlife.filter((entry) => entry.haystack.includes(q)).map((entry) => entry.item);
  const matchParks = SEARCH_INDEX.parks.filter((entry) => entry.haystack.includes(q)).map((entry) => entry.item);

  let html = '';
  if (matchBirds.length) {
    html += `<h3 style="font-family:var(--font-display);margin:var(--space-4) 0 var(--space-3);color:var(--color-primary)">Birds (${matchBirds.length})</h3>`;
    html += `<div class="card-grid">${matchBirds.map(b => birdCard(b)).join('')}</div>`;
  }
  if (matchWildlife.length) {
    html += `<h3 style="font-family:var(--font-display);margin:var(--space-6) 0 var(--space-3);color:var(--color-primary)">Wildlife (${matchWildlife.length})</h3>`;
    html += `<div class="card-grid">${matchWildlife.map(w => wildlifeCard(w)).join('')}</div>`;
  }
  if (matchParks.length) {
    html += `<h3 style="font-family:var(--font-display);margin:var(--space-6) 0 var(--space-3);color:var(--color-primary)">Parks (${matchParks.length})</h3>`;
    html += `<div class="card-grid">${matchParks.map(p => parkCard(p)).join('')}</div>`;
  }

  if (!html) {
    html = '<div class="empty-state"><h3>No results found</h3><p>Try a different search term</p></div>';
  }

  results.innerHTML = html;
};

function renderAbout(el) {
  el.innerHTML = `
    <div class="about-content">
      <div class="section-header"><h2>About This Guide</h2></div>

      <div class="learn-section">
        <h2>Purpose</h2>
        <p>Birds of Yorba Linda is an educational resource designed to help residents and visitors discover the remarkable birdlife and wildlife of Yorba Linda, California. Yorba Linda sits at a unique ecological crossroads where coastal sage scrub, oak woodland, grassland, and riparian habitats converge — creating exceptional biodiversity.</p>
        <p>This site is not a live bird tracker. It presents documented species data compiled from authoritative sources to help you know what to look for and where.</p>
      </div>

      <div class="learn-section methodology-section">
        <h2>Methodology</h2>
        <h3>Species Selection</h3>
        <p>Species inclusion follows a high-confidence standard based on documented eBird records for Orange County (US-CA-059), the Avibase checklist for Chino Hills State Park, the Sea and Sage Audubon Society's birding guide for Orange County, and multiple specialist sources. Each species has documented records from local hotspots within approximately 30 miles of downtown Yorba Linda.</p>

        <h3>Encounter Odds</h3>
        <ul>
          <li><strong>Very likely</strong> — Present on >75% of appropriate visits in season</li>
          <li><strong>Likely</strong> — Present on 40–75% of appropriate visits</li>
          <li><strong>Possible</strong> — Present on 15–40% of appropriate visits</li>
          <li><strong>Uncommon</strong> — Present on <15% of visits; requires searching</li>
          <li><strong>Rare</strong> — <10 records per year in area; but well-documented</li>
        </ul>

        <h3>Seasonality Assessment</h3>
        <p>Seasonality data is based on eBird frequency charts for Orange County, cross-referenced with Sea and Sage Audubon's published guides. Seasons are generalized — actual presence depends on weather, habitat conditions, and individual variation.</p>

        <h3>Source Hierarchy</h3>
        <p>Primary sources in order of authority: eBird/Cornell Lab, Sea and Sage Audubon Society, California Department of Fish and Wildlife, Chino Hills State Park Interpretive Association, and published specialist birding blogs with verified records.</p>
      </div>

      <div class="learn-section">
        <h2>Primary Sources</h2>
        <ul>
          <li><a href="https://ebird.org/region/US-CA-059/bird-list" target="_blank" rel="noopener noreferrer">eBird — Orange County Bird List</a></li>
          <li><a href="https://seaandsageaudubon.org/" target="_blank" rel="noopener noreferrer">Sea and Sage Audubon Society</a></li>
          <li><a href="https://www.allaboutbirds.org/" target="_blank" rel="noopener noreferrer">Cornell Lab of Ornithology — All About Birds</a></li>
          <li><a href="https://www.chinohillsstatepark.org/natural-resources/birds" target="_blank" rel="noopener noreferrer">Chino Hills State Park — Birds</a></li>
          <li><a href="https://avibase.bsc-eoc.org/checklist.jsp?region=USca43&list=howardmoore" target="_blank" rel="noopener noreferrer">Avibase — Chino Hills State Park Checklist</a></li>
          <li><a href="https://www.ochabitats.org/post/orange-county-s-birds-of-prey" target="_blank" rel="noopener noreferrer">OC Habitats — Birds of Prey</a></li>
          <li><a href="https://wildlife.ca.gov/Conservation/Birds/Raptors" target="_blank" rel="noopener noreferrer">CDFW — Raptors of California</a></li>
          <li><a href="https://www.10000birds.com/yorba-linda-birding.htm" target="_blank" rel="noopener noreferrer">10,000 Birds — Yorba Linda Birding</a></li>
        </ul>
      </div>

      <div class="learn-section">
        <p style="font-style:italic;color:var(--color-text-muted)">Document compiled March 2026 for educational website use. All species inclusions are based on documented records from sites within approximately 30 miles of downtown Yorba Linda, California. For any professional wildlife survey or regulatory use, consult a licensed wildlife biologist.</p>
      </div>
    </div>`;
}

// ===== IMAGE LOADER =====
// Use a simple, reliable loading strategy:
// - load above-the-fold images immediately
// - observe the rest and swap in src when they near the viewport
// This avoids the current "refresh to see images" behavior while still
// keeping the page reasonably light.
const IMG_EAGER_COUNT = 8;

function markImageLoaded(img) {
  img.dataset.loaded = 'true';
  img.dataset.error = '';
  if (img.parentElement) img.parentElement.classList.remove('img-error');
}

function loadImage(img, priority = 'auto') {
  if (!img || !img.dataset.src || img.dataset.loaded === 'true' || img.dataset.loaded === 'pending') return;
  img.dataset.loaded = 'pending';
  img.loading = priority === 'high' ? 'eager' : 'lazy';
  try { img.fetchPriority = priority; } catch (e) {}
  img.src = img.dataset.src;
}

const imgObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const img = entry.target;
    imgObserver.unobserve(img);
    loadImage(img, 'auto');
  });
}, { rootMargin: '500px 0px' });

function setupRetry(img) {
  const retries = parseInt(img.dataset.retries || '0', 10);
  if (retries < 2 && img.dataset.src) {
    const delay = (retries + 1) * 2500;
    setTimeout(() => {
      img.dataset.retries = String(retries + 1);
      img.dataset.error = '';
      img.dataset.loaded = '';
      if (img.parentElement) img.parentElement.classList.remove('img-error');
      img.removeAttribute('src');
      const rect = img.getBoundingClientRect();
      const nearViewport = rect.top < window.innerHeight + 500 && rect.bottom > -500;
      if (nearViewport) {
        loadImage(img, 'high');
      } else {
        imgObserver.observe(img);
      }
    }, delay);
  }
}

document.addEventListener('load', (e) => {
  if (e.target.tagName === 'IMG' && e.target.dataset.src) {
    markImageLoaded(e.target);
  }
}, true);

document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG' && e.target.dataset.src) {
    e.target.dataset.error = 'true';
    if (e.target.parentElement) e.target.parentElement.classList.add('img-error');
    setupRetry(e.target);
  }
}, true);

function activateLazyImages() {
  const images = Array.from(document.querySelectorAll('#main-content img[data-src]'));
  images.forEach((img, index) => {
    if (!img.dataset.src) {
      img.dataset.error = 'true';
      if (img.parentElement) img.parentElement.classList.add('img-error');
      return;
    }
    if (img.dataset.loaded === 'true' || img.dataset.loaded === 'pending') return;

    const rect = img.getBoundingClientRect();
    const nearViewport = rect.top < window.innerHeight + 500 && rect.bottom > -500;

    if (index < IMG_EAGER_COUNT || nearViewport) {
      loadImage(img, 'high');
    } else {
      imgObserver.observe(img);
    }
  });
}

// Observe DOM changes to activate images after route changes and filter/search updates
const routeObserver = new MutationObserver(() => {
  requestAnimationFrame(activateLazyImages);
});

// ===== INIT =====
function startApp() {
  init();
  const appEl = document.getElementById('main-content');
  if (appEl) routeObserver.observe(appEl, { childList: true, subtree: true });
  activateLazyImages();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

})();
