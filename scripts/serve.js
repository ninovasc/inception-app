import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const root = process.argv[2] || '.';
const mime = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.svg':'image/svg+xml' };

http.createServer((req,res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const file = path.join(root, url);
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; res.end('not found'); return; }
    const ext = path.extname(file);
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
    
    // Compressão gzip para arquivos de texto
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip') && (ext === '.html' || ext === '.css' || ext === '.js' || ext === '.json' || ext === '.svg' || ext === '.webmanifest')) {
      zlib.gzip(data, (err, compressed) => {
        if (err) { res.end(data); return; }
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        res.end(compressed);
      });
    } else {
      res.end(data);
    }
  });
}).listen(8099, () => console.log('http://localhost:8099'));