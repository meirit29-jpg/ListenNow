/**
 * Contract every ContentSources adapter must follow.
 * This file has no logic — it exists so the contract is written down
 * in one place and every adapter can be reviewed against it.
 *
 * An adapter:
 *   1. Is the ONLY code allowed to talk to its upstream provider
 *      (YouTube Data API, a podcast RSS feed, News API, etc).
 *   2. Receives any secret it needs as a function argument
 *      (never reads process.env itself — see config/env.js).
 *   3. Returns a Promise<ContentItem[]> using the exact shape defined
 *      in models/contentItem.schema.js — no source-specific fields
 *      leak past the adapter (extra optional fields like `thumbnail`
 *      or `channel` are fine when the source provides them).
 *   4. Accepts an optional params object — currently just
 *      { interests?: string[] } — and ignores any field it doesn't
 *      use. This lets contentSourcesService pass the same params to
 *      every adapter without each one needing to understand all of it.
 *   5. Never throws on a single bad upstream item — it should skip
 *      and log that item, not fail the whole fetch, so one broken
 *      feed can't take down the whole catalog.
 *
 * interface ContentSourceAdapter {
 *   name: string;                                            // e.g. "youtube"
 *   fetchItems(params?: { interests?: string[] }): Promise<ContentItem[]>;
 * }
 */

module.exports = {}; // documentation-only module
