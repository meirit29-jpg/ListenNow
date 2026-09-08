/**
 * Single place that reads secrets from process.env.
 * Nothing else in the codebase should touch process.env directly —
 * adapters receive whatever they need as function arguments instead.
 * This makes it trivial to grep for "process.env" during review and
 * confirm secrets never leak past this file.
 */

function getEnv(name, { required = false, fallback = undefined } = {}) {
  const value = process.env[name];
  if (!value) {
    if (required) {
      // Fail loudly at startup rather than silently at request time.
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return fallback;
  }
  return value;
}

const config = {
  port: getEnv("PORT", { fallback: 3000 }),
  nodeEnv: getEnv("NODE_ENV", { fallback: "development" }),

  // youtube.apiKey is read by adapters/youtubeAdapter.js. Optional —
  // if unset, that adapter logs a warning and contributes zero items;
  // the server still starts and mockAdapter still serves content.
  youtube: {
    apiKey: getEnv("YOUTUBE_API_KEY"),
  },
  // Not used yet — no adapter reads this until newsApiAdapter.js is implemented.
  newsApi: {
    apiKey: getEnv("NEWS_API_KEY"),
  },
  // RSS adapters (podcast + generic) typically need no secret at all —
  // listed for symmetry with the other adapters.

  // CORS origin allowed to call this API. Left unset (=> "*", open) for
  // local/dev use. In production, set this to the deployed frontend's
  // exact origin (e.g. https://yourname.github.io) to lock it down —
  // see server.js for how this is applied.
  frontendOrigin: getEnv("FRONTEND_ORIGIN"),
};

module.exports = config;
