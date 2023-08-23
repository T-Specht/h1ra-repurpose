const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(
  "/",
  createProxyMiddleware({
    target: "https://classic.clinicaltrials.gov/",
    changeOrigin: true,
  })
);
app.listen(3000);
