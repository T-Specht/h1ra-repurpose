const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const helmet = require("helmet");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        // defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        defaultSrc: "* data: mediastream: blob: filesystem: about: ws: wss: 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline'",
        scriptSrc: "* data: blob: 'unsafe-inline' 'unsafe-eval'",
        connectSrc: "* data: blob: 'unsafe-inline'",
        imgSrc: "* data: blob: 'unsafe-inline'",
        frameSrc: "* data: blob:",
        styleSrc: "* data: blob: 'unsafe-inline'",
        fontSrc: "* data: blob: 'unsafe-inline'",
        //frameAncestors: "* data: blob: 'unsafe-inline'",
        frameAncestors: ["*." + process.env.SITE_ADDRESS],
      },
    },
  })
);

app.use(
  "/",
  createProxyMiddleware({
    target: "https://classic.clinicaltrials.gov/",
    changeOrigin: true,
    logLevel: 'debug'
  })
);
app.listen(3000);
