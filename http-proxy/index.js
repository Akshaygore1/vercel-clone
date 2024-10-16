const express = require("express");
const httpProxy = require("http-proxy");

const app = express();
const PORT = 8000;

const BASE_PATH = "https://pub-3c8730f13dc04825a8cfa60ca62bd464.r2.dev";

const proxy = httpProxy.createProxy();

app.use((req, res) => {
  const hostname = req.hostname;
  const subdomain = hostname.split(".")[0];
  console.log("subdomain", subdomain);
  const name = subdomain;

  const resolvesTo = `${BASE_PATH}/${name}`;

  console.log("resolvesTo", resolvesTo);
  return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  const url = req.url;
  if (url === "/") proxyReq.path += "index.html";
});

app.listen(PORT, () =>
  console.log(`Reverse Proxy Running.. http://localhost:${PORT}`)
);
