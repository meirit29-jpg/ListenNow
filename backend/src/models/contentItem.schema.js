/**
 * Canonical shape every ContentSources adapter must return.
 * This mirrors CONTENT_SEED's source-provided fields in listennow.html
 * EXACTLY, so the frontend's ContentDatabase / RecommendationEngine /
 * UI code needs zero changes when it switches from the local mock
 * array to a fetch() call against this backend.
 *
 * Deliberately NOT included here: status, progress, userRating,
 * heardDaysAgo, rewatchRequested. Those are per-user consumption state
 * (owned by ConsumptionHistory / UserPreferences on the client), not
 * facts about the content itself — a content source has no idea
 * whether a given user has heard an item. Keeping that split now means
 * the future "sync history to backend" step is additive, not a rewrite.
 */

/**
 * @typedef {Object} ContentItem
 * @property {string|number} id           - unique within the combined catalog
 * @property {string} title
 * @property {string} description
 * @property {"YouTube"|"Podcast"|"News"|"RSS"|"Website"} source
 * @property {string} url                 - link to the original content
 * @property {number} duration            - minutes
 * @property {string} publishedAt         - ISO 8601 timestamp
 * @property {string} category
 * @property {number} popularity          - 0..1, normalized by the adapter
 * @property {string} [thumbnail]         - optional, image URL if the source provides one
 * @property {string} [channel]           - optional, publisher/channel name if the source provides one
 */

const CONTENT_ITEM_FIELDS = [
  "id", "title", "description", "source", "url",
  "duration", "publishedAt", "category", "popularity",
];

/**
 * Throws if an item is missing any required field. Adapters should call
 * this on every item they produce so a broken upstream source fails
 * fast and visibly instead of silently corrupting the catalog.
 */
function assertValidContentItem(item) {
  for (const field of CONTENT_ITEM_FIELDS) {
    if (item[field] === undefined || item[field] === null) {
      throw new Error(
        `Invalid content item from source "${item.source ?? "unknown"}": missing "${field}"`
      );
    }
  }
  return true;
}

module.exports = { CONTENT_ITEM_FIELDS, assertValidContentItem };
