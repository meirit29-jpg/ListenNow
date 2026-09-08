const express = require("express");
const cors = require("cors");
const config = require("./config/env");
const contentRoutes = require("./routes/content.routes");

const app = express();

// Open CORS for local/dev (no FRONTEND_ORIGIN set => "*"). In
// production, set FRONTEND_ORIGIN to the deployed frontend's exact
// origin so only that site can call this API.
app.use(cors({ origin: config.frontendOrigin || "*" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/content", contentRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`ListenNow backend listening on port ${config.port}`);
  });
}

module.exports = app;
