import http from 'http';
import fs from 'fs';
import path from 'path';
const root = process.argv[2] || '.';
const mime = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.svg':'image/svg+xml' };
http.createServer((req,res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const file = path.join(root, url);
  fs.readFile(file, (err,data) => {
    if (err) { res.statusCode = 404; res.end('not found'); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
}).listen(8099, () => console.log('http://localhost:8099'));
