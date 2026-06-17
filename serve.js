#!/usr/bin/env node
/*
 * serve.js — Mini serveur local pour tester le site (pas nécessaire pour déployer).
 * Lancer : npm run serve   puis ouvrir http://localhost:8080
 * (On ne peut pas ouvrir index.html en double-clic car le navigateur bloque fetch() en file://)
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const PORT = process.env.PORT || 8080;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

createServer(async (req, res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") url = "/index.html";
  const path = join(process.cwd(), normalize(url).replace(/^(\.\.[/\\])+/, ""));
  try {
    const data = await readFile(path);
    res.setHeader("Content-Type", TYPES[extname(path)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end("404 — fichier introuvable : " + url);
  }
}).listen(PORT, () => console.log("✅ Site dispo sur http://localhost:" + PORT));
