const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const helmet = require("helmet");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        frameAncestors: ["*." + process.env.SITE_ADDRESS]
      },
    },
  })
);

app.use(
  "/",
  createProxyMiddleware({
    target: "https://classic.clinicaltrials.gov/",
    changeOrigin: true,
  })
);
app.listen(3000);
