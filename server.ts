import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import fetch from 'node-fetch';
import crypto from 'crypto';
import path from 'path';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);

  const PORT = 3000;
  const MONITOR_URL = 'https://example.com';
  const INTERVAL = 30000; // 30 seconds

  let lastHash: string | null = null;

  function hashContent(content: string) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async function checkWebsite() {
    try {
      console.log(`[Monitor] Checking ${MONITOR_URL}...`);
      const res = await fetch(MONITOR_URL);
      const text = await res.text();
      const newHash = hashContent(text);

      let status = 'no-change';
      if (!lastHash) {
        status = 'first-scan';
      } else if (lastHash !== newHash) {
        status = 'changed';
      }

      lastHash = newHash;

      io.emit('update', {
        status,
        time: new Date().toLocaleTimeString(),
        url: MONITOR_URL
      });
      console.log(`[Monitor] Status: ${status} at ${new Date().toLocaleTimeString()}`);
    } catch (err: any) {
      io.emit('update', {
        status: 'error',
        error: err.message,
        time: new Date().toLocaleTimeString(),
        url: MONITOR_URL
      });
      console.error(`[Monitor] Error: ${err.message}`);
    }
  }

  // Initial check and interval
  checkWebsite();
  setInterval(checkWebsite, INTERVAL);

  // API Routes
  app.get('/api/status', (req, res) => {
    res.json({ lastHash, url: MONITOR_URL });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
