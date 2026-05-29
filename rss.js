const SITE_URL = 'https://birds.friendofgrogu.workers.dev';

export const RSS_CONFIG = {
  title: 'Birds of Yorba Linda — Rare Sightings & Field Notes',
  link: `${SITE_URL}/`,
  description: 'Curated rare sightings, field notes, and birding updates from Yorba Linda. Educational resource; not a live bird tracker.',
  feedUrl: `${SITE_URL}/feed.xml`,
  language: 'en-us',
  generator: 'Birds of Yorba Linda',
  maxItems: 25
};

export const RSS_FEED_ITEMS = [
  {
    title: 'Rare Raptor Observation in the Yorba Linda Area',
    slug: 'rare-raptor-observation-yorba-linda-area',
    date: '2026-05-20T16:00:00Z',
    type: 'rare-sighting',
    species: ['Peregrine Falcon'],
    generalLocation: 'Yorba Linda area',
    summary: 'A rare raptor was noted in the broader Yorba Linda area. Precise location details are withheld to reduce disturbance.',
    sensitive: true,
    url: '/#bird/peregrine-falcon'
  },
  {
    title: 'Late Spring Migrants Along the Santa Ana River Corridor',
    slug: 'late-spring-migrants-santa-ana-river-corridor',
    date: '2026-05-12T16:00:00Z',
    type: 'field-note',
    species: ["Wilson's Warbler", 'Western Tanager'],
    generalLocation: 'Santa Ana River Corridor',
    summary: 'A curated field note about notable late-spring migrant activity using general corridor-level location only.',
    sensitive: false,
    url: '/#rare'
  },
  {
    title: 'Burrowing Owl Profile Updated With Ethics Notes',
    slug: 'burrowing-owl-profile-ethics-update',
    date: '2026-04-24T16:00:00Z',
    type: 'bird-profile-update',
    species: ['Burrowing Owl'],
    generalLocation: 'Yorba Linda area',
    summary: 'The Burrowing Owl profile highlights identification, habitat context, and the need to avoid disturbance around sensitive sites.',
    sensitive: true,
    url: '/#bird/burrowing-owl'
  },
  {
    title: 'Seasonal Note: Spring Movement Through Local Parks',
    slug: 'spring-movement-through-local-parks',
    date: '2026-03-18T16:00:00Z',
    type: 'seasonal-note',
    species: ['Allen\'s Hummingbird', 'Black Phoebe', 'Bullock\'s Oriole'],
    generalLocation: 'Yorba Linda parks and neighborhoods',
    summary: 'Spring brings increased song, nesting activity, and movement through local parks and neighborhood habitat. Observe from a respectful distance.',
    sensitive: false,
    url: '/#learn'
  },
  {
    title: 'Chino Hills State Park Guide Added to Birding Hotspots',
    slug: 'chino-hills-state-park-guide-added',
    date: '2026-02-28T16:00:00Z',
    type: 'park-guide',
    species: ['California Gnatcatcher', 'California Quail', 'Cactus Wren'],
    generalLocation: 'Chino Hills State Park area',
    summary: 'A hotspot guide summarizes habitat, likely species groups, and general trip-planning context for the Chino Hills State Park area.',
    sensitive: false,
    url: '/#park/chino-hills-state-park'
  },
  {
    title: 'Winter Waterbird Notes for Regional Lakes and Wetlands',
    slug: 'winter-waterbird-notes-regional-lakes-wetlands',
    date: '2026-01-22T16:00:00Z',
    type: 'field-note',
    species: ['Western Grebe', 'Double-crested Cormorant', 'American Coot'],
    generalLocation: 'Regional lakes and wetlands',
    summary: 'A seasonal field note on winter waterbirds at larger water bodies and wetlands in the broader Yorba Linda birding area.',
    sensitive: false,
    url: '/#birds'
  }
];

const TYPE_LABELS = {
  'rare-sighting': 'Rare Sightings',
  'field-note': 'Field Notes',
  'seasonal-note': 'Seasonal Notes',
  'park-guide': 'Park Guides',
  'bird-profile-update': 'Bird Profile Updates'
};

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAbsoluteUrl(url) {
  return new URL(url, RSS_CONFIG.link).href;
}

function toRssDate(value) {
  return new Date(value).toUTCString();
}

function itemDateValue(item) {
  return new Date(item.updated || item.date).getTime();
}

function ethicalSummary(item) {
  const summary = item.summary || '';
  if (!item.sensitive) return summary;

  const withheld = 'Precise location details are withheld to reduce disturbance.';
  return summary.includes(withheld) ? summary : `${summary} ${withheld}`;
}

function itemCategories(item) {
  return [
    TYPE_LABELS[item.type] || item.type,
    item.generalLocation,
    ...(Array.isArray(item.species) ? item.species : [])
  ].filter(Boolean);
}

function renderItem(item) {
  const absoluteUrl = toAbsoluteUrl(item.url || `/updates/${item.slug}`);
  const description = ethicalSummary(item);
  const categories = itemCategories(item)
    .map((category) => `      <category>${escapeXml(category)}</category>`)
    .join('\n');

  return [
    '    <item>',
    `      <title>${escapeXml(item.title)}</title>`,
    `      <link>${escapeXml(absoluteUrl)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(absoluteUrl)}</guid>`,
    `      <pubDate>${escapeXml(toRssDate(item.date))}</pubDate>`,
    `      <description>${escapeXml(description)}</description>`,
    categories,
    '    </item>'
  ].filter(Boolean).join('\n');
}

export function getSortedFeedItems(items = RSS_FEED_ITEMS) {
  return [...items]
    .sort((a, b) => itemDateValue(b) - itemDateValue(a))
    .slice(0, RSS_CONFIG.maxItems);
}

export function buildRssFeed({ now = new Date(), items = RSS_FEED_ITEMS } = {}) {
  const renderedItems = getSortedFeedItems(items).map(renderItem).join('\n\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(RSS_CONFIG.title)}</title>`,
    `    <link>${escapeXml(RSS_CONFIG.link)}</link>`,
    `    <description>${escapeXml(RSS_CONFIG.description)}</description>`,
    `    <language>${escapeXml(RSS_CONFIG.language)}</language>`,
    `    <lastBuildDate>${escapeXml(toRssDate(now))}</lastBuildDate>`,
    `    <generator>${escapeXml(RSS_CONFIG.generator)}</generator>`,
    '',
    renderedItems,
    '  </channel>',
    '</rss>',
    ''
  ].join('\n');
}
