/**
 * @file server.ts
 * @description Express backend server supporting high-performance static asset serving
 * and Vite dev middleware integration.
 */

import express from "express";
import path from "path";
import dns from "dns";

// Ensure fast IPv4 DNS resolution
dns.setDefaultResultOrder("ipv4first");

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

// Configure Vite middleware / Static server
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend server active on http://0.0.0.0:${PORT}`);
  });
}

initServer();
