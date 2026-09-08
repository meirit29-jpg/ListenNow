/**
 * Real adapter — calls the YouTube Data API v3.
 *
 * The API key is read once from config/env.js (never from process.env
 * directly, never hardcoded). If no key is configured, or if YouTube
 * is unreachable/erroring, this adapter returns an empty list instead
 * of throwing — contentSourcesService already wraps every adapter in
 * Promise.allSettled, and falls back to mockAdapter automatically
 * whenever every real adapter returns zero items.
 *
 * No OAuth, no user YouTube account — this only reads public search
 * results with a server-side API key, per the current scope.
 */

const config = require("../config/env");
const { assertValidContentItem } = require("../models/contentItem.schema");

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

// Maps every category the app knows about (see ALL_INTERESTS in
// listennow.html) to a YouTube search query. To cover a new category,
// just add an entry here — nothing else in the adapter needs to change.
const CATEGORY_QUERIES = {
  "AI וטכנולוגיה": "בינה מלאכותית טכנולוגיה עדכונים",
  "כדורגל": "כדורגל highlights עדכונים",
  "ספורט": "ספורט אימון כושר עדכונים",
  "עסקים": "עסקים ניהול שוק ההון עדכונים",
  "יזמות": "יזמות סטארטאפ ראיון",
  "חדשות": "מהדורת חדשות עדכני",
  "רכבים": "רכב חדש סקירה מבחן דרכים",
  "כלכלה": "כלכלה ריבית שוק ההון",
  "מדע": "מדע גילוי חדש",
  "בריאות": "בריאות תזונה טיפים",
  "בידור": "בידור סרטים סדרות עדכונים",
  "פודקאסטים": "פודקאסט ישראלי פרק חדש",
  "YouTube": "תוכן פופולרי חדש",
};

// Categories searched when the caller doesn't specify interests —
// kept small on purpose to limit API quota usage per request.
const DEFAULT_CATEGORIES = ["AI וטכנולוגיה", "כדורגל", "רכבים", "עסקים"];

const RESULTS_PER_CATEGORY = 3;
const SEARCH_WINDOW_DAYS = 14; // "new videos" — only look back this far

/** "PT8M30S" / "PT1H2M" / "PT45S" -> whole minutes (min 1). */
function parseIsoDurationToMinutes(iso) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!match) return 1;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return Math.max(1, Math.round(hours * 60 + minutes + seconds / 60));
}

/** Rough 0..1 popularity from view count, log-scaled so it doesn't just
 *  reward whichever video went viral hardest. */
function estimatePopularity(viewCount) {
  const views = Number(viewCount);
  if (!views || Number.isNaN(views)) return 0.5;
  const score = Math.log10(views + 1) / 8;
  return Math.min(1, Math.max(0.05, score));
}

function resolveCategories(interests) {
  const requested = Array.isArray(interests) && interests.length > 0 ? interests : DEFAULT_CATEGORIES;
  const known = requested.filter((cat) => CATEGORY_QUERIES[cat]);
  const unknown = requested.filter((cat) => !CATEGORY_QUERIES[cat]);
  if (unknown.length > 0) {
    console.warn(`[youtubeAdapter] No search query mapped for categories: ${unknown.join(", ")} — skipping them.`);
  }
  return known.length > 0 ? known : DEFAULT_CATEGORIES;
}

async function searchVideoIds(query, apiKey) {
  const publishedAfter = new Date(Date.now() - SEARCH_WINDOW_DAYS * 24 * 3600 * 1000).toISOString();

  const url = new URL(YOUTUBE_SEARCH_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(RESULTS_PER_CATEGORY));
  url.searchParams.set("order", "date");
  url.searchParams.set("publishedAfter", publishedAfter);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube search.list failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return (data.items || []).map((item) => item.id?.videoId).filter(Boolean);
}

async function fetchVideoDetails(videoIds, apiKey) {
  if (videoIds.length === 0) return [];
  const url = new URL(YOUTUBE_VIDEOS_URL);
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube videos.list failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.items || [];
}

function toContentItem(video, category) {
  const item = {
    id: `yt-${video.id}`,
    title: video.snippet?.title ?? "(ללא כותרת)",
    description: (video.snippet?.description ?? "").slice(0, 300),
    source: "YouTube",
    url: `https://www.youtube.com/watch?v=${video.id}`,
    duration: parseIsoDurationToMinutes(video.contentDetails?.duration),
    publishedAt: video.snippet?.publishedAt ?? new Date().toISOString(),
    category,
    popularity: estimatePopularity(video.statistics?.viewCount),
    // Optional fields — not required by the schema (mock items don't
    // have them), included whenever YouTube provides them.
    thumbnail:
      video.snippet?.thumbnails?.medium?.url ||
      video.snippet?.thumbnails?.default?.url ||
      undefined,
    channel: video.snippet?.channelTitle || undefined,
  };
  assertValidContentItem(item);
  return item;
}

async function fetchCategory(category, query, apiKey) {
  let videoIds;
  try {
    videoIds = await searchVideoIds(query, apiKey);
  } catch (err) {
    // Missing/invalid key, quota exceeded, network error, etc. —
    // surface a clear reason without crashing this category's fetch.
    throw new Error(`search failed for "${category}": ${err.message}`);
  }
  const details = await fetchVideoDetails(videoIds, apiKey);
  return details.map((video) => toContentItem(video, category));
}

module.exports = {
  name: "youtube",
  /**
   * @param {Object} [params]
   * @param {string[]} [params.interests] - categories to search for.
   *   Falls back to DEFAULT_CATEGORIES when omitted or empty.
   */
  async fetchItems(params = {}) {
    const apiKey = config.youtube.apiKey;
    if (!apiKey) {
      // Expected in local/demo setups without a key configured yet.
      // contentSourcesService will fall back to mock data automatically.
      console.warn("[youtubeAdapter] YOUTUBE_API_KEY not set — skipping YouTube source.");
      return [];
    }

    const categories = resolveCategories(params.interests);

    const results = await Promise.allSettled(
      categories.map((category) => fetchCategory(category, CATEGORY_QUERIES[category], apiKey))
    );

    const items = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        items.push(...result.value);
      } else {
        console.warn(`[youtubeAdapter] ${result.reason?.message ?? result.reason}`);
      }
    });

    return items;
  },
};
