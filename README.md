# The Space — Pixel Map

Pixel map para a sala imersiva **The Space**, gerado pela ADA Studio.

**Landing page:** https://ateliedigitalanalogico.github.io/pixel-map-the-space/

---

## Sala: Imersiva Principal

| Superfície | Resolução | Dimensão real |
|---|---|---|
| Piso | 2160 × 1908 px | 8,6 × 7,6 m |
| P1 — Frente | 2160 × 1218 px | 8,6 × 4,85 m |
| P2 — Direita | 1908 × 1218 px | 7,6 × 4,85 m |
| P3 — Fundo | 2160 × 1218 px | 8,6 × 4,85 m |
| P4 — Esquerda | 1908 × 1218 px | 7,6 × 4,85 m |
| **Canvas total** | **4596 × 4344 px** | **escala: 251 px/m** |

---

## Estrutura do repo

```
├── index.html                  ← landing page (GitHub Pages)
├── apresentacao/landing.html   ← versão com servidor local
├── output/
│   ├── pixel-maps/principal/   ← PNG do pixel map
│   ├── after-effects/          ← projeto .aep
│   ├── blender/                ← cena .blend
│   └── thespace-pixelmap-projeto.zip  ← ZIP leve (sem vídeo)
├── docs/                       ← screenshots para documentação
└── scripts/
    ├── server.js               ← servidor Express local
    ├── gerar-pixelmap.js       ← gera o PNG via sharp/SVG
    └── criar-preview-3d.jsx    ← monta comp PREVIEW 3D no AE
```

---

## Rodar localmente

```bash
npm install
npm run dev        # servidor em http://localhost:3000
npm run gerar      # regenera o PNG do pixel map
```

---

## Downloads

- **Pixel Map PNG** — disponível na landing page
- **Projeto completo** (AE + Blender + vídeo) — [GitHub Releases](https://github.com/ateliedigitalanalogico/pixel-map-the-space/releases/latest)
