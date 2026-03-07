import express from "express";
import { createRouter } from "./api/routes";

export function createApp() {
  const app = express();
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (_req.method === 'OPTIONS') { res.sendStatus(200); return; }
    next();
  });
  app.use(express.json());
  app.use(createRouter());
  return app;
}
