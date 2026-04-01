# Aprendizados — Pixel Map de Salas Imersivas
**Job:** The Space | **Atualizado:** 2026-04-01

---

## 1. Estrutura de pastas do job

```
job/
├── briefing.md
├── aprendizados-pixel-map.md
├── design/              ← dados estruturados (pixel_map.json)
├── plantas/             ← plantas baixas
├── scripts/             ← .js, .jsx, server.js
├── fonts/               ← TTFs locais para geração de PNG
├── visualizadores/      ← HTMLs de trabalho (não vão pro cliente)
├── apresentacao/        ← material para o cliente (HTML, PDF)
└── output/              ← assets de produção
    ├── after-effects/   ← .aep
    ├── blender/         ← .blend
    ├── midias/          ← imagens e vídeos gerados externamente (Freepik, etc)
    ├── pixel-maps/
    │   ├── principal/   ← PNG exportado
    │   └── reuniao/
    └── renders/
        ├── wip/         ← previews intermediários
        └── final/       ← aprovados para entrega
```

**Regra:** `output/` só recebe assets que vão para produção ou cliente. HTMLs, scripts e fontes ficam fora.

---

## 2. Servidor Node.js local

Todo job com HTMLs deve ter um servidor local. Criar `scripts/server.js` com Express:

- `GET /` → index com links para visualizadores e apresentação
- `GET /visualizadores/:file` e `/apresentacao/:file` → serve os HTMLs
- `POST /salvar-pixelmap` → recebe PNG em base64, salva em `output/pixel-maps/{sala}/`
- `GET /output/**` → serve assets estáticos

**Comando:** `npm run dev` → `http://localhost:3000`

**Por que:** HTMLs abertos direto do filesystem têm restrições de canvas/CORS. Com servidor, o download via canvas funciona corretamente e o PNG pode ser salvo direto no disco.

---

## 3. Fonte consistente entre HTML e PNG gerado

**Problema:** o browser usa Consolas/Fira Code corretamente, mas `sharp` (librsvg) no Node.js pega uma fonte diferente do sistema — o PNG fica com fonte errada.

**Solução:** embedar a fonte como base64 diretamente no SVG antes de passar para o `sharp`:

```js
const fontB64 = fs.readFileSync('fonts/Consolas.ttf').toString('base64');
// Inserir no SVG:
// <style>@font-face { font-family: 'Consolas'; src: url('data:font/truetype;base64,${fontB64}'); }</style>
```

**Fonte:** copiar `Consolas.ttf` e `Consolas-Bold.ttf` de `C:/Windows/Fonts/` para `fonts/` do projeto.

---

## 4. Regra de escala e cálculo do canvas

```
px/m  = pixels_referencia / metros_referencia
px    = metros × px_por_metro   (arredondar sempre para par, para baixo)

canvas_w = P4_h_px + piso_w_px + P2_h_px
canvas_h = P1_h_px + piso_d_px + P3_h_px

grade    = MDC(todas_as_dimensões_px)
```

**Nunca aceitar dimensões de pixel do cliente sem verificar pela escala.**

**Erro clássico:** panorama declarado ignora uma parede — somar px de todas as paredes e conferir.

---

## 5. Blender — pixel map na cena

### Estrutura de objetos
- `P1_Frente`, `P2_Direita`, `P3_Fundo`, `P4_Esquerda`, `Piso` — planos simples (~15cm espessura)
- `CAM_Publico_A/B/C` — câmeras perspectiva (~1,6m altura dos olhos)
- `ADA_Controls` — empty organizador
- Figura humana — referência de escala

### Aplicar o pixel map como textura
Os UV maps das paredes já estão configurados para cada seção do pixel map. Para aplicar:
1. Criar nó `Image Texture` no material compartilhado
2. Conectar `Color` → `Base Color` e `Emission Color` do Principled BSDF
3. Definir `Emission Strength = 1.0` (visualização sem dependência de luz)

### Relinkar imagem movida
```python
img = bpy.data.images.get("NomeDaImagem")
img.filepath = r"novo\caminho\imagem.png"
img.reload()
```

### Painel ADA — Textura Mestra
Criar script Python no .blend com:
- **Switcher** `PIXEL MAP / MÍDIA` como custom property enum no Empty
- Se Mídia: dropdown de imagem (PointerProperty → Image)
- Botão **Aplicar** que atualiza o nó Image Texture do material
- Registrar como painel na aba `ADA` do N-panel (`bl_category = 'ADA'`)

