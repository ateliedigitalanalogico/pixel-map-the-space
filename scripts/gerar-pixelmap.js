/**
 * Gera o pixel map da Imersiva Principal — The Space
 * Salva PNG em pixel-maps/thespace-imersiva-principal-pixelmap.png
 *
 * Uso: node scripts/gerar-pixelmap.js
 *
 * Dimensões reais:
 *   Escala: 8,6m = 2160px → 251,16 px/m
 *   P1 / P3 (Frente / Fundo):  2160 × 1218 px  (8,6 × 4,85m)
 *   P2 / P4 (Direita / Esq.):  1908 × 1218 px  (7,6 × 4,85m)
 *   Piso:                       2160 × 1908 px  (8,6 × 7,6m)
 *   Canvas total:               4596 × 4344 px
 */

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

// Embeda Consolas como base64 para librsvg usar a fonte correta
const FONT_DIR = path.join(__dirname, '..', 'fonts');
const fontB64  = fs.readFileSync(path.join(FONT_DIR, 'Consolas.ttf')).toString('base64');
const fontBoldB64 = fs.readFileSync(path.join(FONT_DIR, 'Consolas-Bold.ttf')).toString('base64');
const FONT_FACE = `
  <style>
    @font-face {
      font-family: 'Consolas';
      font-weight: normal;
      src: url('data:font/truetype;base64,${fontB64}') format('truetype');
    }
    @font-face {
      font-family: 'Consolas';
      font-weight: bold;
      src: url('data:font/truetype;base64,${fontBoldB64}') format('truetype');
    }
  </style>`;

// ── Configurações ────────────────────────────────────────
const W  = 4596;   // canvas total
const H  = 4344;
const GS = 36;     // grid step (px)
const SW = 3;      // stroke-width grid

const COLORS = {
  p1:   '#1e5fa0',
  p4:   '#a06020',
  piso: '#8a2020',
  p2:   '#207840',
  p3:   '#5a2090',
};

// ── Superfícies ──────────────────────────────────────────
const surfaces = [
  { id:'p1',   x:1218, y:0,    w:2160, h:1218, fill:COLORS.p1,   label:'P1',   dims:'2160 × 1218 px', phys:'8,6 × 4,85 m', rot:0   },
  { id:'p4',   x:0,    y:1218, w:1218, h:1908, fill:COLORS.p4,   label:'P4',   dims:'1908 × 1218 px', phys:'7,6 × 4,85 m', rot:-90 },
  { id:'piso', x:1218, y:1218, w:2160, h:1908, fill:COLORS.piso, label:'PISO', dims:'2160 × 1908 px', phys:'8,6 × 7,6 m',  rot:0   },
  { id:'p2',   x:3378, y:1218, w:1218, h:1908, fill:COLORS.p2,   label:'P2',   dims:'1908 × 1218 px', phys:'7,6 × 4,85 m', rot:90  },
  { id:'p3',   x:1218, y:3126, w:2160, h:1218, fill:COLORS.p3,   label:'P3',   dims:'2160 × 1218 px', phys:'8,6 × 4,85 m', rot:180 },
];

// ── Gera SVG ─────────────────────────────────────────────
function buildSVG() {
  let rects = '';
  let texts = '';

  surfaces.forEach(s => {
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;

    rects += `
  <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${s.fill}"/>
  <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="url(#g)"/>
  <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="6"/>`;

    texts += `
  <g transform="rotate(${s.rot},${cx},${cy})">
    <text x="${cx}" y="${cy - 40}" fill="#ffffff" font-size="78" font-weight="bold" text-anchor="middle" font-family="Consolas, monospace">${s.label}</text>
    <text x="${cx}" y="${cy + 46}" fill="rgba(255,255,255,0.85)" font-size="66" text-anchor="middle" font-family="Consolas, monospace">${s.dims}</text>
    <text x="${cx}" y="${cy + 126}" fill="rgba(255,255,255,0.5)" font-size="54" text-anchor="middle" font-family="Consolas, monospace">${s.phys}</text>
  </g>`;
  });

  const fold = `stroke="rgba(255,255,255,0.1)" stroke-width="6" stroke-dasharray="30,24"`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${FONT_FACE}
<defs>
  <pattern id="g" x="0" y="0" width="${GS}" height="${GS}" patternUnits="userSpaceOnUse">
    <path d="M${GS},0 L0,0 0,${GS}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="${SW}"/>
  </pattern>
</defs>
${rects}
  <!-- linhas de dobra -->
  <line x1="1218" y1="1218" x2="1218" y2="3126" ${fold}/>
  <line x1="3378" y1="1218" x2="3378" y2="3126" ${fold}/>
  <line x1="1218" y1="1218" x2="3378" y2="1218" ${fold}/>
  <line x1="1218" y1="3126" x2="3378" y2="3126" ${fold}/>
${texts}
  <!-- resolução total — canto inferior direito -->
  <text x="3987" y="3700" fill="#555555" font-size="54" text-anchor="middle" font-family="Consolas, monospace">Resolução total</text>
  <text x="3987" y="3800" fill="#888888" font-size="66" font-weight="bold" text-anchor="middle" font-family="Consolas, monospace">4596 × 4344 px</text>
</svg>`;
}

// ── Executa ──────────────────────────────────────────────
async function main() {
  const outDir  = path.join(__dirname, '..', 'output', 'pixel-maps', 'principal');
  const outFile = path.join(outDir, 'thespace-imersiva-principal-pixelmap.png');

  fs.mkdirSync(outDir, { recursive: true });

  const svg = buildSVG();
  const buf = Buffer.from(svg, 'utf-8');

  console.log(`Gerando PNG ${W}×${H}px...`);

  await sharp(buf, { density: 72 })
    .png({ compressionLevel: 6 })
    .toFile(outFile);

  const stat = fs.statSync(outFile);
  const mb = (stat.size / 1024 / 1024).toFixed(1);
  console.log(`✓ Salvo: ${outFile}`);
  console.log(`  Tamanho: ${mb} MB`);
}

main().catch(err => {
  console.error('Erro ao gerar pixel map:', err.message);
  process.exit(1);
});
