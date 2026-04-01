/**
 * Cria comp "Preview" com as 5 superfícies em 3D
 * Run via: executeScript com scriptPath apontando para este arquivo
 */

app.beginUndoGroup("Criar Preview 3D");

var project = app.project;
var CW = 1920, CH = 1080;

function findComp(name) {
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (item instanceof CompItem && item.name === name) return item;
    }
    return null;
}

// Nomes com em dash (—)
var p1   = findComp("P1 \u2014 Frente");
var p2   = findComp("P2 \u2014 Direita");
var p3   = findComp("P3 \u2014 Fundo");
var p4   = findComp("P4 \u2014 Esquerda");
var piso = findComp("PISO");

var missing = [];
if (!p1)   missing.push("P1 — Frente");
if (!p2)   missing.push("P2 — Direita");
if (!p3)   missing.push("P3 — Fundo");
if (!p4)   missing.push("P4 — Esquerda");
if (!piso) missing.push("PISO");

if (missing.length > 0) {
    app.endUndoGroup();
    "ERRO: comps não encontradas: " + missing.join(", ");
} else {

    // Remover Preview existente se houver
    for (var i = project.numItems; i >= 1; i--) {
        var it = project.item(i);
        if (it instanceof CompItem && it.name === "Preview") it.remove();
    }

    var prev = project.items.addComp("Preview", CW, CH, 1, 180, 30);
    prev.bgColor = [0.04, 0.04, 0.04];

    // Escala: 25% das dimensões reais de pixel
    var SC = 25;

    // Metades da sala (px × escala / 100)
    var halfW = 1080 * SC / 100;   // metade da largura  (P1/P3 = 2160px)
    var halfD = 954  * SC / 100;   // metade da profundidade (PISO h = 1908px)
    var halfH = 609  * SC / 100;   // metade da altura das paredes (1218px)

    var cx = CW / 2;  // 960
    var cy = CH / 2;  // 540

    // ─────────────────────────────────────────────────────────
    // Câmera DENTRO da sala, encostada em P3 (fundo), olhando
    // para P1 (frente). Vista natural mostrando 3 paredes.
    // Paredes devem ter face voltada para o INTERIOR da sala.
    //
    // Regra AE 3D: face padrão de um layer aponta para -Z.
    //   P1 (em -Z): para encarar +Z (interior) → Y = 180°
    //   P3 (em +Z): para encarar -Z (interior) → Y = 0°
    //   P2 (em +X): para encarar -X (interior) → Y = -90°
    //   P4 (em -X): para encarar +X (interior) → Y = +90°
    // ─────────────────────────────────────────────────────────

    // ── P1 Frente (2160×1218) ─────────────────────────────
    var l1 = prev.layers.add(p1);
    l1.threeDLayer = true;
    l1.property("Position").setValue([cx, cy, -halfD]);
    l1.property("Y Rotation").setValue(180);   // face aponta +Z (para dentro) ✓
    l1.property("Scale").setValue([SC, SC, SC]);

    // ── P3 Fundo (2160×1218) ──────────────────────────────
    var l3 = prev.layers.add(p3);
    l3.threeDLayer = true;
    l3.property("Position").setValue([cx, cy, halfD]);
    l3.property("Y Rotation").setValue(0);     // face aponta -Z (para dentro) ✓
    l3.property("Scale").setValue([SC, SC, SC]);

    // ── P2 Direita (comp 1218×1908) ──────────────────────
    // Y=+90° → face aponta -X (inward). Sem Z rotation.
    var l2 = prev.layers.add(p2);
    l2.threeDLayer = true;
    l2.property("Position").setValue([cx + halfW, cy, 0]);
    l2.property("Y Rotation").setValue(90);
    l2.property("Scale").setValue([SC, SC, SC]);

    // ── P4 Esquerda (comp 1218×1908) ─────────────────────
    // Y=-90° → face aponta +X (inward). Sem Z rotation.
    var l4 = prev.layers.add(p4);
    l4.threeDLayer = true;
    l4.property("Position").setValue([cx - halfW, cy, 0]);
    l4.property("Y Rotation").setValue(-90);
    l4.property("Scale").setValue([SC, SC, SC]);

    // ── PISO (2160×1908) ──────────────────────────────────
    // X=+90° → face aponta +Y (chão, para baixo) ✓
    var lp = prev.layers.add(piso);
    lp.threeDLayer = true;
    lp.property("Position").setValue([cx, cy + halfH, 0]);
    lp.property("X Rotation").setValue(90);
    lp.property("Scale").setValue([SC, SC, SC]);

    // ── Câmera — encostada em P3, olhando para P1 ─────────
    // Posição: 80% do caminho até P3, ligeiramente acima do centro
    // POI: parede P1 ligeiramente acima do centro → 3 paredes visíveis
    var cam = prev.layers.addCamera("CAM Preview", [cx, cy]);
    cam.property("Position").setValue([cx, cy - 30, halfD * 0.75]);
    cam.property("Point of Interest").setValue([cx, cy + 10, -halfD]);

    app.endUndoGroup();
    "Preview criado: " + (prev.numLayers - 1) + " superfícies + 1 câmera";
}