O pixel map fica como estado padrão — sempre tem retorno garantido.

---

## 6. After Effects — relinkar footage movido

Quando o arquivo foi movido para uma nova pasta, usar JSX externo:

```javascript
// scripts/relink-pixelmap.jsx
var newFile = new File('novo\\caminho\\arquivo.png');
for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    if (item instanceof FootageItem && item.name.indexOf('pixelmap') !== -1) {
        item.replace(newFile);
    }
}
```

Executar via MCP: `executeScript` com `scriptPath`.

---

## 7. Estrutura de comp AE para sala imersiva

```
Comp principal (canvas_w × canvas_h, 30fps)
├── P1 — Frente    [pre-comp sw×sh]
├── P2 — Direita
├── P3 — Fundo
├── P4 — Esquerda
├── PISO
└── Pixel Map Completo  [PNG base]
```

**Posicionamento:**
```
PNG pos. na pre-comp = [canvas_w/2 - sx,  canvas_h/2 - sy]
Pre-comp pos. na main = [sx + sw/2,  sy + sh/2]
```

---

## 8. Geração de mídia com IA — prompt para sala imersiva

**Conceito validado neste job:** quadrados/partículas saindo do centro → chegam na borda = paredes da sala. Cria sensação de expansão do espaço a partir do espectador.

**Referências de estética:** Ryoji Ikeda, Anti VJ, Silas Vetta — matemático, preciso, orgânico e digital ao mesmo tempo.

**Estrutura de prompt que funcionou:**
- Definir o movimento (radial, centro → borda)
- Especificar a forma base (quadrados, partículas, grid)
- Paleta restrita e com nome (black, electric yellow, cyan-blue, white)
- Comportamento do sistema de partículas (organizam-se em formas, depois dissolvem)
- Para animação: adicionar "seamless loop", "no camera movement", "4K wide format"

**Pasta para guardar as mídias:** `output/midias/`

---

## 9. After Effects — comps 3D e preview orbital

### Montar sala em 3D no AE
Cada comp de parede (P1–P4, PISO) como layer 3D numa comp PREVIEW.

**Regra de orientação (face para o interior da sala):**
```
P1 (Z=-halfD): Y = 180°   P3 (Z=+halfD): Y = 0°
P2 (X=+halfW): Y = +90°   P4 (X=-halfW): Y = -90°
PISO (Y=+halfH): X = +90°
```
Câmera dentro da sala: posição próxima a P3 olhando para P1.

### Câmera orbital com slider
1. Criar null 3D "CAMERA RIG" no centro da sala
2. Adicionar **Slider Control** "ANGULO" no CAMERA RIG
3. Expressão na posição da câmera:
```javascript
var rig = thisComp.layer("CAMERA RIG");
var a   = rig.effect("ANGULO")("Slider") * Math.PI / 180;
var r   = 180; // raio dentro da sala
[cx + r * Math.sin(a), cy, r * Math.cos(a)];
```
4. POI da câmera fixo no centro: `cam.property("Point of Interest").setValue([cx, cy, 0])`
5. Arrastar slider 0–360° → câmera orbita mantendo campo de visão

### CONTEUDO - SUBSTITUIR AQUI
Master comp (4596×4344) com as 5 superfícies no layout flat do pixel map.
- Wall comps PREVIEW referenciam CONTEUDO → alterar CONTEUDO atualiza todas as paredes no PREVIEW 3D
- Sem referência circular: wall comps originais usam PNG; wall comps PREVIEW usam CONTEUDO
- Estrutura: CONTEUDO → P1 PREVIEW / P2 PREVIEW / ... → comp PREVIEW 3D

### Organização de pastas no projeto AE
```
ASSETS    — footages (PNG, vídeos)
COMPS     — wall comps originais + CONTEUDO
PREVIEW   — wall comps PREVIEW + comp PREVIEW 3D
RENDER FINAL — output de renders
```

### JSX para montar comp PREVIEW e organizar projeto
Scripts em `scripts/`:
- `criar-preview-3d.jsx` — cria comp PREVIEW com 5 layers 3D + câmera
- `criar-comp-conteudo.jsx` — cria CONTEUDO e faz replaceSource nas paredes
- `criar-preview-walls.jsx` — cria wall comps PREVIEW com CONTEUDO como source
- `organizar-projeto-ae.jsx` — renomeia ALL CAPS, cria pastas, move itens
- `preview-camera-orbit.jsx` — adiciona CAMERA RIG + slider ANGULO

