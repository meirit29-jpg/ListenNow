/**
 * This is ContentSources, promoted from the frontend-only description
 * object it was in listennow.html into the real abstraction layer.
 *
 * Nothing outside this file should know that individual adapters
 * exist. Routes call getCatalog()/getSourcesInfo() and get back plain
 * data — they never import an adapter directly.
 *
 * Design: REAL_ADAPTERS are queried first. mockAdapter is deliberately
 * NOT in that list — it is only ever used as an automatic fallback,
 * when every real adapter returns zero items (no API key configured,
 * every real source failing, or simply none implemented yet). This
 * keeps "real data in production" and "mock data for local/test runs
 * without credentials" as the same code path, with no separate flag
 * to remember to flip.
 *
 * To add a real source later: implement its adapter's fetchItems(),
 * then add it to REAL_ADAPTERS below. Nothing else changes.
 */

const mockAdapter = require("../adapters/mockAdapter");
const youtubeAdapter = require("../adapters/youtubeAdapter");
const podcastRssAdapter = require("../adapters/podcastRssAdapter");
const newsApiAdapter = require("../adapters/newsApiAdapter");
const genericRssAdapter = require("../adapters/genericRssAdapter");
const websiteScraperAdapter = require("../adapters/websiteScraperAdapter");
const config = require("../config/env");

const REAL_ADAPTERS = [
  youtubeAdapter,
  podcastRssAdapter,
  newsApiAdapter,
  genericRssAdapter,
  websiteScraperAdapter,
];

/**
 * @param {Object} [options]
 * @param {string[]} [options.interests] - category names to search for,
 *   forwarded to any adapter that accepts them (currently youtubeAdapter).
 *   Adapters that don't use interests (RSS, stubs) just ignore the field.
 */
async function getCatalog({ interests } = {}) {
  const results = await Promise.allSettled(
    REAL_ADAPTERS.map((adapter) => adapter.fetchItems({ interests }))
  );

  const items = [];
  const errors = [];

  results.forEach((result, i) => {
    const adapterName = REAL_ADAPTERS[i].name;
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      // One failing source should never take down the whole catalog.
      errors.push({ source: adapterName, message: result.reason?.message ?? String(result.reason) });
    }
  });

  if (items.length > 0) {
    return { items, errors, usedMockFallback: false };
  }

  // No real source produced anything — expected when no API key is
  // configured yet, or every real source is still a stub/failing.
  // Fall back to mock data so the product/tests still have content,
  // rather than silently returning an empty catalog.
  const mockItems = await mockAdapter.fetchItems();
  return { items: mockItems, errors, usedMockFallback: true };
}

function getSourcesInfo() {
  return [
    { name: "youtube", type: "real", configured: Boolean(config.youtube.apiKey) },
    { name: "podcastRss", type: "real", configured: false },
    { name: "newsApi", type: "real", configured: Boolean(config.newsApi.apiKey) },
    { name: "genericRss", type: "real", configured: false },
    { name: "websiteScraper", type: "real", configured: false },
    { name: "mock", type: "fallback", configured: true },
  ];
}

module.exports = { getCatalog, getSourcesInfo };
