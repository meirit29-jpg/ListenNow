const express = require("express");
const contentSourcesService = require("../services/contentSourcesService");

const router = express.Router();

// GET /api/content/catalog?interests=AI וטכנולוגיה,כדורגל
// Returns every content item from every real source, in the exact
// shape listennow.html's CONTENT_SEED already uses — the frontend can
// swap its local array for the `items` from this response with no
// other code changes. `interests` is optional and comma-separated;
// when omitted, adapters that support it use their own defaults.
// Falls back to mock data automatically (usedMockFallback: true) when
// no real source returns anything.
router.get("/catalog", async (req, res) => {
  try {
    const interests = typeof req.query.interests === "string"
      ? req.query.interests.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const { items, errors, usedMockFallback } = await contentSourcesService.getCatalog({ interests });
    res.json({ items, errors, usedMockFallback });
  } catch (err) {
    res.status(500).json({ error: "Failed to build content catalog" });
  }
});

// GET /api/content/sources
// Metadata about which sources exist and which are currently active —
// replaces the static ContentSources.descriptions object that lives in
// listennow.html's Settings screen today.
router.get("/sources", (req, res) => {
  res.json({ sources: contentSourcesService.getSourcesInfo() });
});

module.exports = router;
