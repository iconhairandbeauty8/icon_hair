const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Proxy all /api/* requests to the backend
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
}));

// Serve built frontend static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Proxying /api/* → ${API_URL}`);
});
