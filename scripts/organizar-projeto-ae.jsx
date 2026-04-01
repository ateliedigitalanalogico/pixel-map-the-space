/**
 * Organiza projeto AE:
 * 1. Renomeia comps para ALL CAPS
 * 2. Restaura wall comps para usar PNG (evita referência circular)
 * 3. Monta CONTEUDO com wall comps nas posições do pixel map
 * 4. Cria pastas: ASSETS, COMPS, PREVIEW, RENDER FINAL
 * 5. Move itens para as pastas corretas
 * 6. Deleta TheSpace_PixelMap_Imersiva
 */

app.beginUndoGroup("Organizar projeto");
var project = app.project;

// ── Helpers ───────────────────────────────────────────────
function findComp(name) {
    for (var i = 1; i <= project.numItems; i++) {
        var it = project.item(i);
        if (it instanceof CompItem && it.name === name) return it;
    }
    return null;
}
function findFootage(partial) {
    for (var i = 1; i <= project.numItems; i++) {
        var it = project.item(i);
        if (it instanceof FootageItem && it.name.toLowerCase().indexOf(partial.toLowerCase()) !== -1) return it;
    }
    return null;
}
function findFolder(name) {
    for (var i = 1; i <= project.numItems; i++) {
        var it = project.item(i);
        if (it instanceof FolderItem && it.name === name) return it;
    }
    return null;
}

// ── 1. Encontrar itens existentes ─────────────────────────
var pngFootage = findFootage('pixelmap');
if (!pngFootage) pngFootage = findFootage('pixel');

var oldNames = {
    p1:   "P1 \u2014 Frente",
    p2:   "P2 \u2014 Direita",
    p3:   "P3 \u2014 Fundo",
    p4:   "P4 \u2014 Esquerda",
    piso: "PISO",
    prev: "Preview",
    cont: "conteudo - substituir aqui"
};

var wallComps = {
    p1:   findComp(oldNames.p1),
    p2:   findComp(oldNames.p2),
    p3:   findComp(oldNames.p3),
    p4:   findComp(oldNames.p4),
    piso: findComp(oldNames.piso)
};
var prevComp = findComp(oldNames.prev);
var contComp = findComp(oldNames.cont);

// ── 2. Restaurar wall comps para usar PNG ─────────────────
// (remove dependência circular: wall → CONTEUDO → wall)
if (pngFootage) {
    for (var key in wallComps) {
        var wc = wallComps[key];
        if (!wc) continue;
        for (var l = 1; l <= wc.numLayers; l++) {
            var ly = wc.layer(l);
            if (ly.source instanceof CompItem) {
                ly.replaceSource(pngFootage, false);
                break;
            }
        }
    }
}

// ── 3. Renomear wall comps para ALL CAPS ──────────────────
var newNames = {
    p1:   "P1 \u2014 FRENTE",
    p2:   "P2 \u2014 DIREITA",
    p3:   "P3 \u2014 FUNDO",
    p4:   "P4 \u2014 ESQUERDA",
    piso: "PISO"
};
for (var key in wallComps) {
    if (wallComps[key]) wallComps[key].name = newNames[key];
}
if (prevComp) prevComp.name = "PREVIEW";
if (contComp) contComp.name = "CONTEUDO - SUBSTITUIR AQUI";

// Atualizar referência
contComp = findComp("CONTEUDO - SUBSTITUIR AQUI");

// ── 4. Montar CONTEUDO com wall comps nas posições ────────
// Posições do pixel map (center de cada seção):
// P1:   x=1218, y=0,    w=2160, h=1218  → center (2298, 609)
// P4:   x=0,    y=1218, w=1218, h=1908  → center (609,  2172)
// PISO: x=1218, y=1218, w=2160, h=1908  → center (2298, 2172)
// P2:   x=3378, y=1218, w=1218, h=1908  → center (3987, 2172)
// P3:   x=1218, y=3126, w=2160, h=1218  → center (2298, 3735)
if (contComp) {
    // Limpar layers existentes
    while (contComp.numLayers > 0) {
        contComp.layer(contComp.numLayers).remove();
    }

    // Pixel map PNG como fundo (locked)
    if (pngFootage) {
        var bg = contComp.layers.add(pngFootage);
        bg.property("Position").setValue([4596/2, 4344/2]);
        bg.locked = true;
        bg.label = 9; // cinza
    }

    // Wall comps nas posições do pixel map (ordem: fundo → frente)
    var layout = [
        { comp: wallComps.piso, pos: [2298, 2172], name: "PISO"       },
        { comp: wallComps.p4,   pos: [609,  2172], name: "P4 ESQUERDA"},
        { comp: wallComps.p2,   pos: [3987, 2172], name: "P2 DIREITA" },
        { comp: wallComps.p3,   pos: [2298, 3735], name: "P3 FUNDO"   },
        { comp: wallComps.p1,   pos: [2298, 609],  name: "P1 FRENTE"  }
    ];

    for (var n = 0; n < layout.length; n++) {
        var item = layout[n];
        if (!item.comp) continue;
        var lay = contComp.layers.add(item.comp);
        lay.property("Position").setValue(item.pos);
        lay.name = item.name;
    }
}

// ── 5. Criar pastas ───────────────────────────────────────
var folders = {};
var folderNames = ["ASSETS", "COMPS", "PREVIEW", "RENDER FINAL"];
for (var f = 0; f < folderNames.length; f++) {
    var existing = findFolder(folderNames[f]);
    folders[folderNames[f]] = existing ? existing : project.items.addFolder(folderNames[f]);
}

// ── 6. Mover itens para pastas ────────────────────────────
// COMPS: wall comps + CONTEUDO
for (var key in wallComps) {
    if (wallComps[key]) wallComps[key].parentFolder = folders["COMPS"];
}
if (contComp) contComp.parentFolder = folders["COMPS"];

// PREVIEW: Preview comp
var previewComp = findComp("PREVIEW");
if (previewComp) previewComp.parentFolder = folders["PREVIEW"];

// ASSETS: todos os footage items
for (var i = 1; i <= project.numItems; i++) {
    var it = project.item(i);
    if (it instanceof FootageItem) {
        it.parentFolder = folders["ASSETS"];
    }
}

// ── 7. Deletar TheSpace_PixelMap_Imersiva ─────────────────
var toDelete = ["TheSpace_PixelMap_Imersiva", "ikeda-antivj_particles_v1_h264.mp4 Comp 1"];
for (var d = 0; d < toDelete.length; d++) {
    var old = findComp(toDelete[d]);
    if (old) old.remove();
}

app.endUndoGroup();
"Projeto organizado. CONTEUDO tem " + (contComp ? contComp.numLayers : '?') + " layers.";
