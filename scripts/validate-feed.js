import { readFile } from 'node:fs/promises';
import { buildRssFeed, getSortedFeedItems, RSS_FEED_ITEMS } from '../rss.js';

const SITE_URL = 'https://birds.friendofgrogu.workers.dev/';
const feed = buildRssFeed({ now: new Date('2026-05-29T12:00:00Z') });
const homepage = await readFile(new URL('../index.html', import.meta.url), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function countMatches(input, pattern) {
  return (input.match(pattern) || []).length;
}

function extractBlocks(input, tag) {
  return [...input.matchAll(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'g'))].map((match) => match[0]);
}

function textFor(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1] : '';
}

assert(feed.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'Feed must start with an XML declaration.');
assert(feed.includes('<rss version="2.0">'), 'Feed must declare RSS 2.0.');
assert(countMatches(feed, /<channel>/g) === 1, 'Feed must contain one channel.');

const channel = textFor(feed, 'channel');
for (const tag of ['title', 'link', 'description', 'language', 'lastBuildDate']) {
  assert(channel.includes(`<${tag}>`), `Channel must include ${tag}.`);
}

assert(channel.includes('Educational resource; not a live bird tracker.'), 'Feed description must preserve editorial framing.');

const itemBlocks = extractBlocks(feed, 'item');
assert(itemBlocks.length > 0, 'Feed must include items.');
assert(itemBlocks.length <= 25, 'Feed must include no more than 25 items.');

for (const block of itemBlocks) {
  for (const tag of ['title', 'link', 'guid', 'pubDate', 'description']) {
    assert(new RegExp(`<${tag}[^>]*>[\\s\\S]+?<\\/${tag}>`).test(block), `Every item must include ${tag}.`);
  }

  const link = textFor(block, 'link');
  const guid = textFor(block, 'guid');
  assert(link.startsWith(SITE_URL), `Item link must be absolute: ${link}`);
  assert(guid.startsWith(SITE_URL), `Item guid must be absolute: ${guid}`);
  assert(!/[<>&](?!amp;|lt;|gt;|quot;|apos;)/.test(textFor(block, 'description')), 'Descriptions must escape XML special characters.');
}

const sortedDates = getSortedFeedItems().map((item) => new Date(item.updated || item.date).getTime());
for (let index = 1; index < sortedDates.length; index += 1) {
  assert(sortedDates[index - 1] >= sortedDates[index], 'Feed items must be sorted newest first.');
}

const riskySensitivePatterns = [
  /\b-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}\b/i,
  /\bnest at\b/i,
  /\broost at\b/i,
  /\bbehind parking lot\b/i,
  /\bexact location\b/i,
  /\b\d{1,6}\s+[A-Za-z0-9.'-]+\s+(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?)\b/i,
  /\bprivate property\b/i,
  /\bturn (left|right)\b/i,
  /\bfollow the trail\b/i
];

for (const item of RSS_FEED_ITEMS.filter((entry) => entry.sensitive)) {
  const block = itemBlocks.find((entry) => textFor(entry, 'title').includes(item.title.replace(/&/g, '&amp;')));
  assert(block, `Sensitive item missing from feed: ${item.title}`);
  const description = textFor(block, 'description');
  assert(description.includes('Precise location details are withheld to reduce disturbance.'), `Sensitive item must include withheld-location language: ${item.title}`);
  for (const pattern of riskySensitivePatterns) {
    assert(!pattern.test(description), `Sensitive item contains risky location wording: ${item.title}`);
  }
}

assert(homepage.includes('rel="alternate"') && homepage.includes('type="application/rss+xml"') && homepage.includes('https://birds.friendofgrogu.workers.dev/feed.xml'), 'Homepage must include RSS autodiscovery link.');
assert(homepage.includes('<a href="/feed.xml">RSS Feed</a>'), 'Footer or navigation must include visible RSS link.');

console.log('RSS feed validation passed.');