---

## 10. Landing page e publicação GitHub Pages

### Estrutura
- `index.html` na raiz → GitHub Pages serve como landing
- Caminhos relativos (sem servidor): `output/pixel-maps/...`, `docs/...`
- Servidor local (`npm run dev`) usa `/download/pixelmap` e `/download/projeto`

### Downloads
- **Pixel map PNG** — link direto ao arquivo no repo (atributo `download`)
- **Projeto leve** (~3MB, sem vídeo) — ZIP commitado no repo
- **Projeto completo** (com vídeo 145MB) — GitHub Release asset:
  ```
  https://github.com/USER/REPO/releases/latest/download/NOME.zip
  ```
  Criar release localmente com `gh release create v1.0 --attach arquivo.zip`

### Limite de tamanho GitHub
- Arquivo normal: **máx 100 MB** (bloqueado acima disso)
- Git LFS: até 2 GB/arquivo, mas plano grátis tem 1 GB banda/mês
- **GitHub Releases: até 2 GB por asset, sem limite de banda** ← usar para vídeo/ZIP grande

### Servidor local — novo endpoint /docs
Adicionar rota estática para pasta docs/ servir screenshots:
```js
app.use('/docs', express.static(path.join(ROOT, 'docs')));
```

### Reiniciar processo no Windows via Git Bash
`taskkill /F /PID` falha no Git Bash pois `/F` vira `F:/`.
Usar `//F` e `//PID`:
```bash
taskkill //F //PID 12345
```

---

## 11. TODO — Skills a criar

- **`prompt-ai-visual`** — skill para padronizar o processo de geração de imagens/vídeos com IA:
  - Conduz o briefing visual (conceito, paleta, movimento, referências)
  - Gera prompts otimizados para Freepik, Midjourney, Runway, Sora etc
  - Considera o contexto de projeção (sala imersiva, palco, LED wall)
  - Variantes: estática, loop, transição

---

## 10. Preview em tempo real: AE → Blender via Spout

**Conceito:** Spout é um framework Windows para compartilhar texturas entre aplicações em tempo real (sem renderizar arquivo). Latência mínima, sem compressão.

**Fluxo:**
```
After Effects (Spout Sender) → GPU texture compartilhada → Blender (Spout Receiver addon) → nó Image Texture dos projetores
```

**Componentes necessários:**
- **AE → Spout:** plugin `Spout2 Sender for After Effects` (buscar em spout.zeal.co ou repositórios da comunidade)
- **Blender → Spout:** addon `blender-spout` (buscar no GitHub por "blender spout addon")
  - Instalar como addon normal: Preferences → Add-ons → Install from disk
  - Adiciona nó `Spout Receiver` nos shader nodes
  - Conectar saída `Color` do nó Spout no lugar do nó Image Texture existente

**No painel ADA — The Space:**
- Futuro: adicionar modo `SPOUT` no switcher (PIXEL MAP / MÍDIA / SPOUT)
- Quando ativo, conecta o nó Spout nos projetores em vez da imagem estática

**Alternativa se não houver plugin AE nativo:**
```
AE preview → OBS captura janela AE → OBS Spout output → Blender
```
OBS Virtual Camera também funciona como fallback.

**Por que Spout e não NDI:**
- NDI comprime o sinal (H.264/HEVC), Spout compartilha a textura na GPU sem compressão
- Para conteúdo 4K+ em sala imersiva, Spout é mais confiável
- Resolume Arena também recebe Spout nativamente

---

## 11. AE MCP — setup e executeScript

Ver configuração completa em `.mcp.json` do projeto.

O `run-script` só aceita nomes da lista fechada. Para rodar JSX customizado:
1. Escrever arquivo `.jsx` em `scripts/`
2. Chamar `executeScript` com `scriptPath`
3. O handler `executeScript` precisa estar no `mcp-bridge-auto.jsx` instalado em `AppData\Roaming\Adobe\After Effects\`

**Bridge funciona por polling:** o painel lê `Documents/ae-mcp-bridge/ae_command.json` a cada 2s. Reabrir o painel se parar de responder.
