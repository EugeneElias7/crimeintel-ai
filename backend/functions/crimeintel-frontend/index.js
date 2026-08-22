const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const staticDir = __dirname;
const indexPath = path.join(staticDir, 'index.html');

app.use(express.static(staticDir, { maxAge: '1h' }));

app.get('*', (req, res) => {
  if (req.path.startsWith('/server/')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  fs.readFile(indexPath, 'utf8', (err, content) => {
    if (err) { res.status(500).send('Internal error'); return; }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(content);
  });
});

module.exports = function(req, res) { app(req, res); };