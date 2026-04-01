// =============================================================
// TheSpace — Pixel Map | Criar comp no After Effects
// ADA 2026
// Estrutura:
//   Comp principal 4596×4344
//   ├── Pixel Map Completo (PNG full)
//   └── 5 pre-comps, uma por superfície:
//       cada pre-comp tem o tamanho exato da superfície
//       e o PNG posicionado para que o recorte correto preencha o frame
// =============================================================

(function () {

    var PNG_PATH  = "E:\\ADA Dropbox\\ADA (1)\\2026\\pixel-map-the-space\\pixel-maps\\thespace-imersiva-principal-pixelmap.png";
    var MAIN_NAME = "TheSpace_PixelMap_Imersiva";
    var COMP_W    = 4596;
    var COMP_H    = 4344;
    var FPS       = 30;
    var DUR       = 180; // 3 min

    // Superfícies: [nome, sx, sy, sw, sh]
    var surfaces = [
        ["P1 — Frente",   1218, 0,    2160, 1218],
        ["P4 — Esquerda", 0,    1218, 1218, 1908],
        ["PISO",          1218, 1218, 2160, 1908],
        ["P2 — Direita",  3378, 1218, 1218, 1908],
        ["P3 — Fundo",    1218, 3126, 2160, 1218]
    ];

    // Âncora padrão do PNG (centro da imagem 4596×4344)
    var PNG_AX = COMP_W / 2; // 2298
    var PNG_AY = COMP_H / 2; // 2172

    // ── 1. Importar PNG ──────────────────────────────────────
    var pngFile = new File(PNG_PATH);
    if (!pngFile.exists) {
        alert("PNG não encontrado:\n" + PNG_PATH);
        return;
    }
    var importOpts     = new ImportOptions(pngFile);
    importOpts.sequence = false;
    var footage        = app.project.importFile(importOpts);
    footage.name       = "thespace-imersiva-principal-pixelmap.png";

    // ── 2. Criar pasta no projeto ────────────────────────────
    var folder = app.project.items.addFolder("TheSpace_PixelMap");
    footage.parentFolder = folder;

    // ── 3. Criar composição principal ────────────────────────
    // Remove comp anterior se existir
    for (var k = app.project.numItems; k >= 1; k--) {
        if (app.project.item(k).name === MAIN_NAME) {
            app.project.item(k).remove();
        }
    }

    var mainComp = app.project.items.addComp(MAIN_NAME, COMP_W, COMP_H, 1, DUR, FPS);
    mainComp.bgColor = [0, 0, 0];
    mainComp.parentFolder = folder;

    // ── 4. Layer base: Pixel Map Completo ────────────────────
    var fullLayer = mainComp.layers.add(footage);
    fullLayer.name = "Pixel Map Completo";
    fullLayer.property("Position").setValue([PNG_AX, PNG_AY]);

    // ── 5. Pre-comps por superfície ──────────────────────────
    // Adicionados em ordem reversa para P1 ficar no topo
    for (var i = surfaces.length - 1; i >= 0; i--) {
        var s  = surfaces[i];
        var nm = s[0]; // nome
        var sx = s[1]; // x top-left no canvas principal
        var sy = s[2]; // y top-left no canvas principal
        var sw = s[3]; // largura da superfície
        var sh = s[4]; // altura da superfície

        // Cria pre-comp com o tamanho exato da superfície
        var preComp = app.project.items.addComp(nm, sw, sh, 1, DUR, FPS);
        preComp.bgColor = [0, 0, 0];
        preComp.parentFolder = folder;

        // Adiciona o PNG à pre-comp
        // Queremos que o pixel [sx, sy] do PNG coincida com [0, 0] da pre-comp
        // Âncora do PNG está em [PNG_AX, PNG_AY]
        // Posição no frame da pre-comp = [PNG_AX - sx, PNG_AY - sy]
        var pngInPrecomp = preComp.layers.add(footage);
        pngInPrecomp.name = "PNG";
        pngInPrecomp.property("Position").setValue([PNG_AX - sx, PNG_AY - sy]);

        // Adiciona a pre-comp à comp principal
        // A pre-comp deve estar posicionada em [sx, sy] no canvas principal
        // O anchor da pre-comp é seu centro → position = [sx + sw/2, sy + sh/2]
        var preLayer = mainComp.layers.add(preComp);
        preLayer.name = nm;
        preLayer.property("Position").setValue([sx + sw / 2, sy + sh / 2]);
    }

    // Garante que "Pixel Map Completo" fique no fundo
    fullLayer.moveToEnd();

    // Abre a comp principal no viewer
    mainComp.openInViewer();

})();
