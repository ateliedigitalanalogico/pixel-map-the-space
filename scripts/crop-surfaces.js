const sharp = require('sharp');
const path = require('path');

const src = path.join(__dirname, '..', 'pixel-maps', 'thespace-imersiva-principal-pixelmap.png');
const out = path.join(__dirname, '..', 'pixel-maps');

// Coordenadas no PNG (origem topo-esquerda):
// P4 e P2 estão rotacionadas no PNG (-90° e +90°), corrigimos com rotate
const surfaces = [
  { name: 'P1_Frente',   left: 1218, top: 0,    width: 2160, height: 1218, rotate: 0   },
  { name: 'P2_Direita',  left: 3378, top: 1218, width: 1218, height: 1908, rotate: -90 },
  { name: 'P3_Fundo',    left: 1218, top: 3126, width: 2160, height: 1218, rotate: 180 },
  { name: 'P4_Esquerda', left: 0,    top: 1218, width: 1218, height: 1908, rotate: 90  },
  { name: 'Piso',        left: 1218, top: 1218, width: 2160, height: 1908, rotate: 0   },
];

async function run() {
  for (const s of surfaces) {
    const outPath = path.join(out, `surf_${s.name}.png`);
    let pipeline = sharp(src).extract({ left: s.left, top: s.top, width: s.width, height: s.height });
    if (s.rotate !== 0) pipeline = pipeline.rotate(s.rotate);
    await pipeline.toFile(outPath);
    console.log(`OK: ${s.name} → surf_${s.name}.png`);
  }
  console.log('DONE');
}

run().catch(console.error);
