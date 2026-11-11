// Servidor local sin dependencias para revisar el prototipo.
// Uso: node servidor.mjs [puerto]   →   http://localhost:5181 (o el puerto indicado)
// Responde peticiones por rangos, necesarias para adelantar o retroceder el video.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(fileURLToPath(new URL('./sitio', import.meta.url)));
const puerto = Number(process.argv[2]) || Number(process.env.PORT) || 5181;
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.webm': 'video/webm'
};

createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (ruta.endsWith('/')) ruta += 'index.html';
  const archivo = normalize(join(raiz, ruta));
  if (archivo !== raiz && !archivo.startsWith(raiz + sep)) { res.writeHead(403).end(); return; }

  let info;
  try { info = statSync(archivo); } catch { res.writeHead(404).end('No encontrado'); return; }
  if (!info.isFile()) { res.writeHead(404).end('No encontrado'); return; }

  const cab = { 'Content-Type': tipos[extname(archivo).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
  const rango = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (rango && (rango[1] || rango[2])) {
    let inicio = rango[1] ? Number(rango[1]) : info.size - Number(rango[2]);
    let fin = rango[1] && rango[2] ? Number(rango[2]) : info.size - 1;
    inicio = Math.max(0, inicio); fin = Math.min(fin, info.size - 1);
    if (inicio > fin) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end(); return; }
    res.writeHead(206, { ...cab, 'Content-Range': `bytes ${inicio}-${fin}/${info.size}`, 'Content-Length': fin - inicio + 1 });
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(archivo, { start: inicio, end: fin }).pipe(res);
    return;
  }
  res.writeHead(200, { ...cab, 'Content-Length': info.size });
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(archivo).pipe(res);
}).listen(puerto, () => console.log(`Prototipo en http://localhost:${puerto}`));
