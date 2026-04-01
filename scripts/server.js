const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const archiver = require('archiver');

const app = express();
const PORT = 3000;
const ROOT = path.join(__dirname, '..');

app.use(express.json({ limit: '50mb' }));

// ── Static assets ──────────────────────────────────────────────
app.use('/output',        express.static(path.join(ROOT, 'output')));
app.use('/visualizadores', express.static(path.join(ROOT, 'visualizadores')));
app.use('/apresentacao',   express.static(path.join(ROOT, 'apresentacao')));
app.use('/docs',           express.static(path.join(ROOT, 'docs')));

// ── Index ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const list = (dir) => {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return [];
    return fs.readdirSync(full).filter(f => f.endsWith('.html')).map(f => ({ file: f, url: `/${dir}/${f}` }));
  };

  const visualizadores = list('visualizadores');
  const apresentacao   = list('apresentacao');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>ADA — The Space</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d0d0d; font-family: 'SF Mono', 'Fira Code', monospace; padding: 40px; color: #aaa; }
  h1 { color: #f0a500; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 32px; }
  h2 { font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: #555; margin-bottom: 12px; }
  section { margin-bottom: 32px; }
  a { display: block; color: #888; font-size: 12px; text-decoration: none; padding: 8px 12px; border: 1px solid #222; border-radius: 4px; margin-bottom: 6px; transition: border-color .15s, color .15s; }
  a:hover { border-color: #f0a500; color: #f0a500; }
  .empty { font-size: 11px; color: #333; padding: 8px 0; }
</style>
</head>
<body>
<h1>The Space — Pixel Map</h1>

<section>
  <h2>Visualizadores</h2>
  ${visualizadores.length
    ? visualizadores.map(f => `<a href="${f.url}" target="_blank">${f.file}</a>`).join('')
    : '<p class="empty">nenhum arquivo</p>'}
</section>

<section>
  <h2>Apresentação (cliente)</h2>
  ${apresentacao.length
    ? apresentacao.map(f => `<a href="${f.url}" target="_blank">${f.file}</a>`).join('')
    : '<p class="empty">nenhum arquivo</p>'}
</section>

</body>
</html>`;

  res.send(html);
});

// ── GET /download/pixelmap ────────────────────────────────────
app.get('/download/pixelmap', (req, res) => {
  const file = path.join(ROOT, 'output', 'pixel-maps', 'principal', 'thespace-imersiva-principal-pixelmap.png');
  if (!fs.existsSync(file)) return res.status(404).send('Pixel map não encontrado. Rode: npm run gerar');
  res.download(file, 'thespace-imersiva-principal-pixelmap.png');
});

// ── GET /download/projeto ─────────────────────────────────────
app.get('/download/projeto', (req, res) => {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="thespace-pixelmap-projeto.zip"');

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', err => { console.error(err); res.status(500).end(); });
  archive.pipe(res);

  const add = (src, dest) => {
    if (fs.existsSync(src)) archive.file(src, { name: dest });
    else console.warn('[zip] não encontrado:', src);
  };

  add(
    path.join(ROOT, 'output', 'pixel-maps', 'principal', 'thespace-imersiva-principal-pixelmap.png'),
    'pixel-map/thespace-imersiva-principal-pixelmap.png'
  );
  add(
    path.join(ROOT, 'output', 'after-effects', 'PIXEL_MAP_THE_SPACE.aep'),
    'after-effects/PIXEL_MAP_THE_SPACE.aep'
  );
  add(
    path.join(ROOT, 'output', 'blender', 'the_space_preview.blend'),
    'blender/the_space_preview.blend'
  );
  add(
    path.join(ROOT, 'output', 'midias', 'ikeda-antivj_particles_v1_h264.mp4'),
    'assets/ikeda-antivj_particles_v1_h264.mp4'
  );

  archive.finalize();
});

// ── POST /salvar-pixelmap ──────────────────────────────────────
// Body: { sala: "principal" | "reuniao", nome: "filename.png", data: "data:image/png;base64,..." }
app.post('/salvar-pixelmap', (req, res) => {
  const { sala, nome, data } = req.body;

  if (!sala || !nome || !data) {
    return res.status(400).json({ erro: 'sala, nome e data são obrigatórios' });
  }

  const salas = ['principal', 'reuniao'];
  if (!salas.includes(sala)) {
    return res.status(400).json({ erro: `sala inválida — use: ${salas.join(', ')}` });
  }

  const base64 = data.replace(/^data:image\/png;base64,/, '');
  const dir = path.join(ROOT, 'output', 'pixel-maps', sala);
  const filePath = path.join(dir, nome.endsWith('.png') ? nome : nome + '.png');

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));

  console.log(`[salvo] ${filePath}`);
  res.json({ ok: true, caminho: filePath });
});

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nADA local server — http://localhost:${PORT}\n`);
});
