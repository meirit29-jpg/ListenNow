/**
 * STUB — not implemented in this phase.
 * When implemented: will fetch and parse specific websites that have
 * no RSS feed and no public API, normalize extracted articles into
 * the ContentItem shape, and register itself in
 * services/contentSourcesService.js. Likely the last adapter to build —
 * scrapers are the most fragile and highest-maintenance source type.
 */

module.exports = {
  name: "websiteScraper",
  async fetchItems() {
    return [];
  },
};
